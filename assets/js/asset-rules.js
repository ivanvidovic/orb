export const GROUPS={
 'Full Front':['front'],'Full Back':['back'],'Full':['front','back'],
 'Chest':['chest','rightchest','centerchest'],'Sleeves':['leftshoulder','rightshoulder'],
 'Wrists':['leftwrist','rightwrist'],'Shoulder Blades':['leftblade','rightblade'],
 'Back Neck':['backneck'],'Inside Neck Tags':['necktag'],'Lower Back':['lowerback'],
 'Front Hems':['lefthem','righthem'],'Pocket':['pocket'],
 'Hood Outside':['hoodleft','hoodright'],'Hood Inside':['hoodleftinside','hoodrightinside']};
export const TYPES=['Logos','Wordmarks','Illustrations','Labels','Symbols','Textures'];
const key=s=>s.toLowerCase().replace(/[^a-z0-9]/g,'').replace(/s$/,'');
const unique=a=>[...new Set(a.map(s=>s.slice(0,80)))].slice(0,100);
export const emptyRules=()=>({projects:[],tags:[],preferred:[],allowed:[],excluded:[]});
export function mergeRules(a=emptyRules(),b=emptyRules()){
 const r=Object.fromEntries(Object.keys(emptyRules()).map(k=>[k,unique([...(a[k]||[]),...(b[k]||[])])]));
 r.preferred=r.preferred.filter(s=>!r.excluded.includes(s));r.allowed=r.allowed.filter(s=>!r.excluded.includes(s)&&!r.preferred.includes(s));return r;
}
export function placementFolder(name,meta){
 const k=key(name);if(k==='anywhere')return Object.keys(meta);
 for(const [label,slots] of Object.entries(GROUPS))if(key(label)===k)return slots;
 for(const [id,m] of Object.entries(meta))if(key(m.label)===k||key(id)===k)return [id];
 return null;
}
export function rulesFromPath(path,meta){
 const folders=path.replace(/\\/g,'/').split('/').filter(Boolean).slice(0,-1),r=emptyRules(),unknown=[];
 const isType=s=>TYPES.some(t=>key(t)===key(s));
 if(folders.length&&!placementFolder(folders[0],meta)&&!isType(folders[0]))r.projects.push(folders.shift());
 for(const name of folders){const slots=placementFolder(name,meta);if(slots)r.preferred.push(...slots);else{r.tags.push(name);if(!isType(name))unknown.push(name);}}
 // Type-only folders provide conservative suggestions, never neck-tag guessing.
 if(!r.preferred.length){
  if(r.tags.some(t=>['logo','wordmark','symbol'].includes(key(t))))r.preferred.push('chest','rightchest','centerchest','leftshoulder','rightshoulder');
  else if(r.tags.some(t=>['illustration','texture'].includes(key(t))))r.preferred.push('front','back');
 }
 return {rules:mergeRules(r),unknown};
}
export const isImage=file=>file.type?.startsWith('image/')||/\.(png|jpe?g|webp|gif|avif|svg)$/i.test(file.name);
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
export const LAYOUTS={front:['front'],back:['back'],chestback:['chest','back'],frontback:['front','back'],chestbacksleeve:['chest','back','leftshoulder'],labels:['chest','back','necktag'],sleeves:['leftshoulder','rightshoulder']};
function overlaps(a,b){const large={front:['chest','rightchest','centerchest','pocket'],back:['backneck','leftblade','rightblade','lowerback']};return a===b||large[a]?.includes(b)||large[b]?.includes(a);}
export function randomPlan({assets,available,locked=[],layout='auto',mode='curated',repeat=false},random=Math.random){
 const usable=slot=>assets.some(a=>weight(a,slot)>0);
 function weight(a,slot){const r=a.rules||emptyRules();if(r.excluded.includes(slot))return 0;if(r.preferred.includes(slot))return 4;return mode==='explore'&&r.allowed.includes(slot)?1:0;}
 const open=available.filter(s=>!locked.some(l=>overlaps(s,l.slot)));
 let slots;
 if(layout==='auto'){
  // Choose a viable template first, then use compatible specialty spots if needed.
  const choices=Object.values(LAYOUTS).map(ss=>ss.filter(s=>open.includes(s)&&usable(s))).filter(ss=>ss.length);
  const specialties=open.filter(s=>usable(s)&&!Object.values(LAYOUTS).flat().includes(s));
  for(const slot of specialties)choices.push([slot]);
  slots=choices.length?choices[Math.floor(random()*choices.length)]:open.filter(usable);
  slots=slots.slice(0,3);
 }else if(layout==='current')slots=available.filter(s=>open.includes(s));
 else slots=(LAYOUTS[layout]||[]).filter(s=>open.includes(s));
 const used=new Set(locked.map(l=>l.assetId)),plan=[];
 for(const slot of slots){
  if(plan.some(p=>overlaps(p.slot,slot)))continue;
  const candidates=assets.filter(a=>(repeat||!used.has(a.id))&&weight(a,slot)>0);if(!candidates.length)continue;
  let pick=random()*candidates.reduce((sum,a)=>sum+weight(a,slot),0),chosen=candidates.at(-1);
  for(const a of candidates){pick-=weight(a,slot);if(pick<0){chosen=a;break;}}
  used.add(chosen.id);
  const explore=mode==='explore',small=!['front','back','lowerback'].includes(slot);
  plan.push({assetId:chosen.id,slot,scale:explore?.82+random()*.30:.94+random()*.10,x:explore?(random()-.5)*(small?.004:.012):0,y:explore?(random()-.5)*(small?.004:.018):0,rot:0});
 }
 return plan;
}
