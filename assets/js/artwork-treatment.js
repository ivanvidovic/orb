import {createArtworkRounder} from './artwork-rounding.js?v=91-design';
import {isOrganic,organicSampler} from './organic-pattern.js?v=91-design';
import {solidCoverageLut,resolveMaskSource,filterCoverage} from './solid-mask.js?v=81';
import {applyPrintTexture,hasPrintTexture,capturePrintTone,pixelateArtwork} from './print-texture.js?v=91-design';
import {patternWorkingSource} from './artwork-detail.js?v=91-design';

export function treatmentKey(l){
  const pattern=l.printPattern||'none';
  const ink=l.mode==='ink'?`ink/${l.solidMaskSource??'brightness'}/${l.solidCutoff??12}/${l.solidSoftness??65}/${l.solidSpread??0}/${l.solidEdgeSoftness??0}/${!!l.solidInvert}`:'color';
  return `${ink}/${!!l.fit}/${pattern}/${l.printVersion??1}/${l.printSize??40}/${l.printAngle??45}/${l.printStrength??100}/${l.printMarkSize??50}/${l.printTone??100}/${l.printErosion??0}/${pattern==='pixel'?l.printPixelScale??35:0}/${isOrganic(l)?[l.printSeed??1,l.printDensity??50,l.printBranchMode??'repeat'].join('/'):''}/${l.printRounding??0}`;
}
const clamp=x=>Math.max(0,Math.min(1,x));
const hash=(x,y)=>{let n=Math.imul(x,374761393)+Math.imul(y,668265263);n=Math.imul(n^(n>>>13),1274126177);return ((n^(n>>>16))>>>0)/4294967296;};
const noise=(u,v)=>{const x=Math.floor(u),y=Math.floor(v),fx=u-x,fy=v-y,sx=fx*fx*(3-2*fx),sy=fy*fy*(3-2*fy);return (hash(x,y)*(1-sx)+hash(x+1,y)*sx)*(1-sy)+(hash(x,y+1)*(1-sx)+hash(x+1,y+1)*sx)*sy;};

// One active preparation, shared when several layers use the same source.
// No growing cache of slider positions or full-size canvases per layer.
export function createArtworkTreatment(canvas=()=>document.createElement('canvas')){
  let source=null,prepared=null,baseKey='',state={};
  const roundArtwork=createArtworkRounder();
  const stats={preparations:0,tones:0,masks:0,patterns:0,composites:0};
  function fit(input,margin){
    const w=input.width,h=input.height,d=input.getContext('2d').getImageData(0,0,w,h).data;
    let left=w,top=h,right=-1,bottom=-1;
    for(let y=0;y<h;y++)for(let x=0;x<w;x++)if(d[(y*w+x)*4+3]>0){left=Math.min(left,x);right=Math.max(right,x);top=Math.min(top,y);bottom=Math.max(bottom,y);}
    if(right<left||(left===0&&top===0&&right===w-1&&bottom===h-1))return input;
    left=Math.max(0,left-margin);top=Math.max(0,top-margin);right=Math.min(w-1,right+margin);bottom=Math.min(h-1,bottom+margin);
    const out=canvas();out.width=right-left+1;out.height=bottom-top+1;
    const ctx=out.getContext('2d');ctx.imageSmoothingEnabled=false;ctx.drawImage(input,left,top,out.width,out.height,0,0,out.width,out.height);
    out.orbCrop={fullWidth:w,fullHeight:h,offsetX:left,offsetY:top};return out;
  }
  function prepare(input,l,limit){
    const ink=l.mode==='ink',pixel=l.printPattern==='pixel';
    const margin=ink?Math.ceil((Math.abs(l.solidSpread??0)+3*(l.solidEdgeSoftness??0))*Math.min(input.width,input.height)/1024):0;
    const key=[!!l.fit,l.fit?margin:0,pixel?`pixel/${l.printPixelScale??35}`:['dots','lines','grain','maze','branching'].includes(l.printPattern)?limit:0].join('/');
    if(source===input&&baseKey===key)return;
    state={};roundArtwork.clear();prepared=null;source=input;baseKey=key;
    let work=pixel?pixelateArtwork(input,l,canvas):input;
    if(l.fit)work=fit(work,margin);
    work=patternWorkingSource(work,l,limit,canvas);
    const w=work.width,h=work.height,ctx=work.getContext('2d',{willReadFrequently:true});
    prepared={w,h,data:ctx.getImageData(0,0,w,h).data,crop:work.orbCrop||{fullWidth:w,fullHeight:h,offsetX:0,offsetY:0}};
    if(work!==input)work.width=work.height=1;
    stats.preparations++;
  }
  function mask(l){
    const {w,h,data,crop}=prepared,n=w*h;
    if(l.mode!=='ink')return null;
    if(!state.brightness){
      state.brightness=new Uint8Array(n);
      for(let i=0,j=0;j<n;i+=4,j++)state.brightness[j]=Math.round(data[i]*.299+data[i+1]*.587+data[i+2]*.114);
      state.autoMask=resolveMaskSource(data,{solidMaskSource:'auto'});
    }
    const mode=l.solidMaskSource==='auto'?state.autoMask:l.solidMaskSource||'brightness',alpha=mode==='alpha';
    const key=[mode,l.solidCutoff??12,l.solidSoftness??65,l.solidSpread??0,l.solidEdgeSoftness??0,alpha?false:!!l.solidInvert].join('/');
    if(state.maskKey===key)return state.mask;
    const lut=solidCoverageLut({...l,solidInvert:alpha?false:l.solidInvert});
    const a=state.a??=new Float32Array(n),b=state.b??=new Float32Array(n);
    const unit=Math.min(crop.fullWidth,crop.fullHeight)/1024,spread=Math.round((l.solidSpread??0)*unit),soft=Math.round((l.solidEdgeSoftness??0)*unit);
    if(alpha&&spread){
      // The Alpha curve is monotonic: extrema commute with its lookup table.
      // Cache byte extrema before the curve so cutoff/softness changes don't
      // repeat Spread. Float32 conversion below matches the original order.
      if(state.spreadRadius!==spread){
        const bytes=state.spreadAlpha??=new Uint8Array(n),work=new Uint8Array(n);
        for(let i=3,j=0;j<n;i+=4,j++)bytes[j]=data[i];
        const kind=spread>0?'max':'min',r=Math.abs(spread);
        filterCoverage(bytes,work,w,h,r,false,kind);filterCoverage(work,bytes,w,h,r,true,kind);state.spreadRadius=spread;
      }
      for(let j=0;j<n;j++)a[j]=255*lut[state.spreadAlpha[j]];
    }else{
      for(let i=3,j=0;j<n;i+=4,j++)a[j]=alpha?255*lut[data[i]]:data[i]*lut[state.brightness[j]];
      if(spread){const kind=spread>0?'max':'min',r=Math.abs(spread);filterCoverage(a,b,w,h,r,false,kind);filterCoverage(b,a,w,h,r,true,kind);}
    }
    if(soft)for(let i=0;i<3;i++){filterCoverage(a,b,w,h,soft,false,'blur');filterCoverage(b,a,w,h,soft,true,'blur');}
    const out=state.mask??=new Uint8Array(n);for(let j=0;j<n;j++)out[j]=Math.round(a[j]);
    state.maskKey=key;stats.masks++;return out;
  }
  function pattern(l){
    if(l.printVersion!==2||!hasPrintTexture(l)||l.printPattern==='pixel')return null;
    const {w,h,data,crop}=prepared,ink=l.mode==='ink';
    const mode=ink?(l.solidMaskSource==='auto'?state.autoMask:l.solidMaskSource||'brightness'):'alpha';
    const toneKey=[ink,mode,mode==='alpha'?false:!!l.solidInvert].join('/');
    if(state.toneKey!==toneKey){state.tone=capturePrintTone(data,{...l,solidMaskSource:mode});state.toneKey=toneKey;stats.tones++;}
    const organic=isOrganic(l)?organicSampler(l,crop.fullWidth,crop.fullHeight):null;
    const grain=l.printPattern==='grain',size=Math.max(.001,Math.min(100,grain?(l.printMarkSize??50):(l.printSize??40))),join=140-120*39/99;
    const cells=size<1?1120/size:size<40?1120*Math.pow(join/1120,(size-1)/39):140-120*(size-1)/99;
    const period=Math.min(crop.fullWidth,crop.fullHeight)/cells,resolved=organic?organic.resolved:clamp((period-.5)/1.5);
    const key=[l.printPattern,size,l.printAngle??45,organic?l.printSeed??1:0,organic?l.printDensity??50:0,organic?l.printMarkSize??50:0,l.printBranchMode??'repeat'].join('/');
    if(state.patternKey!==key){
      const thresholds=state.thresholds??=new Float32Array(w*h),angle=(l.printAngle??45)*Math.PI/180,c=Math.cos(angle),s=Math.sin(angle);
      if(resolved>0)for(let y=0,j=0;y<h;y++)for(let x=0;x<w;x++,j++){
        if(organic){thresholds[j]=organic.sample(x+crop.offsetX+.5,y+crop.offsetY+.5);continue;}
        const px=(x+crop.offsetX+.5-crop.fullWidth/2)/period,py=(y+crop.offsetY+.5-crop.fullHeight/2)/period,u=px*c+py*s,v=-px*s+py*c;
        const fx=u-Math.floor(u),fy=v-Math.floor(v);let threshold;
        if(organic)threshold=organic.sample(x+crop.offsetX+.5,y+crop.offsetY+.5);
        else if(grain)threshold=clamp(((noise(u,v)*.75+noise(u*2.03+19.7,v*2.03-7.1)*.25)-.5)*1.8+.5);
        else if(l.printPattern==='lines')threshold=Math.abs(fy-.5)*2;
        else{const r=Math.hypot(fx-.5,fy-.5);threshold=Math.PI*r*r;if(r>.5)threshold-=4*(r*r*Math.acos(.5/r)-.5*Math.sqrt(r*r-.25));}
        thresholds[j]=threshold;
      }
      state.patternKey=key;stats.patterns++;
    }
    return {thresholds:state.thresholds,tone:state.tone,resolved,aa:organic?organic.aa:Math.min(.25,.65/period),response:clamp((l.printTone??100)/100),erosion:clamp((l.printErosion??0)/100),mark:organic?organic.mark:grain?1:Math.max(0,(l.printMarkSize??50)/50)};
  }
  function render(input,l,limit=4096){
    prepare(input,l,limit);
    const rounding=(l.printRounding??0)>0;
    const before={...l,printRounding:0,...(rounding?{solidEdgeSoftness:0}:{})},key=treatmentKey(before);
    if(rounding&&state.compositeKey===key&&state.composite)return finish(state.composite,l);
    const coverage=mask(before),p=pattern(before),{w,h,data,crop}=prepared,ink=l.mode==='ink',pad=ink?4:0,width=w+pad*2,height=h+pad*2;
    // Solid needs coverage only. One channel also cuts texture uploads and
    // retained source texture memory to a quarter of the previous RGBA path.
    const output=ink?new Uint8Array(width*height):new Uint8Array(data);
    for(let y=0,j=0;y<h;y++)for(let x=0,k=(y+pad)*width+pad;x<w;x++,j++,k++){
      let a=coverage?coverage[j]:data[j*4+3];
      if(p&&a){
        const area=clamp((1-p.response+p.response*p.tone[j])*p.mark*p.mark)*(1-p.erosion);let screen=area;
        if(p.resolved>0&&area>0&&area<1){const t=clamp((area-p.thresholds[j]+p.aa)/(2*p.aa));screen=area+(t*t*(3-2*t)-area)*p.resolved;}
        a=Math.round(a*screen);
      }
      if(ink)output[k]=a;else output[j*4+3]=a;
    }
    // Saved version-one patterns keep their original algorithm.
    if(l.printVersion!==2&&hasPrintTexture(l)&&l.printPattern!=='pixel'){
      const rgba=new Uint8ClampedArray(data);
      if(ink)for(let j=0;j<w*h;j++)rgba[j*4+3]=coverage[j];
      applyPrintTexture(rgba,w,h,before,crop);
      for(let y=0,j=0;y<h;y++)for(let x=0;x<w;x++,j++)if(ink)output[(y+pad)*width+x+pad]=rgba[j*4+3];else output[j*4+3]=rgba[j*4+3];
    }
    stats.composites++;
    const result={data:output,width,height,coverageOnly:ink,crop:{...crop},padding:pad};
    if(rounding){state.compositeKey=key;state.composite=result;return finish(result,l);}
    state.composite=null;state.compositeKey='';return result;
  }
  function finish(result,l){
    const {width:w,height:h,coverageOnly,crop}=result;
    let data=roundArtwork(result.data,w,h,l,{...crop,coverageOnly});
    if(data===result.data)data=new data.constructor(data);
    // Keep legacy projects identical at zero. With rounding enabled, apply the
    // existing Solid edge feather after rounding, so it remains independently useful.
    const soft=coverageOnly?Math.round((l.solidEdgeSoftness??0)*Math.min(crop.fullWidth,crop.fullHeight)/1024):0;
    if(soft){const a=new Float32Array(data),b=new Float32Array(data.length);
      for(let pass=0;pass<3;pass++){filterCoverage(a,b,w,h,soft,false,'blur');filterCoverage(b,a,w,h,soft,true,'blur');}
      for(let i=0;i<data.length;i++)data[i]=Math.round(a[i]);
    }
    return {...result,data};
  }
  return {render,stats,clear(){source=null;prepared=null;state={};baseKey='';roundArtwork.clear();}};
}
