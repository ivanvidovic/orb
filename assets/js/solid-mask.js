// Shared coverage treatment for preview and exported artwork.
export function solidCoverageLut(settings={}){
  const cutoff=(settings.solidCutoff??12)/100,width=Math.max(.0001,(1-cutoff)*(settings.solidSoftness??65)/100),lut=new Float32Array(256);
  for(let i=0;i<256;i++){const level=settings.solidInvert?1-i/255:i/255,t=Math.max(0,Math.min(1,(level-cutoff)/width));lut[i]=t*t*(3-2*t);}
  return lut;
}
export function resolveMaskSource(data,layer){
  if(layer.solidMaskSource!=='auto')return layer.solidMaskSource||'brightness';
  const low=[255,255,255],high=[0,0,0];let count=0;
  for(let i=0;i<data.length;i+=4){if(data[i+3]<32)continue;count++;for(let c=0;c<3;c++){low[c]=Math.min(low[c],data[i+c]);high[c]=Math.max(high[c],data[i+c]);}}
  return count&&high.every((v,c)=>v-low[c]<=18)?'alpha':'brightness';
}
// Sliding window extrema/average, linear time even for large artwork.
function filterAxis(input,w,h,r,vertical,kind){
  const out=new Float32Array(input.length),length=vertical?h:w,lines=vertical?w:h;
  const queue=new Int32Array(length);
  for(let line=0;line<lines;line++){
    const at=p=>vertical?p*w+line:line*w+p;
    if(kind==='blur'){
      let sum=0;for(let p=0;p<=Math.min(r,length-1);p++)sum+=input[at(p)];
      for(let p=0;p<length;p++){out[at(p)]=sum/(2*r+1);if(p-r>=0)sum-=input[at(p-r)];if(p+r+1<length)sum+=input[at(p+r+1)];}
    }else{
      let head=0,tail=0,next=0;
      for(let p=0;p<length;p++){
        for(;next<=Math.min(length-1,p+r);next++){const v=input[at(next)];while(tail>head&&(kind==='max'?input[at(queue[tail-1])]<=v:input[at(queue[tail-1])]>=v))tail--;queue[tail++]=next;}
        while(head<tail&&queue[head]<p-r)head++;
        out[at(p)]=kind==='min'&&(p<r||p+r>=length)?0:input[at(queue[head])];
      }
    }
  }
  return out;
}
export function applySolidMask(data,w,h,layer,{fullWidth=w,fullHeight=h}={}){
  const alpha=resolveMaskSource(data,layer)==='alpha',lut=solidCoverageLut({...layer,solidInvert:alpha?false:layer.solidInvert});
  let mask=new Float32Array(w*h);
  for(let i=0,j=0;i<data.length;i+=4,j++)mask[j]=alpha?255*lut[data[i+3]]:data[i+3]*lut[Math.round(data[i]*.299+data[i+1]*.587+data[i+2]*.114)];
  const unit=Math.min(fullWidth,fullHeight)/1024,spread=Math.round((layer.solidSpread??0)*unit),soft=Math.round((layer.solidEdgeSoftness??0)*unit);
  if(spread){const kind=spread>0?'max':'min',r=Math.abs(spread);mask=filterAxis(filterAxis(mask,w,h,r,false,kind),w,h,r,true,kind);}
  if(soft)for(let pass=0;pass<3;pass++)mask=filterAxis(filterAxis(mask,w,h,soft,false,'blur'),w,h,soft,true,'blur');
  for(let i=0,j=0;i<data.length;i+=4,j++)data[i+3]=Math.round(mask[j]);
}
