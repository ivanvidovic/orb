// ORB Garment Studio v0.9.25 — versioned local copies of catalog assets.
const CACHE_NAME='orb-garment-assets-v0.9.25';
let cachePromise;
function assetCache(){
 if(!cachePromise)cachePromise=(async()=>{
  if(!globalThis.caches||!globalThis.isSecureContext)return null;
  try{
   const cache=await caches.open(CACHE_NAME);
   // Only our obsolete model-cache versions; saved designs use separate storage.
   for(const name of await caches.keys())if(name.startsWith('orb-garment-assets-v')&&name!==CACHE_NAME)await caches.delete(name);
   return cache;
  }catch{return null;}
 })();
 return cachePromise;
}
export async function fetchGarmentAsset(url,{persistent=true}={}){
 const cache=persistent?await assetCache():null;
 if(cache){try{const stored=await cache.match(url);if(stored)return stored;}catch{/* Network fallback if browser storage is unavailable. */}}
 const response=await fetch(url);
 if(cache&&response.ok){
  // Return the streaming response immediately so startup progress stays live.
  void cache.put(url,response.clone()).catch(()=>{});
 }
 return response;
}
