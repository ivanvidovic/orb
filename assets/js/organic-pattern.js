// Version-one organic structures. Pure seeded math, shared by preview and export.
// Only structure changes run generation; ordinary treatment edits reuse the field.
const N=256,cache=new Map(),MAX_FIELDS=12;
export const isOrganic=l=>l.printPattern==='maze'||l.printPattern==='branching';
const clamp=(v,a=0,b=1)=>Math.max(a,Math.min(b,v));
function random(seed){let n=((seed>>>0)^0x9e3779b9)||1;return ()=>{n^=n<<13;n^=n>>>17;n^=n<<5;return (n>>>0)/4294967296;};}
function maze(seed,density){
  const rand=random(seed),n=N*N;
  let a=new Float32Array(n).fill(1),b=new Float32Array(n),aa=new Float32Array(n),bb=new Float32Array(n);
  // Toroidal boundaries keep repetition continuous. Initial patches are irregular.
  for(let k=0;k<70;k++){
    const x=rand()*N|0,y=rand()*N|0;
    for(let dy=-3;dy<=3;dy++)for(let dx=-3;dx<=3;dx++){
      const i=((y+dy+N)%N)*N+(x+dx+N)%N;a[i]=.5;b[i]=.25+rand()*.08;
    }
  }
  const diffusion=1.1-density*.65,feed=.038,kill=.061;
  for(let step=0;step<850;step++){
    for(let y=0;y<N;y++){
      const row=y*N,up=((y+N-1)%N)*N,down=((y+1)%N)*N;
      for(let x=0;x<N;x++){
        const i=row+x,l=(x+N-1)%N,r=(x+1)%N,A=a[i],B=b[i],reaction=A*B*B;
        const la=-A+.2*(a[row+l]+a[row+r]+a[up+x]+a[down+x])+.05*(a[up+l]+a[up+r]+a[down+l]+a[down+r]);
        const lb=-B+.2*(b[row+l]+b[row+r]+b[up+x]+b[down+x])+.05*(b[up+l]+b[up+r]+b[down+l]+b[down+r]);
        aa[i]=clamp(A+diffusion*la-reaction+feed*(1-A));
        bb[i]=clamp(B+diffusion*.5*lb+reaction-(kill+feed)*B);
      }
    }
    [a,aa]=[aa,a];[b,bb]=[bb,b];
  }
  const field=new Float32Array(n);
  // Preserve the continuous simulation contour, rather than tracing binary
  // pixels. Gradient normalization gives a smooth approximate signed distance.
  for(let y=0;y<N;y++)for(let x=0;x<N;x++){
    const i=y*N+x,gx=(b[y*N+(x+1)%N]-b[y*N+(x+N-1)%N])*.5;
    const gy=(b[((y+1)%N)*N+x]-b[((y+N-1)%N)*N+x])*.5;
    field[i]=clamp((.19-b[i])/Math.max(.005,Math.hypot(gx,gy)),-16,16);
  }
  return field;
}
function branching(seed,density){
  const rand=random(seed),field=new Float32Array(N*N*4).fill(16),paths=[];
  const roots=Math.round(4+density*12);
  for(let k=0;k<roots;k++)paths.push({x:rand()*N,y:rand()*N,angle:rand()*Math.PI*2,steps:80+rand()*65,width:1.5+rand(),depth:0});
  function segment(ax,ay,bx,by,r){
    const pad=r+7,dx=bx-ax,dy=by-ay,length=dx*dx+dy*dy;
    for(let yy=Math.floor((Math.min(ay,by)-pad)*2);yy<=Math.ceil((Math.max(ay,by)+pad)*2);yy++)
      for(let xx=Math.floor((Math.min(ax,bx)-pad)*2);xx<=Math.ceil((Math.max(ax,bx)+pad)*2);xx++){
        const t=clamp(((xx*.5-ax)*dx+(yy*.5-ay)*dy)/length),d=Math.hypot(xx*.5-ax-t*dx,yy*.5-ay-t*dy)-r;
        const size=N*2,i=((yy%size+size)%size)*size+(xx%size+size)%size;if(d<field[i])field[i]=d;
      }
  }
  // Bounded tree growth with wandering paths and tapering offshoots.
  for(let p=0;p<paths.length&&p<230;p++){
    let {x,y,angle,steps,width,depth}=paths[p],turn=0;
    for(let k=0;k<steps;k++){
      turn=turn*.88+(rand()-.5)*.16;angle+=turn;
      const ax=x,ay=y;x+=Math.cos(angle)*1.15;y+=Math.sin(angle)*1.15;
      segment(ax,ay,x,y,Math.max(.45,width*(1-k/steps*.85)));
      if(depth<3&&k>12&&k<steps*.75&&rand()<.026+density*.025&&paths.length<230)
        paths.push({x,y,angle:angle+(rand()<.5?-1:1)*(.45+rand()*.55),steps:(steps-k)*(.6+rand()*.25),width:width*.67,depth:depth+1});
    }
  }
  return field;
}
export function organicField(layer){
  const density=clamp(Math.round(layer.printDensity??50)/100),seed=(layer.printSeed??1)>>>0;
  const key=[layer.printPattern,seed,density].join('/');
  if(cache.has(key)){const field=cache.get(key);cache.delete(key);cache.set(key,field);return field;}
  const data=layer.printPattern==='maze'?maze(seed,density):branching(seed,density);
  const field={data,size:layer.printPattern==='branching'?N*2:N};
  cache.set(key,field);if(cache.size>MAX_FIELDS)cache.delete(cache.keys().next().value);
  return field;
}
export function organicSampler(layer,fullWidth,fullHeight){
  if(layer.printPattern==='branching'&&layer.printBranchMode==='natural')return naturalSampler(layer,fullWidth,fullHeight);
  const {data,size:N}=organicField(layer);
  // Broad logarithmic scale, independent of strand thickness and generation.
  const scale=clamp(layer.printSize??40,.001,100),tile=Math.min(fullWidth,fullHeight)*.035*Math.pow(60,Math.max(1,scale)/100)*Math.min(1,scale);
  const angle=(layer.printAngle??45)*Math.PI/180,c=Math.cos(angle),s=Math.sin(angle),unit=N/tile;
  const thickness=((layer.printMarkSize??50)-50)*.07,aa=Math.max(.3,256/tile*.65);
  const sample=(x,y)=>{
    const u=((x-fullWidth/2)*c+(y-fullHeight/2)*s)*unit,v=(-(x-fullWidth/2)*s+(y-fullHeight/2)*c)*unit;
    const ix=Math.floor(u),iy=Math.floor(v),fx=u-ix,fy=v-iy,x0=(ix%N+N)%N,y0=(iy%N+N)%N,x1=(x0+1)%N,y1=(y0+1)%N;
    const d=(data[y0*N+x0]*(1-fx)+data[y0*N+x1]*fx)*(1-fy)+(data[y1*N+x0]*(1-fx)+data[y1*N+x1]*fx)*fy;
    return .5+(d-thickness)*.08;
  };
  return {sample,aa:aa*.08,mark:Math.SQRT1_2,resolved:1};
}

// Unique, bounded artwork-wide field. Paths cross root regions freely: no tile
// wrapping, mirrored copies or repeated stamps. Frozen seeds survive exports.
const naturalCache=new Map();
function naturalSampler(layer,w,h){
  const aspect=w/h,scale=clamp(layer.printSize??40,.001,100),density=clamp((layer.printDensity??50)/100);
  const fieldShort=1536*Math.min(aspect,1/aspect);
  const fineTile=fieldShort*.035*Math.pow(60,Math.max(1,scale)/100)*Math.min(1,scale);
  if(fineTile/256<=.12)return {sample:()=>.5,aa:.1,mark:Math.SQRT1_2,resolved:0};
  const key=[aspect,scale,density,layer.printSeed??1,layer.printAngle??45].join('/');
  let field=naturalCache.get(key);
  if(!field){
    const W=Math.max(32,Math.round(1536*Math.min(1,aspect))),H=Math.max(32,Math.round(1536*Math.min(1,1/aspect)));
    const tile=Math.min(W,H)*.035*Math.pow(60,Math.max(1,scale)/100)*Math.min(1,scale);
    // Below the field's sampling footprint, integrate into average coverage.
    // This avoids unstable aliasing and unbounded subpixel tree generation.
    const unit=Math.max(.38,tile/256),rand=random(layer.printSeed??1),data=new Float32Array(W*H).fill(16);
    const roots=Math.min(2500,Math.max(2,Math.round(W*H/(256*unit)**2*(4+density*12))));
    const paths=[],angle=(layer.printAngle??45)*Math.PI/180;
    for(let k=0;k<roots;k++)paths.push({x:rand()*W,y:rand()*H,a:rand()*Math.PI*2+angle,steps:80+rand()*65,width:1.5+rand(),depth:0});
    let budget=450000;
    for(let p=0;p<paths.length&&p<16000&&budget>0;p++){
      let {x,y,a,steps,width,depth}=paths[p],turn=0;
      for(let k=0;k<steps&&budget-->0;k++){
        turn=turn*.88+(rand()-.5)*.16;a+=turn;
        const ax=x,ay=y;x+=Math.cos(a)*1.15*unit;y+=Math.sin(a)*1.15*unit;
        const r=Math.max(.45,width*(1-k/steps*.85)),pad=(r+4)*unit+1,dx=x-ax,dy=y-ay,length=dx*dx+dy*dy;
        const top=Math.max(0,Math.floor(Math.min(ay,y)-pad)),bottom=Math.min(H-1,Math.ceil(Math.max(ay,y)+pad));
        const left=Math.max(0,Math.floor(Math.min(ax,x)-pad)),right=Math.min(W-1,Math.ceil(Math.max(ax,x)+pad));
        for(let yy=top;yy<=bottom;yy++)for(let xx=left;xx<=right;xx++){
          const t=clamp(((xx-ax)*dx+(yy-ay)*dy)/length),d=Math.hypot(xx-ax-t*dx,yy-ay-t*dy)/unit-r,i=yy*W+xx;
          if(d<data[i])data[i]=d;
        }
        if(depth<3&&k>12&&k<steps*.75&&rand()<.026+density*.025&&paths.length<16000)
          paths.push({x,y,a:a+(rand()<.5?-1:1)*(.45+rand()*.55),steps:(steps-k)*(.6+rand()*.25),width:width*.67,depth:depth+1});
      }
    }
    field={data,W,H,unit,tile};naturalCache.set(key,field);
    if(naturalCache.size>3)naturalCache.delete(naturalCache.keys().next().value);
  }
  const {data,W,H,unit,tile}=field,thickness=((layer.printMarkSize??50)-50)*.07;
  const sample=(x,y)=>{
    const u=clamp(x/w)*(W-1),v=clamp(y/h)*(H-1),ix=Math.floor(u),iy=Math.floor(v),fx=u-ix,fy=v-iy;
    const xx=Math.min(W-1,ix+1),yy=Math.min(H-1,iy+1);
    const d=(data[iy*W+ix]*(1-fx)+data[iy*W+xx]*fx)*(1-fy)+(data[yy*W+ix]*(1-fx)+data[yy*W+xx]*fx)*fy;
    return .5+(d-thickness)*.08;
  };
  return {sample,aa:Math.max(.3,.65/unit,.65/(unit*w/W))*.08,mark:Math.SQRT1_2,resolved:clamp((tile/256-.12)/.26)};
}
