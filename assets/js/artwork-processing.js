import {createArtworkTreatment} from './artwork-treatment.js?v=91-natural';

// One running job and one newest pending value per layer. Completed samples
// can display during a drag; obsolete queued values never build a backlog.
export function createTreatmentQueue(process){
  const pending=new Map(),waiters=[];let active=null,scheduled=false;
  function wake(){if(!active&&!pending.size)while(waiters.length)waiters.shift()();}
  async function pump(){
    scheduled=false;if(active)return;
    for(const [id,job] of pending)if(!job.valid())pending.delete(id);
    const next=pending.entries().next();if(next.done){wake();return;}
    const [id,job]=next.value;pending.delete(id);active={id,job,cancelled:false};const running=active;
    try{const result=await process(job);if(!running.cancelled&&job.valid())job.done(result);}
    catch(error){if(!running.cancelled&&job.valid())job.error(error);}
    finally{active=null;schedule();}
  }
  function schedule(){if(!scheduled){scheduled=true;setTimeout(pump,0);}}
  return {
    enqueue(id,job){pending.set(id,job);schedule();},
    cancel(id){pending.delete(id);if(active?.id===id)active.cancelled=true;wake();},
    settle(){return new Promise(resolve=>{waiters.push(resolve);schedule();});},
    get busy(){return !!active||pending.size>0;}
  };
}

export function createTreatmentProcessor(){
  let worker=null,disabled=false,sequence=0,lastSource=null,fallback=null;
  function stop(){worker?.terminate();worker=null;lastSource=null;}
  return async job=>{
    if(!disabled&&typeof Worker!=='undefined'&&typeof OffscreenCanvas!=='undefined'&&typeof createImageBitmap==='function'){
      let bitmap;
      try{
        worker??=new Worker(new URL('./artwork-treatment-worker.js?v=91-natural',import.meta.url),{type:'module'});
        if(lastSource!==job.source)bitmap=await createImageBitmap(job.source);
        const id=++sequence;
        const result=await new Promise((resolve,reject)=>{
          const timer=setTimeout(()=>{cleanup();reject(new Error('Artwork processing timed out.'));},45000);
          const cleanup=()=>{clearTimeout(timer);worker?.removeEventListener('message',message);worker?.removeEventListener('error',error);worker?.removeEventListener('messageerror',error);};
          const message=e=>{if(e.data.id!==id)return;cleanup();e.data.error?reject(new Error(e.data.error)):resolve(e.data.result);};
          const error=()=>{cleanup();reject(new Error('Artwork processor could not start.'));};
          worker.addEventListener('message',message);worker.addEventListener('error',error);worker.addEventListener('messageerror',error);
          try{worker.postMessage({id,bitmap,settings:job.settings,limit:job.limit},bitmap?[bitmap]:[]);bitmap=null;}
          catch(e){cleanup();reject(e);}
        });
        lastSource=job.source;return result;
      }catch{bitmap?.close();stop();disabled=true;}
    }
    // Full-quality compatibility fallback for browsers without module workers.
    fallback??=createArtworkTreatment();return fallback.render(job.source,job.settings,job.limit);
  };
}
