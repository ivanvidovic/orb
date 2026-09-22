import {GROUPS,TYPES,emptyRules,mergeRules,rulesFromPath,collectDrop,isImage,randomPlan} from './asset-rules.js?v=54';
const $=id=>document.getElementById(id);
const list=text=>[...new Set(text.split(',').map(s=>s.trim()).filter(Boolean))].slice(0,40).map(s=>s.slice(0,80));
export function installCuration(api){
 if(!api.meta)return {match:()=>true,decorate(){},refresh(){}};
 const selected=new Set();let editing=[],pending=[];
 const toolbar=document.createElement('div');toolbar.className='library-tools';toolbar.innerHTML=`
 <div class="library-actions"><button id="folderBrowse" type="button">Add folder</button><button id="editAssets" type="button" disabled>Edit selected</button><button id="randomOpen" type="button">Randomize</button></div>
 <div class="library-filters"><label>Project<select id="libraryProject"><option value="">All projects</option></select></label><label>Tag<select id="libraryTag"><option value="">All tags</option></select></label></div>
 <div class="library-actions"><button id="selectAssets" type="button">Select filtered</button><button id="clearAssets" type="button">Clear selection</button><span id="selectedCount">0 selected</span></div>
 <p id="libraryMessage" class="muted" role="status" aria-live="polite"></p><input id="folderFiles" type="file" webkitdirectory multiple hidden>`;
 $('shelfDrop').after(toolbar);
 const holder=document.createElement('div');holder.innerHTML=`
 <dialog id="assetRulesDialog" class="workspace-dialog" aria-labelledby="rulesTitle"><div class="workspace-head"><h2 id="rulesTitle">Asset settings</h2><button type="button" data-curation-close>×</button></div><div class="workspace-body">
 <p id="rulesSummary" class="muted"></p><label class="curation-field">Projects (comma separated)<input id="rulesProjects" maxlength="3200"></label><label class="curation-field">Tags (comma separated)<input id="rulesTags" maxlength="3200" placeholder="Logos, Fireside, Symbols"></label>
 <label class="curation-field">Quick setup<select id="rulesPreset"><option value="">Choose a preset…</option><option value="large">Large graphic</option><option value="logo">Small logo</option><option value="wordmark">Wordmark</option><option value="neck">Neck label</option><option value="any">Anywhere</option><option value="none">Exclude everywhere</option></select></label>
 <p class="muted">Preferred is used in both modes. Allowed is used in Explore. Excluded is never used. For several assets, blank text fields and “Keep existing” leave settings unchanged.</p>
 <div id="rulesPlacements" class="rules-placements"></div><button id="rulesSave" class="primary-action" type="button">Save settings</button></div></dialog>
 <dialog id="folderReview" class="workspace-dialog" aria-labelledby="folderTitle"><div class="workspace-head"><h2 id="folderTitle">Import folder</h2><button type="button" data-curation-close>×</button></div><div class="workspace-body"><p id="folderSummary"></p><div id="folderGroups" class="folder-groups"></div><p id="folderNotes" class="muted"></p><button id="folderImport" class="primary-action" type="button">Add to library</button></div></dialog>
 <dialog id="randomDialog" class="workspace-dialog random-panel" aria-labelledby="randomTitle"><div class="workspace-head"><h2 id="randomTitle">Generate a variation</h2><button type="button" data-curation-close>×</button></div><div class="workspace-body">
 <label class="curation-field">Asset pool<select id="randomPool"><option value="filtered">Current library filter</option><option value="selected">Selected assets</option><option value="all">Whole library</option></select></label>
 <label class="curation-field">Layout<select id="randomLayout"><option value="auto">Auto</option><option value="front">Front only</option><option value="back">Back only</option><option value="chestback">Chest + Back</option><option value="frontback">Front + Back</option><option value="chestbacksleeve">Chest + Back + Sleeve</option><option value="labels">Chest + Back + Neck tag</option><option value="sleeves">Both sleeves</option><option value="current">Current placements</option></select></label>
 <label class="curation-field">Variation<select id="randomMode"><option value="curated">Curated</option><option value="explore">Explore</option></select></label>
 <label class="check-option"><input type="checkbox" id="randomRepeat">Allow repeated graphics</label>
 <p class="muted">Replaces unlocked layers. Locked layers stay exactly as they are. New graphics keep their original colors. Garment and lighting stay unchanged. Undo returns to the previous design.</p>
 <p id="randomSummary" role="status" aria-live="polite"></p><div class="library-actions"><button id="randomGo" class="primary-action" type="button">Randomize</button><button id="randomUndo" type="button">Undo last change</button></div></div></dialog>`;
 document.body.append(holder);
 for(const b of holder.querySelectorAll('[data-curation-close]')){b.setAttribute('aria-label','Close');b.onclick=()=>{if(!api.busy())b.closest('dialog').close();};}
 for(const d of holder.querySelectorAll('dialog'))d.addEventListener('cancel',e=>{if(api.busy())e.preventDefault();});
 function message(text){$('libraryMessage').textContent=text;}
 function match(a,search=''){
  const r=a.rules||emptyRules();return (!$('libraryProject').value||r.projects.includes($('libraryProject').value))&&(!$('libraryTag').value||r.tags.includes($('libraryTag').value))&&[a.name,...r.projects,...r.tags].join(' ').toLowerCase().includes(search.toLowerCase());
 }
 function refresh(){
  const all=api.assets();for(const id of selected)if(!all.some(a=>a.id===id))selected.delete(id);
  for(const [id,field,label] of [['libraryProject','projects','All projects'],['libraryTag','tags','All tags']]){
   const select=$(id),value=select.value,values=[...new Set(all.flatMap(a=>(a.rules||emptyRules())[field]))].sort();select.replaceChildren(new Option(label,''));for(const v of values)select.append(new Option(v,v));select.value=values.includes(value)?value:'';
  }
  $('selectedCount').textContent=selected.size+' selected';$('editAssets').disabled=!selected.size;
 }
 function decorate(card,a){
  const check=document.createElement('input');check.type='checkbox';check.className='asset-select';check.checked=selected.has(a.id);check.setAttribute('aria-label','Select '+a.name);check.onchange=()=>{if(check.checked)selected.add(a.id);else selected.delete(a.id);refresh();};
  const edit=document.createElement('button');edit.type='button';edit.className='asset-edit';edit.textContent='Tags & spots';edit.onclick=()=>openEditor([a.id]);
  const note=document.createElement('span');note.className='asset-tags';const r=a.rules||emptyRules();note.textContent=[...r.projects,...r.tags].join(' · ')||((r.preferred.length||r.allowed.length)?'Placement rules set':'Needs placement rules');note.title=note.textContent;
  card.append(check,note,edit);
 }
 for(const id of ['libraryProject','libraryTag'])$(id).onchange=()=>api.render();
 $('selectAssets').onclick=()=>{for(const a of api.assets())if(match(a,$('shelfSearch').value))selected.add(a.id);api.render();};
 $('clearAssets').onclick=()=>{selected.clear();api.render();};
 function openEditor(ids){
  if(api.busy())return;editing=ids;const multi=ids.length>1,a=api.assets().find(a=>a.id===ids[0]),r=a.rules||emptyRules();
  $('rulesSummary').textContent=multi?`${ids.length} assets selected. Edits apply to all selected assets.`:a.name;
  $('rulesProjects').value=multi?'':r.projects.join(', ');$('rulesTags').value=multi?'':r.tags.join(', ');$('rulesPreset').value='';$('rulesPlacements').replaceChildren();
  for(const [slot,m] of Object.entries(api.meta)){const label=document.createElement('label'),select=document.createElement('select');label.textContent=m.label;select.dataset.slot=slot;
   if(multi)select.append(new Option('Keep existing','keep'));
   for(const [value,title] of [['preferred','Preferred'],['allowed','Allowed'],['excluded','Excluded']])select.append(new Option(title,value));
   select.value=multi?'keep':r.excluded.includes(slot)?'excluded':r.preferred.includes(slot)?'preferred':r.allowed.includes(slot)?'allowed':'excluded';label.append(select);$('rulesPlacements').append(label);
  }
  $('assetRulesDialog').showModal();
 }
 $('editAssets').onclick=()=>openEditor([...selected]);
 $('rulesPreset').onchange=()=>{
  const preset=$('rulesPreset').value;if(!preset)return;
  const pref=({large:['front','back'],logo:['chest','rightchest','leftshoulder','rightshoulder'],wordmark:['centerchest','front','back'],neck:['necktag'],any:Object.keys(api.meta),none:[]})[preset];
  for(const s of $('rulesPlacements').querySelectorAll('select'))s.value=pref.includes(s.dataset.slot)?'preferred':'excluded';
  const tag=({large:'Illustrations',logo:'Logos',wordmark:'Wordmarks',neck:'Labels'})[preset];if(tag)$('rulesTags').value=[...new Set([...list($('rulesTags').value),tag])].join(', ');
 };
 $('rulesSave').onclick=()=>{
  if(api.busy())return;
  for(const a of api.assets().filter(a=>editing.includes(a.id))){const r=structuredClone(a.rules||emptyRules());
   for(const [id,k] of [['rulesProjects','projects'],['rulesTags','tags']])if(editing.length===1||$(id).value.trim())r[k]=list($(id).value);
   for(const s of $('rulesPlacements').querySelectorAll('select'))if(s.value!=='keep'){for(const k of ['preferred','allowed','excluded'])r[k]=r[k].filter(v=>v!==s.dataset.slot);r[s.value].push(s.dataset.slot);}
   a.rules=r;
  }
  api.notify();api.render();$('assetRulesDialog').close();
 };
 async function review(items){
  const images=items.filter(i=>isImage(i.file));if(!images.length){message('No supported images found. Use Add folder if this browser cannot read a dropped folder.');return;}
  if(images.length>400||images.reduce((n,i)=>n+i.file.size,0)>300*1024*1024){message('Import up to 400 images and 300 MB at a time.');return;}
  pending=images.map(i=>({...i,...rulesFromPath(i.path,api.meta)}));
  $('folderSummary').textContent=`${pending.length} images · ${items.length-images.length} non-image files skipped. Originals stay unchanged.`;
  const groups=new Map();for(const i of pending){const dir=i.path.split('/').slice(0,-1).join('/')||'Loose images';groups.set(dir,(groups.get(dir)||0)+1);}
  $('folderGroups').replaceChildren();for(const [dir,count] of groups){const p=document.createElement('p');p.textContent=`${dir} · ${count} images`;$('folderGroups').append(p);}
  const unknown=[...new Set(pending.flatMap(i=>i.unknown))];$('folderNotes').textContent=(unknown.length?'Custom tags: '+unknown.join(', ')+'. ':'')+'Placement folders restrict randomization to their group. Type-only folders suggest placements. Unclassified assets need placement rules before randomizing. Duplicate images combine metadata.';
  $('folderReview').showModal();
 }
 async function drop(transfer){if(api.busy())return;try{await review(await collectDrop(transfer));}catch(e){message(e.message);}}
 $('folderBrowse').onclick=()=>{if(!api.busy()){$('folderFiles').value='';$('folderFiles').click();}};
 $('folderFiles').onchange=()=>{if(!api.busy())review(Array.from($('folderFiles').files).map(file=>({file,path:file.webkitRelativePath||file.name})));};
 $('folderImport').onclick=async()=>{if(api.busy())return;const batch=pending;pending=[];$('folderReview').close();const result=await api.importImages(batch);message(result?.failed.length?'Some files could not be added: '+result.failed.join(', '):'Folder import finished. Use Tags & spots to adjust the inferred settings.');};
 $('randomOpen').onclick=()=>{if(api.busy())return;$('randomSummary').textContent='Lock layers in their artwork controls to keep them between variations.';if(!$('randomDialog').open)$('randomDialog').show();};
 $('randomGo').onclick=async()=>{
  if(api.busy())return;
  const pool=$('randomPool').value,all=api.assets().filter(a=>pool==='all'||(pool==='selected'?selected.has(a.id):match(a,$('shelfSearch').value)));
  const snapshot=api.snapshot(),locked=snapshot.layers.filter(l=>l.randomLocked),supported=api.available();
  if(!supported.length){$('randomSummary').textContent='Randomization is available for the built-in garments.';return;}
  const layout=$('randomLayout').value,available=layout==='current'?[...new Set(snapshot.layers.map(l=>l.slot))].filter(s=>supported.includes(s)):supported;
  const plan=randomPlan({assets:all,available,locked,layout,mode:$('randomMode').value,repeat:$('randomRepeat').checked});
  if(!plan.length){$('randomSummary').textContent='No compatible unlocked placements. Check the asset pool, placement rules, or layer locks. Nothing changed.';return;}
  $('randomGo').disabled=true;
  try{await api.randomize(plan);$('randomSummary').textContent=`Placed ${plan.length} graphics. ${locked.length} locked layers kept. Randomize again or close to inspect.`;}
  catch(e){$('randomSummary').textContent=e.message||'Could not generate a variation. Your design was kept.';}
  finally{$('randomGo').disabled=false;}
 };
 $('randomUndo').onclick=async()=>{if(!api.busy()){await api.undo();$('randomSummary').textContent='Returned to the previous design edit.';}};
 return {match,decorate,refresh,drop};
}
