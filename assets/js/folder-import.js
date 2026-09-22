export function hasDirectory(transfer){return Array.from(transfer.items||[]).some(i=>i.webkitGetAsEntry?.()?.isDirectory);}
export async function collectDrop(transfer){
 // Capture entries and Files synchronously while the drop event is active.
 const entries=Array.from(transfer.items||[]).map(i=>({entry:i.webkitGetAsEntry?.(),file:i.getAsFile?.()})),fallback=Array.from(transfer.files||[]),out=[];
 let visited=0;
 async function walk(entry,path=''){
  if(++visited>5000)throw new Error('Too many files or folders. Import a smaller folder.');
  const next=path+entry.name;
  if(entry.isFile){const file=await new Promise((resolve,reject)=>entry.file(resolve,reject));out.push({file,path:next});}
  else if(entry.isDirectory){const reader=entry.createReader();while(true){const batch=await new Promise((resolve,reject)=>reader.readEntries(resolve,reject));if(!batch.length)break;for(const child of batch)await walk(child,next+'/');}}
 }
 if(entries.some(i=>i.entry)){for(const i of entries)if(i.entry)await walk(i.entry);else if(i.file)out.push({file:i.file,path:i.file.name});}
 else for(const file of fallback)out.push({file,path:file.webkitRelativePath||file.name});
 return out;
}
