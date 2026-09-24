// Allocate each existing panel tile around its artwork, including room for spill.
export function focusedPanelBounds(panel,rects){
 if(!rects.length)return {...panel};
 const minU=Math.max(panel.minU,Math.min(...rects.map(r=>r.minU))),maxU=Math.min(panel.maxU,Math.max(...rects.map(r=>r.maxU)));
 const minV=Math.max(panel.minV,Math.min(...rects.map(r=>r.minV))),maxV=Math.min(panel.maxV,Math.max(...rects.map(r=>r.maxV)));
 if(maxU<=minU||maxV<=minV)return {...panel};
 const padU=Math.max((maxU-minU)*.08,(panel.maxU-panel.minU)*.02),padV=Math.max((maxV-minV)*.08,(panel.maxV-panel.minV)*.02);
 return {minU:Math.max(panel.minU,minU-padU),maxU:Math.min(panel.maxU,maxU+padU),minV:Math.max(panel.minV,minV-padV),maxV:Math.min(panel.maxV,maxV+padV)};
}
export function layerCustomColor(layer){return layer.mode==='tint'?layer.tintCustom:layer.mode==='ink'?layer.inkCustom:null;}
export function patternWorkingSource(source,layer,limit,createCanvas=()=>document.createElement('canvas')){
 if(!['dots','lines','grain','maze','branching'].includes(layer.printPattern))return source;
 const scale=Math.max(1,Math.min(limit/Math.max(source.width,source.height),4));if(scale<=1)return source;
 const out=createCanvas();out.width=Math.round(source.width*scale);out.height=Math.round(source.height*scale);
 const ctx=out.getContext('2d');ctx.imageSmoothingEnabled=true;ctx.imageSmoothingQuality='high';ctx.drawImage(source,0,0,out.width,out.height);
 const crop=source.orbCrop||{fullWidth:source.width,fullHeight:source.height,offsetX:0,offsetY:0};
 out.orbCrop={fullWidth:crop.fullWidth*scale,fullHeight:crop.fullHeight*scale,offsetX:crop.offsetX*scale,offsetY:crop.offsetY*scale};return out;
}
