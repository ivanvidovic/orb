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
// Same sliding windows and Float32 rounding as before, with contiguous blur
// reads and two reusable buffers instead of eight full-image allocations.
export function filterCoverage(input,out,w,h,r,vertical,kind){
  if(kind==='blur'){
    const divisor=2*r+1;
    if(vertical){
      const sums=new Float64Array(w);
      for(let y=0;y<=Math.min(r,h-1);y++)for(let x=0,i=y*w;x<w;x++,i++)sums[x]+=input[i];
      for(let y=0;y<h;y++){
        let i=y*w,remove=(y-r)*w,add=(y+r+1)*w;
        for(let x=0;x<w;x++,i++,remove++,add++){
          out[i]=sums[x]/divisor;
          if(y>=r)sums[x]-=input[remove];
          if(y+r+1<h)sums[x]+=input[add];
        }
      }
    }else for(let y=0;y<h;y++){
      const row=y*w;let sum=0;
      for(let x=0;x<=Math.min(r,w-1);x++)sum+=input[row+x];
      for(let x=0;x<w;x++){
        out[row+x]=sum/divisor;
        if(x>=r)sum-=input[row+x-r];
        if(x+r+1<w)sum+=input[row+x+r+1];
      }
    }
  }else{
    const length=vertical?h:w,lines=vertical?w:h,stride=vertical?w:1,queue=new Int32Array(length),max=kind==='max';
    for(let line=0;line<lines;line++){
      const base=vertical?line:line*w;let head=0,tail=0,next=0;
      for(let p=0;p<length;p++){
        const end=Math.min(length-1,p+r);
        for(;next<=end;next++){
          const value=input[base+next*stride];
          while(tail>head){const previous=input[base+queue[tail-1]*stride];if(max?previous>value:previous<value)break;tail--;}
          queue[tail++]=next;
        }
        while(head<tail&&queue[head]<p-r)head++;
        out[base+p*stride]=!max&&(p<r||p+r>=length)?0:input[base+queue[head]*stride];
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
  const work=spread||soft?new Float32Array(mask.length):null;
  if(spread){const kind=spread>0?'max':'min',r=Math.abs(spread);filterCoverage(mask,work,w,h,r,false,kind);filterCoverage(work,mask,w,h,r,true,kind);}
  if(soft)for(let pass=0;pass<3;pass++){filterCoverage(mask,work,w,h,soft,false,'blur');filterCoverage(work,mask,w,h,soft,true,'blur');}
  for(let i=0,j=0;i<data.length;i+=4,j++)data[i+3]=Math.round(mask[j]);
}
