// Thumbnail-derived estimates are deliberately approximate, not a file-size guarantee.
export function installSizeEstimate({output,get}){
 let timer,generation=0;const cache=new WeakMap();
 async function bytes(blob,q,bg){let values=cache.get(blob);if(!values){values=new Map();cache.set(blob,values);}const key=q+bg;if(values.has(key))return values.get(key);
 const task=(async()=>{const bitmap=await createImageBitmap(blob),c=document.createElement('canvas');c.width=bitmap.width;c.height=bitmap.height;const ctx=c.getContext('2d');ctx.fillStyle=bg;ctx.fillRect(0,0,c.width,c.height);ctx.drawImage(bitmap,0,0);bitmap.close();try{const encoded=await new Promise(r=>c.toBlob(r,'image/jpeg',q/100));return {bytes:encoded.size,pixels:c.width*c.height};}finally{c.width=c.height=1;}})();values.set(key,task);if(values.size>18)values.delete(values.keys().next().value);return task;}
 async function update(token){const s=get(),n=s.entries.length;if(!n){output.textContent='Select designs to estimate size';return;}output.textContent='Estimating…';try{const samples=s.entries.filter(Boolean);const picks=[samples[0],samples[Math.floor(samples.length/2)],samples.at(-1)].filter((e,i,a)=>e&&a.indexOf(e)===i);const blobs=picks.flatMap(e=>[e.previews?.front,e.previews?.back]).filter(Boolean);let imageBytes;
 if(blobs.length){const data=await Promise.all(blobs.map(b=>bytes(b,s.quality,s.background)));const target=(s.width===3840?1800*1856:900*928);imageBytes=data.reduce((sum,d)=>sum+d.bytes*Math.pow(target/d.pixels,.85),0)/data.length;}
 else {imageBytes=(s.width===3840?650000:200000)*Math.pow(.15+s.quality/100,4)/Math.pow(1.14,4);}
 const size=(imageBytes*n*2+150000+s.logoBytes)/1e6;if(token!==generation)return;output.textContent='Estimated size: ~'+size.toFixed(1)+' MB';output.title='Rough estimate from cached snapshot previews. Full-resolution detail and reused images can change the final size. Actual size appears after download.';
 }catch{if(token===generation)output.textContent='Size estimate unavailable';}}
 return {schedule(){clearTimeout(timer);const token=++generation;timer=setTimeout(()=>update(token),160);}};
}
