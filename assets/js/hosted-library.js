// Public libraries are metadata until a graphic is selected or explicitly bundled.
const slugPattern=/^[a-z0-9][a-z0-9_-]{0,63}$/;
export async function loadHostedLibrary(href,fetcher=fetch){
 const page=new URL(href),slug=page.searchParams.get('library');if(!slug)return null;
 if(!slugPattern.test(slug))throw new Error('The library name is invalid.');
 const base=new URL('./assets/libraries/'+slug+'/',page);
 const response=await fetcher(new URL('manifest.json',base),{cache:'no-cache',signal:AbortSignal.timeout(15000)});
 if(!response.ok)throw new Error('The '+slug+' library could not load. Check the link or reload to retry.');
 const data=await response.json();
 if(data.version!==1||data.id!==slug||!Array.isArray(data.assets)||data.assets.length>1000)throw new Error('This library manifest is invalid.');
 const resolve=path=>{
  if(typeof path!=='string'||!path||path.split('/').some(x=>!x||x==='.'||x==='..')||path.includes('\\'))throw new Error('Invalid library asset path.');
  const url=new URL(path.split('/').map(encodeURIComponent).join('/'),base);return url.href;
 };
 const ids=new Set();
 const assets=data.assets.map(a=>{
  if(!/^asset-[a-f0-9]{64}$/.test(a.id)||ids.has(a.id)||typeof a.name!=='string'||!a.name.trim()||! /\.(svg|png|jpe?g|webp)$/i.test(a.file))throw new Error('Invalid library graphic.');
  ids.add(a.id);
  return {id:a.id,name:a.file.split('/').pop(),url:resolve(a.file),entry:{name:a.name,thumb:resolve(a.thumbnail),source:null},hosted:true};
 });
 return {name:typeof data.name==='string'?data.name:slug,assets};
}
export async function fetchHostedArtwork(asset,fetcher=fetch){
 const response=await fetcher(asset.url,{signal:AbortSignal.timeout(30000)});
 if(!response.ok)throw new Error('This graphic could not download. Click it to retry.');
 const bytes=await response.arrayBuffer();
 const hash=Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',bytes))).map(n=>n.toString(16).padStart(2,'0')).join('');
 if(asset.id!=='asset-'+hash)throw new Error('This library has changed. Reload the page and try again.');
 const ext=asset.name.split('.').pop().toLowerCase(),type=({svg:'image/svg+xml',png:'image/png',jpg:'image/jpeg',jpeg:'image/jpeg',webp:'image/webp'})[ext];
 return new File([bytes],asset.name,{type});
}
