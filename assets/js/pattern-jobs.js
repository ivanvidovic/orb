// Only one expensive job runs at a time; obsolete queued edits never start.
export function createPatternJobs(process,delay=180){
 let pending=[],active=false,timer=null,waiters=[],force=false;
 const finish=()=>{if(!active&&!pending.length){force=false;for(const resolve of waiters.splice(0))resolve();}};
 function pump(){
  clearTimeout(timer);pending=pending.filter(j=>j.valid());if(active)return;
  if(!pending.length){finish();return;}
  const now=Date.now(),index=pending.findIndex(j=>force||j.due<=now);
  if(index<0){timer=setTimeout(pump,Math.max(0,Math.min(...pending.map(j=>j.due))-now));return;}
  const job=pending.splice(index,1)[0];active=true;
  Promise.resolve().then(()=>process(job)).then(result=>{if(job.valid())job.done(result);else result.close?.();},error=>{if(job.valid())job.error(error);}).finally(()=>{active=false;pump();});
 }
 return {enqueue(job){pending.push({...job,due:Date.now()+delay});pump();},settle(){force=true;return new Promise(resolve=>{waiters.push(resolve);pump();});},prune:pump};
}
export function createPatternProcessor(fallback){
 let worker=null,disabled=typeof Worker==='undefined'||typeof OffscreenCanvas==='undefined'||typeof createImageBitmap==='undefined';
 return async job=>{
  if(disabled)return fallback(job);
  try{
   worker??=new Worker(new URL('./pattern-worker.js?v=79',import.meta.url),{type:'module'});
   const bitmap=await createImageBitmap(job.source);
   return await new Promise((resolve,reject)=>{
    const timer=setTimeout(()=>reject(new Error('Pattern worker timed out.')),30000);
    worker.onmessage=({data})=>{clearTimeout(timer);data.error?reject(new Error(data.error)):resolve(data.bitmap);};
    worker.onerror=e=>{e.preventDefault();clearTimeout(timer);reject(new Error('Pattern worker unavailable.'));};
    try{worker.postMessage({bitmap,layer:job.layer,limit:job.limit},[bitmap]);}catch(error){clearTimeout(timer);bitmap.close();reject(error);}
   });
  }catch{worker?.terminate();worker=null;disabled=true;return fallback(job);}
 };
}
