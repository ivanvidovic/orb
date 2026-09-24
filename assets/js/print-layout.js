// Flat print charts use exactly the artwork quad transform used by the preview.
export const PRINT_PPI=300;
export function quadTransform(layer,q,image,meta,{fullLength=0,custom=false,offset=[0,0]}={}){
  const p=layer.placement,aspect=image.height/image.width;
  const w=fullLength?fullLength/aspect*p.scale:meta.w*p.scale*(q.printScale||1)/(!custom&&meta.side==='Sleeve'?Math.max(1,aspect):1),h=w*aspect;
  const [a,b,d,e]=q.basis,c=Math.cos(p.rot*Math.PI/180),s=Math.sin(p.rot*Math.PI/180);
  const x=(a*c+b*s)*w,y=(d*c+e*s)*w,u=(-a*s+b*c)*h,v=(-d*s+e*c)*h;
  return [x,y,u,v,q.origin[0]+a*offset[0]-b*offset[1]-(x+u)/2,q.origin[1]+d*offset[0]-e*offset[1]-(y+v)/2];
}
export function alphaBounds(data,w,h,stride=4){
  let x0=w,y0=h,x1=-1,y1=-1;
  for(let y=0,j=stride-1;y<h;y++)for(let x=0;x<w;x++,j+=stride)if(data[j]>0){x0=Math.min(x0,x);x1=Math.max(x1,x);y0=Math.min(y0,y);y1=Math.max(y1,y);}
  return x1<0?null:[x0/w,y0/h,(x1+1)/w,(y1+1)/h];
}
export function transformedBounds(m,r=[0,0,1,1]){
  const points=[[r[0],r[1]],[r[2],r[1]],[r[0],r[3]],[r[2],r[3]]].map(([x,y])=>[m[0]*x+m[2]*y+m[4],m[1]*x+m[3]*y+m[5]]);
  return [Math.min(...points.map(p=>p[0])),Math.min(...points.map(p=>p[1])),Math.max(...points.map(p=>p[0])),Math.max(...points.map(p=>p[1]))];
}
export function flattenTransform(m,basis){
  const [a,b,d,e]=basis,det=a*e-b*d;if(Math.abs(det)<1e-10)throw new Error('This print surface has no usable flat orientation.');
  const out=[];for(let i=0;i<6;i+=2)out.push((e*m[i]-b*m[i+1])/det,(-d*m[i]+a*m[i+1])/det);return out;
}
export function collectSurfaces(descriptors){
  const groups=new Map();
  for(const d of descriptors){let surface=groups.get(d.surface);if(!surface){surface={id:d.surface,name:d.surfaceName,kind:d.kind,layers:[],bounds:null};groups.set(d.surface,surface);}
    surface.layers.push(d);
    if(d.visible!==false&&(d.bounds||d.surfaceBounds)){const b=d.surfaceBounds||transformedBounds(d.matrix,d.bounds),old=surface.bounds;surface.bounds=old?[Math.min(old[0],b[0]),Math.min(old[1],b[1]),Math.max(old[2],b[2]),Math.max(old[3],b[3])]:b;}
  }
  // An all-hidden surface has no intended print. Its layers remain in the .orb and per-layer package.
  return [...groups.values()].filter(s=>s.bounds&&s.bounds[2]>s.bounds[0]&&s.bounds[3]>s.bounds[1]);
}
export function defaultPrintSize(surface){
  const [w,h]=surface.kind==='hat'?[5,3]:surface.kind==='hatbill'?[6,4]:surface.kind==='hatband'?[3,1]:surface.kind==='torso'?[12,18]:surface.kind==='sleeve'?[4,18]:surface.kind==='neck'?[4,4]:[8,10];
  const ratio=(surface.bounds[3]-surface.bounds[1])/(surface.bounds[2]-surface.bounds[0]);
  if(surface.kind.startsWith('hat')){const aw=(surface.bounds[2]-surface.bounds[0])/.0254,ah=aw*ratio;return {enabled:true,width:Math.max(w,Math.ceil(aw*10)/10),height:Math.max(h,Math.ceil(ah*10)/10),artWidth:+aw.toFixed(4)};}
  return {enabled:true,width:w,height:h,artWidth:Math.floor(Math.min(w,h/ratio)*1000)/1000};
}
export function printPlan(surface,size){
  const width=Number(size.width),height=Number(size.height),artWidth=Number(size.artWidth);
  if(![width,height,artWidth].every(v=>Number.isFinite(v)&&v>0))throw new Error(`${surface.name}: enter positive canvas and artwork sizes.`);
  const b=surface.bounds,unit=artWidth/(b[2]-b[0]),artHeight=(b[3]-b[1])*unit;
  if(artWidth>width+.00001||artHeight>height+.00001)throw new Error(`${surface.name}: artwork is ${artWidth.toFixed(2)} × ${artHeight.toFixed(2)} in. Enlarge the canvas or use Fit to canvas.`);
  const pxWidth=Math.round(width*PRINT_PPI),pxHeight=Math.round(height*PRINT_PPI);
  if(pxWidth<1||pxHeight<1||pxWidth>30000||pxHeight>30000||pxWidth*pxHeight>48000000)throw new Error(`${surface.name}: this canvas exceeds the 48-megapixel browser export budget at 300 PPI. Reduce its dimensions.`);
  const scale=unit*PRINT_PPI,ox=(pxWidth-artWidth*PRINT_PPI)/2-b[0]*scale,oy=(pxHeight-artHeight*PRINT_PPI)/2-b[1]*scale;
  const layers=surface.layers.map(l=>({...l,patch:l.patch?{...l.patch,matrix:l.patch.matrix.map((v,i)=>v*scale+(i===4?ox:i===5?oy:0))}:null,matrix:l.matrix.map((v,i)=>v*scale+(i===4?ox:i===5?oy:0))}));
  let pixels=pxWidth*pxHeight*2;
  for(const l of layers){const r=transformedBounds(l.matrix),w=Math.ceil(r[2])-Math.floor(r[0]),h=Math.ceil(r[3])-Math.floor(r[1]);
    if(w>30000||h>30000||w*h>48000000)throw new Error(`${surface.name}: one layer is too large to export safely. Reduce the artwork size.`);pixels+=w*h*2;
  }
  if(pixels>180000000)throw new Error(`${surface.name}: these layers exceed the browser export memory budget. Reduce the artwork or canvas size.`);
  return {...surface,layers,width:pxWidth,height:pxHeight,inches:{width,height,artWidth,artHeight},ppi:PRINT_PPI};
}
