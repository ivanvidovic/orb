// Rasterize vector artwork at a deliberate resolution before Image decodes it.
// The original Blob stays untouched for portable designs and source exports.
export function sizedSvg(text,longEdge=4096,maxEdge=4096,maxPixels=48000000){
  const doc=new DOMParser().parseFromString(text,'image/svg+xml'),svg=doc.documentElement;
  if(svg.localName!=='svg'||doc.querySelector('parsererror'))throw new Error('Invalid SVG artwork.');
  const box=(svg.getAttribute('viewBox')||'').trim().split(/[\s,]+/).map(Number);
  const validBox=box.length===4&&box.every(Number.isFinite)&&box[2]>0&&box[3]>0;
  const length=value=>{const m=String(value||'').trim().match(/^([\d.]+)(px|pt|pc|in|cm|mm|q)?$/i);return m?Number(m[1])*({px:1,pt:96/72,pc:16,in:96,cm:96/2.54,mm:96/25.4,q:96/101.6}[m[2]?.toLowerCase()||'px']):NaN;};
  let w=length(svg.getAttribute('width')),h=length(svg.getAttribute('height'));
  if(!(w>0&&h>0)){if(!validBox)throw new Error('SVG needs a valid viewBox or width and height.');w=box[2];h=box[3];}
  if(!Number.isFinite(w)||!Number.isFinite(h))throw new Error('Invalid SVG dimensions.');
  if(!validBox)svg.setAttribute('viewBox',`0 0 ${w} ${h}`);
  const edge=Math.max(1,Math.min(maxEdge,longEdge)),scale=Math.min(edge/Math.max(w,h),Math.sqrt(maxPixels/(w*h)));
  const width=Math.max(1,Math.round(w*scale)),height=Math.max(1,Math.round(h*scale));
  svg.setAttribute('width',String(width));svg.setAttribute('height',String(height));
  // Root CSS sizing must not override the rasterization viewport.
  svg.setAttribute('style',(svg.getAttribute('style')||'')+`;width:${width}px!important;height:${height}px!important;max-width:none!important;max-height:none!important`);
  return new XMLSerializer().serializeToString(svg);
}
export async function decodeArtworkImage(blob,{longEdge=4096,maxEdge=4096}={}){
  const svg=blob.type.split(';')[0]==='image/svg+xml'||/\.svg$/i.test(blob.name||'')||/^\s*(?:<\?xml\b[^>]*>\s*)?(?:<!--[\s\S]*?-->\s*)*(?:<!DOCTYPE\s[^>]*>\s*)?<svg[\s>]/i.test(await blob.slice(0,1024).text());
  const source=svg?new Blob([sizedSvg(await blob.text(),longEdge,maxEdge)],{type:'image/svg+xml'}):blob;
  const url=URL.createObjectURL(source);
  try{return await new Promise((resolve,reject)=>{const img=new Image();img.onload=()=>resolve(img);img.onerror=()=>reject(new Error('Unsupported or damaged artwork.'));img.src=url;});}
  finally{URL.revokeObjectURL(url);}
}
