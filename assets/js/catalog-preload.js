// Prepare one garment at a time after startup, yielding between jobs.
export function preloadCatalog({mobile,items,ready,busy,prepare,trim,schedule,onError}){
  if(mobile)return;
  const queue=items.slice();
  const next=async()=>{
    if(!queue.length)return;
    if(busy()){schedule(next);return;}
    const item=queue.shift();
    try{if(!ready(item.id))await prepare(item);trim();}
    catch(error){onError(item,error);}
    if(queue.length)schedule(next);
  };
  schedule(next);
}
