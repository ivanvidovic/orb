// Deterministic artwork-space coverage patterns, shared by preview and export.
export const hasPrintTexture=l=>['dots','lines','grain'].includes(l.printPattern)&&(l.printStrength??100)>0;
export function applyPrintTexture(data,width,height,layer,{fullWidth=width,fullHeight=height,offsetX=0,offsetY=0}={}){
  if(!hasPrintTexture(layer))return;
  const size=Math.max(.001,Math.min(100,layer.printSize??40));
  // Extend the fine range logarithmically; default size 40 and coarser stay unchanged.
  const join=140-120*39/99,cells=size<1?1120/size:size<40?1120*Math.pow(join/1120,(size-1)/39):140-120*(size-1)/99;
  const period=Math.min(fullWidth,fullHeight)/cells;
  // Below pixel resolution, retain average ink coverage instead of aliasing.
  const resolved=Math.max(0,Math.min(1,(period-.5)/1.5));
  if(resolved===0)return;
  const angle=(layer.printAngle??45)*Math.PI/180,c=Math.cos(angle),s=Math.sin(angle),mix=(layer.printStrength??100)/100*resolved,aa=Math.min(.25,.65/period);
  const hash=(x,y)=>{let n=Math.imul(x,374761393)+Math.imul(y,668265263);n=Math.imul(n^(n>>>13),1274126177);return ((n^(n>>>16))>>>0)/4294967296;};
  for(let y=0;y<height;y++)for(let x=0;x<width;x++){
    const i=(y*width+x)*4+3,a=data[i]/255;if(a===0||a===1)continue;
    const px=(x+offsetX+.5-fullWidth/2)/period,py=(y+offsetY+.5-fullHeight/2)/period,u=px*c+py*s,v=-px*s+py*c;
    const fx=u-Math.floor(u),fy=v-Math.floor(v);let threshold;
    if(layer.printPattern==='lines')threshold=Math.abs(fy-.5)*2;
    else if(layer.printPattern==='grain'){
      const ix=Math.floor(u),iy=Math.floor(v),sx=fx*fx*(3-2*fx),sy=fy*fy*(3-2*fy);
      const a=hash(ix,iy),b=hash(ix+1,iy),c=hash(ix,iy+1),d=hash(ix+1,iy+1);
      const noise=(a+(b-a)*sx)*(1-sy)+(c+(d-c)*sx)*sy;
      threshold=Math.max(0,Math.min(1,(noise-.5)*1.6+.5));
    }
    else{
      const r=Math.hypot(fx-.5,fy-.5);
      threshold=Math.PI*r*r;
      if(r>.5)threshold-=4*(r*r*Math.acos(.5/r)-.5*Math.sqrt(r*r-.25));
    }
    const t=Math.max(0,Math.min(1,(a-threshold+aa)/(2*aa))),screen=t*t*(3-2*t);
    data[i]=Math.round(255*(a+(screen-a)*mix));
  }
}
