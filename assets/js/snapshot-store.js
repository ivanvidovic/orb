// Snapshot manifests reference shared source blobs; built-in GLBs are never stored.
export function createSnapshotStore(name='orb-snapshots-1:'+location.pathname.replace(/\/index\.html$/,'/')){
  let pending;
  function database(){
    if(!pending)pending=new Promise((resolve,reject)=>{
      const request=indexedDB.open(name,1);let settled=false;
      const timer=setTimeout(()=>{settled=true;reject(new Error('Snapshot storage did not respond.'));},8000);
      request.onupgradeneeded=()=>{for(const key of ['snapshots','assets'])if(!request.result.objectStoreNames.contains(key))request.result.createObjectStore(key);};
      request.onerror=()=>{clearTimeout(timer);reject(request.error);};
      request.onblocked=()=>{clearTimeout(timer);settled=true;reject(new Error('Close other ORB tabs and try again.'));};
      request.onsuccess=()=>{if(settled){request.result.close();return;}clearTimeout(timer);const db=request.result;db.onversionchange=()=>{db.close();pending=null;};resolve(db);};
    }).catch(error=>{pending=null;throw error;});
    return pending;
  }
  async function read(store,key){const db=await database();return new Promise((resolve,reject)=>{const req=db.transaction(store).objectStore(store)[key===undefined?'getAll':'get'](key);req.onsuccess=()=>resolve(req.result);req.onerror=()=>reject(req.error);});}
  async function write(action){const db=await database();return new Promise((resolve,reject)=>{const tx=db.transaction(['snapshots','assets'],'readwrite');tx.oncomplete=()=>resolve();tx.onerror=()=>reject(tx.error);tx.onabort=()=>reject(tx.error||new Error('Snapshot could not be saved.'));try{action(tx.objectStore('snapshots'),tx.objectStore('assets'));}catch(error){tx.abort();reject(error);}});}
  const fingerprint=doc=>JSON.stringify(doc);
  return {
    fingerprint,
    async list(){return (await read('snapshots')).sort((a,b)=>b.created-a.created);},
    async save(data,previews,{name=data.doc.name}={}){
      const id=crypto.randomUUID(),doc=structuredClone(data.doc);let modelKey=null;
      if(data.model){const hash=await crypto.subtle.digest('SHA-256',await data.model.arrayBuffer());modelKey='model-'+Array.from(new Uint8Array(hash),v=>v.toString(16).padStart(2,'0')).join('');}
      const entry={id,name,doc,modelKey,previews,created:Date.now(),fingerprint:fingerprint(doc)};
      await write((snapshots,assets)=>{for(const record of data.records)assets.put(record,record.id);if(modelKey)assets.put({blob:data.model},modelKey);snapshots.put(entry,id);});
      return entry;
    },
    async load(id){
      const entry=await read('snapshots',id);if(!entry)throw new Error('This snapshot is no longer available.');
      const records=await Promise.all(entry.doc.assets.map(asset=>read('assets',asset.id)));
      if(records.some(record=>!record?.blob))throw new Error('Snapshot artwork is missing.');
      const model=entry.modelKey?(await read('assets',entry.modelKey))?.blob:null;
      if(entry.modelKey&&!model)throw new Error('Snapshot garment is missing.');
      return {doc:entry.doc,records,model};
    },
    async rename(id,name){await write(snapshots=>{const req=snapshots.get(id);req.onsuccess=()=>{if(req.result)snapshots.put({...req.result,name},id);};});},
    async remove(id){await write((snapshots,assets)=>{
      snapshots.delete(id);
      const req=snapshots.getAll();req.onsuccess=()=>{
        const used=new Set();for(const entry of req.result){for(const asset of entry.doc.assets)used.add(asset.id);if(entry.modelKey)used.add(entry.modelKey);}
        const cursor=assets.openCursor();cursor.onsuccess=()=>{const item=cursor.result;if(!item)return;if(!used.has(item.key))item.delete();item.continue();};
      };
    });}
  };
}
