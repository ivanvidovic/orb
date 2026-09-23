import {capturePrintTone} from './print-texture.js?v=79';
import {applySolidMask} from './solid-mask.js?v=70';
import {patternWorkingSource} from './artwork-detail.js?v=78';
export const isGpuPrintPattern=layer=>layer.printVersion===2&&['dots','lines'].includes(layer.printPattern);
// Excludes pattern controls: every slider move can reuse the same source upload.
export function gpuPrintBaseKey(l){return `gpu/${l.fit?1:0}/${l.mode==='ink'?`ink/${l.solidMaskSource??'brightness'}/${l.solidSpread??0}/${l.solidEdgeSoftness??0}/${l.solidCutoff??12}/${l.solidSoftness??65}/${!!l.solidInvert}`:'color'}`;}
export function prepareGpuPrintBase(source,layer,limit,fit,canvas=()=>document.createElement('canvas')){
 const ink=layer.mode==='ink',margin=ink?Math.ceil((Math.abs(layer.solidSpread??0)+3*(layer.solidEdgeSoftness??0))*Math.min(source.width,source.height)/1024):0;
 const fitted=layer.fit?fit(source,margin):source;
 const image=patternWorkingSource(fitted,{...layer,printPattern:'dots'},limit,canvas),pad=ink?4:0;
 const out=canvas();out.width=image.width+2*pad;out.height=image.height+2*pad;
 const ctx=out.getContext('2d',{willReadFrequently:ink});ctx.drawImage(image,pad,pad);
 if(ink){
  const pixels=ctx.getImageData(pad,pad,image.width,image.height),data=pixels.data,tone=capturePrintTone(data,layer);
  applySolidMask(data,image.width,image.height,layer,image.orbCrop);
  // Solid ignores source RGB. Store pre-cutoff tone there at 16-bit precision
  // instead of allocating another texture. Alpha retains final mask coverage.
  for(let i=0,j=0;i<data.length;i+=4,j++){const value=Math.round(tone[j]*65535);data[i]=value>>>8;data[i+1]=value&255;data[i+2]=0;}
  ctx.putImageData(pixels,pad,pad);
 }
 return {raster:out,pad,ink,crop:image.orbCrop||{fullWidth:image.width,fullHeight:image.height,offsetX:0,offsetY:0}};
}
export function gpuPrintParameters(layer,crop){
 const size=Math.max(.001,Math.min(100,layer.printSize??40)),join=140-120*39/99;
 const cells=size<1?1120/size:size<40?1120*Math.pow(join/1120,(size-1)/39):140-120*(size-1)/99;
 const angle=(layer.printAngle??45)*Math.PI/180;
 return {period:Math.min(crop.fullWidth,crop.fullHeight)/cells,cos:Math.cos(angle),sin:Math.sin(angle),mark:Math.max(0,(layer.printMarkSize??50)/50),tone:Math.max(0,Math.min(1,(layer.printTone??100)/100)),erosion:Math.max(0,Math.min(1,(layer.printErosion??0)/100))};
}
export const GPU_PRINT_GLSL=`
uniform float uPrintType;
uniform vec4 uPrintCanvas,uPrintCrop,uPrintShape;
uniform vec2 uPrintTreatment;
float printCoverage(vec4 art,vec2 uv){
 float period=uPrintShape.x;
 vec2 p=(uv*uPrintCanvas.xy-vec2(uPrintCanvas.z)+uPrintCrop.zw-uPrintCrop.xy*.5)/period;
 vec2 f=fract(vec2(p.x*uPrintShape.y+p.y*uPrintShape.z,-p.x*uPrintShape.z+p.y*uPrintShape.y));
 float threshold;
 if(uPrintType>1.5)threshold=abs(f.y-.5)*2.;
 else{
  float r=length(f-.5);threshold=3.141592653589793*r*r;
  if(r>.5)threshold-=4.*(r*r*acos(clamp(.5/r,-1.,1.))-.5*sqrt(max(0.,r*r-.25)));
 }
 float tone=uPrintCanvas.w>.5?(art.r*256.+art.g)/257.:art.a;
 float coverage=clamp((1.-uPrintTreatment.x+uPrintTreatment.x*tone)*uPrintShape.w*uPrintShape.w,0.,1.)*(1.-uPrintTreatment.y);
 // Source-scale smoothing matches the CPU treatment. Derivatives add filtering
 // when projection onto a small or angled panel would otherwise shimmer.
 float aa=max(min(.25,.65/period),min(.5,fwidth(threshold)*.5));
 float screen=smoothstep(threshold-aa,threshold+aa,coverage);
 float resolved=clamp((period-.5)/1.5,0.,1.);
 float footprint=max(length(dFdx(p)),length(dFdy(p)));
 resolved*=1.-smoothstep(.5,1.5,footprint);
 if(coverage<=0.||coverage>=1.)return coverage;
 return mix(coverage,screen,resolved);
}`;
