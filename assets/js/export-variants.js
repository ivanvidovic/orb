import {createSnapshotSelector} from './snapshot-selector.js?v=0.9.81';
import {createSnapshotStore} from './snapshot-store.js?v=0.9.81';
import {cleanFilename} from './design-format.js?v=0.9.81';
export function exportLabel(name,garment,fabric,index=0){const safe=v=>cleanFilename(v).slice(0,55).replace(/^(CON|PRN|AUX|NUL|COM[1-9]|LPT[1-9])$/i,'_$1');const prefix=[safe(name),safe(garment),safe(fabric)].join('_');return {folder:String(index+1).padStart(2,'0')+' — '+safe(name),prefix};}
export function installExportSources(){
 const store=createSnapshotStore(),host=document.getElementById('exportSnapshots'),bulk=document.getElementById('exportSelectAll'),count=document.createElement('span');count.className='selector-count';bulk.before(count);
 function selected(){return document.querySelector('[name=exportSource]:checked').value==='snapshots';}
 const selector=createSnapshotSelector(host,{bulk,count,onChange:()=>document.getElementById('exportDialog').dispatchEvent(new Event('input',{bubbles:true}))});
 function sync(){host.hidden=bulk.hidden=count.hidden=!selected();document.getElementById('exportCurrentNote').hidden=!selected();document.getElementById('exportDialog').dispatchEvent(new Event('input',{bubbles:true}));}
 document.querySelectorAll('[name=exportSource]').forEach(e=>e.addEventListener('change',sync));
 return {selected,lock:value=>selector.lock(value),async refresh(){selector.set(await store.list());sync();},choices(){if(!selected())return [null];const picked=selector.values();if(!picked.length)throw Error('Select at least one snapshot for export.');return picked;},load:entry=>store.load(entry.id)};
}
// Add an explicit standard RGB tag to browser-generated sRGB PNGs.
export async function srgbPng(canvas){const blob=await new Promise((resolve,reject)=>canvas.toBlob(b=>b?resolve(b):reject(Error('Image export failed.')),'image/png'));const bytes=new Uint8Array(await blob.arrayBuffer()),view=new DataView(bytes.buffer);for(let p=8;p+12<=bytes.length;){const n=view.getUint32(p),type=String.fromCharCode(...bytes.subarray(p+4,p+8));if(type==='sRGB'||type==='iCCP')return blob;p+=n+12;}
 const chunk=new Uint8Array(13);new DataView(chunk.buffer).setUint32(0,1);chunk.set([115,82,71,66,0],4);let crc=0xffffffff;for(const b of chunk.subarray(4,9)){crc^=b;for(let i=0;i<8;i++)crc=(crc>>>1)^((crc&1)?0xedb88320:0);}new DataView(chunk.buffer).setUint32(9,(crc^0xffffffff)>>>0);return new Blob([bytes.subarray(0,33),chunk,bytes.subarray(33)],{type:'image/png'});
}
