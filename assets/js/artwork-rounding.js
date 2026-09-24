import {filterCoverage} from './solid-mask.js?v=81';
// Round the completed coverage, then reconstruct an antialiased, crisp contour.
// Radius is relative to the source canvas, not its raster resolution.
export function roundArtwork(data,w,h,layer,{fullWidth=w,fullHeight=h,coverageOnly=false}={}){
  const amount=Math.max(0,Math.min(100,layer.printRounding??0));
  if(!amount)return data;
  const radius=(amount/100)**1.6*24*Math.min(fullWidth,fullHeight)/1024;
  if(radius<.05)return data;
  const n=w*h,a=new Float32Array(n),b=new Float32Array(n),stride=coverageOnly?1:4,offset=coverageOnly?0:3;
  let peak=0;for(let j=0;j<n;j++){a[j]=data[j*stride+offset];peak=Math.max(peak,a[j]);}
  if(!peak)return data;
  const r=Math.max(1,Math.round(radius)),mix=Math.min(1,radius),edge=Math.max(.012, .28/(r+1));
  for(let pass=0;pass<3;pass++){filterCoverage(a,b,w,h,r,false,'blur');filterCoverage(b,a,w,h,r,true,'blur');}
  // Retain a blurred alpha for color extension into newly rounded inner corners.
  const alpha=coverageOnly?null:new Float32Array(a);
  let extend=false;
  for(let j=0;j<n;j++){
    const t=Math.max(0,Math.min(1,(a[j]/peak-.5+edge)/(2*edge))),old=data[j*stride+offset];
    const next=Math.round(old+(peak*t*t*(3-2*t)-old)*mix);
    b[j]=next;if(!coverageOnly&&next>old)extend=true;
  }
  const result=new data.constructor(data);
  if(extend)for(let c=0;c<3;c++){
    const work=new Float32Array(n);
    for(let j=0;j<n;j++)a[j]=data[j*4+c]*data[j*4+3];
    for(let pass=0;pass<3;pass++){filterCoverage(a,work,w,h,r,false,'blur');filterCoverage(work,a,w,h,r,true,'blur');}
    for(let j=0;j<n;j++)if(b[j]>data[j*4+3]&&alpha[j]>0)result[j*4+c]=Math.round(a[j]/alpha[j]);
  }
  for(let j=0;j<n;j++)result[j*stride+offset]=b[j];
  return result;
}
