import {isOrganic,organicSampler} from './organic-pattern.js?v=91-pocket';
import {resolveMaskSource} from './solid-mask.js?v=81';
// Deterministic artwork-space coverage patterns, shared by preview and export.
export const hasPrintTexture=l=>['dots','lines','grain','pixel','maze','branching'].includes(l.printPattern)&&(l.printVersion===2||(l.printStrength??100)>0);
export function applyPrintTexture(data,width,height,layer,{fullWidth=width,fullHeight=height,offsetX=0,offsetY=0,sourceTone=null}={}){
  if(layer.printPattern==='pixel')return;
  if(layer.printVersion===2)return applyTextureV2(data,width,height,layer,{fullWidth,fullHeight,offsetX,offsetY,sourceTone});
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

// Capture before Solid cutoff or Tint recoloring. Alpha is the tone in color modes.
export function capturePrintTone(data,layer){
  if(layer.printPattern==='pixel'||layer.printVersion!==2||!hasPrintTexture(layer))return null;
  const tone=new Float32Array(data.length/4),alpha=resolveMaskSource(data,layer)==='alpha';
  for(let i=0,j=0;i<data.length;i+=4,j++){
    const light=(data[i]*.299+data[i+1]*.587+data[i+2]*.114)/255;
    tone[j]=layer.mode==='ink'&&!alpha?(layer.solidInvert?1-light:light):data[i+3]/255;
  }
  return tone;
}
const clamp=v=>Math.max(0,Math.min(1,v));
function applyTextureV2(data,width,height,layer,{fullWidth,fullHeight,offsetX,offsetY,sourceTone}){
  if(!hasPrintTexture(layer))return;
  sourceTone??=capturePrintTone(data,layer);
  const organic=isOrganic(layer)?organicSampler(layer,fullWidth,fullHeight):null;
  const grain=layer.printPattern==='grain',size=Math.max(.001,Math.min(100,grain?(layer.printMarkSize??50):(layer.printSize??40))),join=140-120*39/99;
  const cells=size<1?1120/size:size<40?1120*Math.pow(join/1120,(size-1)/39):140-120*(size-1)/99;
  const period=Math.min(fullWidth,fullHeight)/cells,resolved=organic?organic.resolved:clamp((period-.5)/1.5);
  const angle=(layer.printAngle??45)*Math.PI/180,c=Math.cos(angle),s=Math.sin(angle);
  const response=clamp((layer.printTone??100)/100),erosion=clamp((layer.printErosion??0)/100);
  // Mark size biases area without changing the cell spacing. 50 is neutral.
  const mark=organic?organic.mark:grain?1:Math.max(0,(layer.printMarkSize??50)/50),aa=organic?organic.aa:Math.min(.25,.65/period);
  const hash=(x,y)=>{let n=Math.imul(x,374761393)+Math.imul(y,668265263);n=Math.imul(n^(n>>>13),1274126177);return ((n^(n>>>16))>>>0)/4294967296;};
  const noise=(u,v)=>{const x=Math.floor(u),y=Math.floor(v),fx=u-x,fy=v-y,sx=fx*fx*(3-2*fx),sy=fy*fy*(3-2*fy);return (hash(x,y)*(1-sx)+hash(x+1,y)*sx)*(1-sy)+(hash(x,y+1)*(1-sx)+hash(x+1,y+1)*sx)*sy;};
  for(let y=0;y<height;y++)for(let x=0;x<width;x++){
    const j=y*width+x,i=j*4+3,a=data[i]/255;if(a===0)continue;
    const coverage=clamp((1-response+response*sourceTone[j])*mark*mark)*(1-erosion);
    let screen=coverage;
    if(resolved>0&&coverage>0&&coverage<1){
      const px=(x+offsetX+.5-fullWidth/2)/period,py=(y+offsetY+.5-fullHeight/2)/period;
      const u=px*c+py*s,v=-px*s+py*c,ix=Math.floor(u),iy=Math.floor(v),fx=u-ix,fy=v-iy;
      let threshold;
      if(organic)threshold=organic.sample(x+offsetX+.5,y+offsetY+.5);
      else if(grain){

        threshold=clamp(((noise(u,v)*.75+noise(u*2.03+19.7,v*2.03-7.1)*.25)-.5)*1.8+.5);
      }
      else if(layer.printPattern==='lines')threshold=Math.abs(fy-.5)*2;
      else {
        let dx=fx-.5,dy=fy-.5;
        const r=Math.hypot(dx,dy);threshold=Math.PI*r*r;
        if(r>.5)threshold-=4*(r*r*Math.acos(.5/r)-.5*Math.sqrt(r*r-.25));
      }
      const t=clamp((coverage-threshold+aa)/(2*aa));screen=coverage+(t*t*(3-2*t)-coverage)*resolved;
    }
    // Final mask is authoritative: texture never restores cut-off ink or alpha.
    data[i]=Math.round(255*a*screen);
  }
}

// Pixelate the original before color treatment, using premultiplied block averages.
// Both preview and export use the full source so fitted crops do not shift the grid.
export function pixelateArtwork(source,layer,createCanvas=()=>document.createElement('canvas')){
  if(layer.printPattern!=='pixel')return source;
  const width=source.naturalWidth||source.width,height=source.naturalHeight||source.height;
  const out=createCanvas();out.width=width;out.height=height;
  const ctx=out.getContext('2d',{willReadFrequently:true});ctx.drawImage(source,0,0,width,height);
  const pixels=ctx.getImageData(0,0,width,height),d=pixels.data;
  const scale=Math.max(0,Math.min(100,layer.printPixelScale??35));
  const block=Math.max(1,Math.round(Math.min(width,height)/1024*Math.pow(128,scale/100)));
  for(let y=0;y<height;y+=block)for(let x=0;x<width;x+=block){
    const right=Math.min(width,x+block),bottom=Math.min(height,y+block),count=(right-x)*(bottom-y);
    let r=0,g=0,b=0,a=0;
    for(let yy=y;yy<bottom;yy++)for(let xx=x;xx<right;xx++){
      const i=(yy*width+xx)*4,alpha=d[i+3];a+=alpha;r+=d[i]*alpha;g+=d[i+1]*alpha;b+=d[i+2]*alpha;
    }
    r=a?Math.round(r/a):0;g=a?Math.round(g/a):0;b=a?Math.round(b/a):0;const alpha=Math.round(a/count);
    for(let yy=y;yy<bottom;yy++)for(let xx=x;xx<right;xx++){const i=(yy*width+xx)*4;d[i]=r;d[i+1]=g;d[i+2]=b;d[i+3]=alpha;}
  }
  ctx.putImageData(pixels,0,0);return out;
}
