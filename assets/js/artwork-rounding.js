import {filterCoverage} from './solid-mask.js?v=81';
// Round the completed coverage, then reconstruct an antialiased, crisp contour.
// Radius is relative to the source canvas, not its raster resolution.
export function roundArtwork(data,w,h,layer,{fullWidth=w,fullHeight=h,coverageOnly=false,workspace={}}={}){
  const amount=Math.max(0,Math.min(100,layer.printRounding??0));
  if(!amount)return data;
  const radius=(amount/100)**1.6*24*Math.min(fullWidth,fullHeight)/1024;
  if(radius<.05)return data;
  const n=w*h,stride=coverageOnly?1:4,offset=coverageOnly?0:3;
  if(workspace.size!==n){workspace.size=n;workspace.a=new Float32Array(n);workspace.b=new Float32Array(n);workspace.alpha=null;workspace.work=null;}
  const {a,b}=workspace;
  let peak=0,uniform=true,color=null;
  for(let j=0;j<n;j++){
    const value=data[j*stride+offset];a[j]=value;peak=Math.max(peak,value);
    if(!coverageOnly&&value&&uniform){const i=j*4,r=data[i],g=data[i+1],b=data[i+2];if(!color)color=[r,g,b];else if(color[0]!==r||color[1]!==g||color[2]!==b)uniform=false;}
  }
  if(!peak)return data;
  const r=Math.max(1,Math.round(radius)),mix=Math.min(1,radius),edge=Math.max(.012, .28/(r+1));
  for(let pass=0;pass<3;pass++){filterCoverage(a,b,w,h,r,false,'blur');filterCoverage(b,a,w,h,r,true,'blur');}
  // Retain a blurred alpha for color extension into newly rounded inner corners.
  const alpha=coverageOnly||uniform?null:(workspace.alpha??=new Float32Array(n));
  if(alpha)alpha.set(a);
  let extend=false;
  for(let j=0;j<n;j++){
    const t=Math.max(0,Math.min(1,(a[j]/peak-.5+edge)/(2*edge))),old=data[j*stride+offset];
    const next=Math.round(old+(peak*t*t*(3-2*t)-old)*mix);
    b[j]=next;if(!coverageOnly&&next>old)extend=true;
  }
  const result=new data.constructor(data);
  if(extend&&uniform){
    for(let j=0;j<n;j++)if(b[j]>data[j*4+3]){result[j*4]=color[0];result[j*4+1]=color[1];result[j*4+2]=color[2];}
  }else if(extend)for(let c=0;c<3;c++){
    const work=workspace.work??=new Float32Array(n);
    for(let j=0;j<n;j++)a[j]=data[j*4+c]*data[j*4+3];
    for(let pass=0;pass<3;pass++){filterCoverage(a,work,w,h,r,false,'blur');filterCoverage(work,a,w,h,r,true,'blur');}
    for(let j=0;j<n;j++)if(b[j]>data[j*4+3]&&alpha[j]>0)result[j*4+c]=Math.round(a[j]/alpha[j]);
  }
  for(let j=0;j<n;j++)result[j*stride+offset]=b[j];
  return result;
}

// Bounded scratch storage and last-radius reuse. Returned buffers stay separate
// from retained buffers so worker transfers cannot detach the cached result.
export function createArtworkRounder(){
  let workspace={},input=null,key='',cached=null;
  const render=(data,w,h,layer,options={})=>{
    const radius=(Math.max(0,Math.min(100,layer.printRounding??0))/100)**1.6*24*Math.min(options.fullWidth??w,options.fullHeight??h)/1024;
    const next=[w,h,!!options.coverageOnly,Math.max(1,Math.round(radius)),Math.min(1,radius),radius<.05].join('/');
    if(input===data&&key===next&&cached)return new cached.constructor(cached);
    const out=roundArtwork(data,w,h,layer,{...options,workspace});
    input=data;key=next;cached=out===data?null:out;
    return cached?new cached.constructor(cached):out;
  };
  render.clear=()=>{workspace={};input=null;key='';cached=null;};return render;
}
