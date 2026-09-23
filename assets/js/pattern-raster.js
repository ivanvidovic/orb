import {applyPrintTexture,capturePrintTone,pixelateArtwork} from './print-texture.js?v=79';
import {applySolidMask} from './solid-mask.js?v=70';
import {patternWorkingSource} from './artwork-detail.js?v=78';
function fit(source,margin,canvas){
 const w=source.width,h=source.height,d=source.getContext('2d').getImageData(0,0,w,h).data;
 let left=w,top=h,right=-1,bottom=-1;
 for(let y=0;y<h;y++)for(let x=0;x<w;x++)if(d[(y*w+x)*4+3]>0){left=Math.min(left,x);right=Math.max(right,x);top=Math.min(top,y);bottom=Math.max(bottom,y);}
 if(right<left||(left===0&&top===0&&right===w-1&&bottom===h-1))return source;
 left=Math.max(0,left-margin);top=Math.max(0,top-margin);right=Math.min(w-1,right+margin);bottom=Math.min(h-1,bottom+margin);
 const out=canvas();out.width=right-left+1;out.height=bottom-top+1;out.getContext('2d').drawImage(source,left,top,out.width,out.height,0,0,out.width,out.height);
 out.orbCrop={fullWidth:w,fullHeight:h,offsetX:left,offsetY:top};return out;
}
export function renderPatternRaster(source,layer,limit,canvas=()=>document.createElement('canvas')){
 const margin=layer.mode==='ink'?Math.ceil((Math.abs(layer.solidSpread??0)+3*(layer.solidEdgeSoftness??0))*Math.min(source.width,source.height)/1024):0;
 let image=layer.printPattern==='pixel'?pixelateArtwork(source,layer,canvas):source;
 if(layer.fit)image=fit(image,margin,canvas);
 if(layer.printPattern!=='pixel')image=patternWorkingSource(image,layer,limit,canvas);
 const ink=layer.mode==='ink',pad=ink?4:0,w=image.width,h=image.height,out=canvas();out.width=w+2*pad;out.height=h+2*pad;
 const ctx=out.getContext('2d',{willReadFrequently:true});ctx.drawImage(image,pad,pad);
 const pixels=ctx.getImageData(pad,pad,w,h),data=pixels.data;
 if(ink){const sourceTone=capturePrintTone(data,layer);applySolidMask(data,w,h,layer,image.orbCrop);for(let i=0;i<data.length;i+=4)data[i]=data[i+1]=data[i+2]=255;applyPrintTexture(data,w,h,layer,{...image.orbCrop,sourceTone});}
 else if(layer.printPattern!=='pixel')applyPrintTexture(data,w,h,layer,image.orbCrop);
 ctx.putImageData(pixels,pad,pad);return out;
}
