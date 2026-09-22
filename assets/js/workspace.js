import {collectDrop} from './folder-import.js?v=58';
import {FORMAT_VERSION,LAYER_FIELDS,SETTING_FIELDS,pick,cleanFilename,canvasBlob,downloadBlob,validateProject} from './design-format.js?v=48';
const $=id=>document.getElementById(id);
const imageFile=f=>f.type.startsWith('image/')||/\.(png|jpe?g|webp|gif|avif|svg)$/i.test(f.name);
const pause=()=>new Promise(resolve=>setTimeout(resolve,0));
export function installWorkspace(api){
  const assets=new Map();let shelfIds=new Set(),ready=false,restoring=false,busy=false,saveTimer,dbPromise,saveChain=Promise.resolve(),revision=0,savedRevision=0,context={action:'choose'},pendingOpen=null;
  const scope=location.pathname.replace(/\/index\.html$/,'/');
  const dbName='orb-studio-36:'+scope;
  const status=(text)=>{
    const el=$('designStatus');
    const state=['Saved on this device','Design opened','Design file downloaded','Restored your last design'].includes(text)?'saved':
      ['Saving on this device…','Opening design…'].includes(text)?'saving':text==='Your work stays on this device.'?'info':'error';
    el.textContent=text;el.title=text;el.setAttribute('aria-label',text);el.dataset.state=state;
    el.dataset.icon=({saved:'✓',saving:'…',info:'○',error:'!'})[state];
  };
  const notify=()=>{revision++;if(ready&&!restoring){status('Saving on this device…');clearTimeout(saveTimer);saveTimer=setTimeout(autosave,900);}};
  function database(){
    if(!dbPromise)dbPromise=new Promise((resolve,reject)=>{const req=indexedDB.open(dbName,1);req.onupgradeneeded=()=>req.result.createObjectStore('workspace');req.onsuccess=()=>resolve(req.result);req.onerror=()=>reject(req.error);});
    return dbPromise;
  }
  async function dbGet(){const db=await database();return new Promise((resolve,reject)=>{const req=db.transaction('workspace').objectStore('workspace').get('current');req.onsuccess=()=>resolve(req.result);req.onerror=()=>reject(req.error);});}
  async function dbPut(data){const db=await database();return new Promise((resolve,reject)=>{const tx=db.transaction('workspace','readwrite');tx.objectStore('workspace').put(data,'current');tx.oncomplete=()=>resolve();tx.onerror=()=>reject(tx.error);tx.onabort=()=>reject(tx.error);});}
  async function register(entry,{show=true}={}){
    if(entry.assetId&&assets.has(entry.assetId)){const asset=assets.get(entry.assetId);if(!asset.entry.source&&entry.source)asset.entry={...asset.entry,source:entry.source};if(show)shelfIds.add(entry.assetId);renderShelf();return {...asset.entry,...entry};}
    let blob=entry.originalFile||await canvasBlob(entry.source);
    if(!blob.type){const ext=entry.sourceName.split('.').pop().toLowerCase(),type=({svg:'image/svg+xml',jpg:'image/jpeg',jpeg:'image/jpeg',webp:'image/webp',gif:'image/gif',avif:'image/avif'})[ext]||'image/png';blob=new Blob([blob],{type});}
    const bytes=await blob.arrayBuffer();
    const hash=Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',bytes))).map(n=>n.toString(16).padStart(2,'0')).join('');
    const id='asset-'+hash;
    if(!assets.has(id))assets.set(id,{id,name:entry.sourceName,blob,entry:{...entry,assetId:id}});
    else if(!assets.get(id).entry.source)assets.get(id).entry={...assets.get(id).entry,source:entry.source};
    if(show)shelfIds.add(id);renderShelf();notify();return assets.get(id).entry;
  }
  function renderShelf(){
    $('shelfCount').textContent=String(shelfIds.size);$('shelfSearch').hidden=shelfIds.size<7;
    for(const [grid,filter,remove] of [[$('shelfGrid'),$('shelfSearch').value,true],[$('assetGrid'),'',false]]){
      grid.replaceChildren();
      for(const id of shelfIds){const a=assets.get(id);if(!a||!a.name.toLowerCase().includes(filter.toLowerCase()))continue;
        const card=document.createElement('div');card.className='shelf-card';
        const button=document.createElement('button');button.type='button';button.className='shelf-use';button.title=a.name;button.setAttribute('aria-label','Use '+a.name);
        const img=new Image();img.src=a.entry.thumb;img.alt='';const label=document.createElement('span');label.textContent=a.entry.name;
        button.append(img,label);button.onclick=()=>chooseAsset(a,grid===$('shelfGrid')?{action:'choose'}:context);card.append(button);
        if(remove){const x=document.createElement('button');x.type='button';x.className='shelf-remove';x.textContent='×';x.title='Remove from library (placed layers stay)';x.setAttribute('aria-label','Remove '+a.name+' from library');x.onclick=()=>{shelfIds.delete(id);renderShelf();notify();};card.append(x);}
        grid.append(card);
      }
      if(!grid.children.length){const empty=document.createElement('p');empty.className='muted';empty.textContent=filter?'No matching artwork.':'Your uploaded graphics will appear here.';grid.append(empty);}
    }
  }
  async function chooseAsset(asset,ctx){
    if(busy||api.busy())return;busy=true;
    try{
      if(!asset.entry.source)asset.entry={...await api.decode(new File([asset.blob],asset.name,{type:asset.blob.type})),assetId:asset.id};
      $('assetDialog').close();
      if(ctx.action==='choose')api.chooseEntries([asset.entry]);
      else api.addEntries(ctx.slot,[asset.entry],ctx.action,ctx.target);
    }catch{status('This graphic could not be opened. Try uploading it again.');}finally{busy=false;}
  }
  function openAssets(ctx={action:'choose'}){if(busy||api.busy())return;context=ctx;renderShelf();$('assetTitle').textContent=ctx.action==='replace'?'Replace artwork':ctx.action==='add'?'Add artwork here':'Add artwork';$('assetDialog').showModal();}
  async function importImages(files){
    if(busy||api.busy())return;busy=true;$('shelfDrop').textContent='Adding artwork…';const failed=[];
    try{for(const file of files){if(!imageFile(file)){failed.push(file.name);continue;}try{if(shelfIds.size>=400)throw new Error('Library full');const entry=await register(await api.decode(file));if(!api.snapshot().layers.some(l=>l.assetId===entry.assetId))assets.get(entry.assetId).entry={...entry,source:null};}catch{failed.push(file.name);}await pause();}}
    finally{busy=false;$('shelfDrop').innerHTML='Drop images or folders here, or <strong>browse images</strong>';renderShelf();notify();}
    if(failed.length)status('Could not add: '+failed.join(', '));
  }
  async function dropFolder(transfer){
    if(busy||api.busy())return;
    try{
      const files=(await collectDrop(transfer)).map(item=>item.file).filter(imageFile);
      if(!files.length){status('No supported images found in this folder.');return;}
      await importImages(files);
    }catch(error){status(error.message||'Could not read this folder. Try Add folder.');}
  }
  $('folderBrowse').onclick=()=>{if(!busy&&!api.busy()){$('folderFiles').value='';$('folderFiles').click();}};
  $('folderFiles').onchange=()=>importImages(Array.from($('folderFiles').files).filter(imageFile));
  $('shelfDrop').onclick=()=>{if(!busy){$('shelfFile').value='';$('shelfFile').click();}};
  $('shelfDrop').onkeydown=e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();$('shelfDrop').click();}};
  $('shelfFile').onchange=()=>importImages(Array.from($('shelfFile').files));
  $('shelfSearch').oninput=renderShelf;
  $('artShelf').addEventListener('dragover',e=>{if(Array.from(e.dataTransfer?.types||[]).includes('Files')){e.preventDefault();e.stopPropagation();$('shelfDrop').classList.add('over');}});
  $('artShelf').addEventListener('dragleave',()=>{$('shelfDrop').classList.remove('over');});
  $('artShelf').addEventListener('drop',e=>{e.preventDefault();e.stopPropagation();$('drop').classList.remove('on');$('shelfDrop').classList.remove('over');dropFolder(e.dataTransfer);});
  $('assetBrowse').onclick=()=>{$('assetDialog').close();api.browse(context);};
  async function packageData(includeLibrary=false,finishEditing=true){
    if(finishEditing)api.finish();const snapshot=api.snapshot();
    // Register sources kept by an undo snapshot or imported before the tray existed.
    for(const layer of snapshot.layers)if(!assets.has(layer.assetId)){const a=await register(layer,{show:false});layer.assetId=a.assetId;}
    const ids=new Set(snapshot.layers.map(l=>l.assetId));if(includeLibrary)for(const id of shelfIds)ids.add(id);
    const records=Array.from(ids).map(id=>assets.get(id));
    const doc={format:'orb-design',version:FORMAT_VERSION,name:$('designName').value.trim()||'Untitled design',garmentId:snapshot.garmentId,settings:pick(snapshot.settings,SETTING_FIELDS),regularBackdrop:snapshot.regularBackdrop,lighting:snapshot.lighting,camera:snapshot.camera,customFlipped:snapshot.customFlipped,active:snapshot.active,layers:snapshot.layers.map(l=>pick(l,LAYER_FIELDS)),assets:records.map(a=>({id:a.id,name:a.name,type:a.blob.type||'image/png',path:'artwork/'+a.id+'.'+(a.blob.type==='image/svg+xml'?'svg':a.blob.type==='image/jpeg'?'jpg':a.blob.type==='image/webp'?'webp':a.blob.type==='image/gif'?'gif':a.blob.type==='image/avif'?'avif':'png')})),shelf:includeLibrary?Array.from(shelfIds):Array.from(ids)};
    const model=api.modelFile();if(doc.garmentId==='custom'){if(!model)throw new Error('Please re-upload the custom GLB before saving.');doc.modelPath='model/garment.glb';}
    const artworkSize=records.reduce((sum,a)=>sum+a.blob.size,0),modelSize=doc.garmentId==='custom'?model.size:0;
    if(artworkSize>300*1024*1024||modelSize>250*1024*1024||artworkSize+modelSize>340*1024*1024)throw new Error('This design is too large to save. Use smaller artwork files or exclude unused library graphics.');
    validateProject(doc,api.schema);
    return {doc,records:records.map(({id,name,blob})=>({id,name,blob})),model:doc.garmentId==='custom'?model:null};
  }
  async function makeArchive(includeLibrary=false){
    const {doc,records,model}=await packageData(includeLibrary),zip=new window.JSZip();
    zip.file('design.json',JSON.stringify(doc,null,2));
    for(const a of doc.assets)zip.file(a.path,await records.find(r=>r.id===a.id).blob.arrayBuffer());
    if(model)zip.file(doc.modelPath,await model.arrayBuffer());
    return zip.generateAsync({type:'blob',compression:'STORE'});
  }
  async function autosave(){
    if(!ready||restoring)return;
    if(busy||api.busy()){clearTimeout(saveTimer);saveTimer=setTimeout(autosave,900);return;}
    const savingRevision=revision;
    saveChain=saveChain.catch(()=>{}).then(async()=>{
      const data=await packageData(true,false);data.revision=savingRevision;
      await dbPut(data);savedRevision=savingRevision;
      if(revision===savingRevision)status('Saved on this device');
    }).catch(()=>{status('Browser save unavailable. Use Save design to keep your work.');});
    await saveChain;
  }
  async function decodePackage(data){
    validateProject(data.doc,api.schema);
    const staged=new Map();
    for(const a of data.doc.assets){const record=data.records.find(r=>r.id===a.id);if(!record?.blob)throw new Error('An artwork file is missing.');
      const entry=await api.decode(new File([record.blob],a.name,{type:a.type}));entry.assetId=a.id;if(!data.doc.layers.some(l=>l.assetId===a.id))entry.source=null;staged.set(a.id,{...record,name:a.name,entry});
    }
    const layers=data.doc.layers.map(l=>({...staged.get(l.assetId).entry,...pick(l,LAYER_FIELDS),solidInvert:l.solidInvert}));
    return {staged,layers};
  }
  async function applyPackage(data,{mergeLibrary=true}={}){
    const {staged,layers}=await decodePackage(data);
    const snapshot={...data.doc,layers};
    // Decode and validate everything before replacing the active design.
    await api.restore(snapshot,data.model);
    for(const [id,a] of staged)assets.set(id,a);
    const incoming=(data.doc.shelf||Array.from(staged.keys())).filter(id=>staged.has(id));
    shelfIds=mergeLibrary?new Set([...shelfIds,...incoming]):new Set(incoming);
    $('designName').value=data.doc.name;api.clearHistory();renderShelf();
  }
  async function readArchive(file){
    if(file.size>350*1024*1024)throw new Error('This design file is too large to open (350 MB limit).');
    const zip=await window.JSZip.loadAsync(file),manifest=zip.file('design.json');
    if(!manifest||manifest._data.uncompressedSize>2*1024*1024)throw new Error('This ZIP does not contain a valid ORB design.');
    const doc=validateProject(JSON.parse(await manifest.async('string')),api.schema),records=[];
    let total=0;
    for(const a of doc.assets){const f=zip.file(a.path);if(!f)throw new Error('Missing artwork: '+a.name);total+=f._data.uncompressedSize;if(total>300*1024*1024)throw new Error('The artwork in this design is too large.');records.push({id:a.id,name:a.name,blob:new Blob([await f.async('uint8array')],{type:a.type})});}
    let model=null;if(doc.modelPath){const f=zip.file(doc.modelPath);if(!f||f._data.uncompressedSize>250*1024*1024)throw new Error('The custom garment is missing or too large.');model=new File([await f.async('uint8array')],'garment.glb',{type:'model/gltf-binary'});}
    return {doc,records,model};
  }
  async function openFile(file){
    if(busy||api.busy())return;busy=true;restoring=true;clearTimeout(saveTimer);api.lock(true,'Opening design…');status('Opening design…');let opened=false;
    try{const data=await readArchive(file);await applyPackage(data);opened=true;status('Design opened');}
    catch(e){status(e.message||'This design could not open.');}
    finally{restoring=false;busy=false;api.lock(false);if(opened)notify();}
  }
  function confirmAction(action){pendingOpen=action;$('confirmTitle').textContent=action.file?'Open another design?':'Start a new design?';$('confirmText').textContent='Save your current design before continuing. Your artwork library stays available.';$('confirmContinue').textContent=action.file?'Open design':'Start new';$('confirmDialog').showModal();}
  async function continueAction(){const action=pendingOpen;pendingOpen=null;$('confirmDialog').close();if(action?.file)await openFile(action.file);else{api.newDesign();$('designName').value='Untitled design';notify();}}
  $('confirmContinue').onclick=continueAction;
  $('confirmSave').onclick=async()=>{const button=$('confirmSave');button.disabled=true;try{await saveDesign();await continueAction();}catch(e){$('confirmText').textContent=e.message;}finally{button.disabled=false;}};
  $('designNew').onclick=()=>{if(!busy&&!api.busy())confirmAction({});};
  $('designOpen').onclick=()=>{if(!busy&&!api.busy()){$('projectFile').value='';$('projectFile').click();}};
  $('projectFile').onchange=()=>{if($('projectFile').files[0])confirmAction({file:$('projectFile').files[0]});};
  async function saveDesign(){const blob=await makeArchive($('saveIncludeLibrary').checked);downloadBlob(blob,cleanFilename($('designName').value)+'.orb');status('Design file downloaded');return blob;}
  $('designSave').onclick=()=>{if(!busy&&!api.busy()){$('saveStatus').textContent='';$('saveDialog').showModal();}};
  $('saveConfirm').onclick=async()=>{if(busy||api.busy())return;busy=true;$('saveConfirm').disabled=true;$('saveStatus').textContent='Packaging artwork…';try{await saveDesign();$('saveDialog').close();}catch(e){$('saveStatus').textContent=e.message;}finally{busy=false;$('saveConfirm').disabled=false;}};
  $('designName').addEventListener('input',notify);
  document.getElementById('gl').addEventListener('wheel',notify,{passive:true});
  for(const button of document.querySelectorAll('[data-close-dialog]'))button.onclick=()=>{if(!busy)button.closest('dialog').close();};
  for(const dialog of document.querySelectorAll('.workspace-dialog'))dialog.addEventListener('cancel',e=>{if(busy)e.preventDefault();});
  document.addEventListener('change',e=>{if(e.target.closest('#panel,header,#colorPopover'))notify();});
  document.addEventListener('click',e=>{if(e.target.closest('#panel,header,#colorPopover'))queueMicrotask(notify);});
  window.addEventListener('beforeunload',e=>{if(ready&&revision!==savedRevision){e.preventDefault();e.returnValue='';}});
  document.addEventListener('visibilitychange',()=>{if(document.hidden)autosave();});
  return {register,openAssets,notify,makeArchive,dropFolder,artworkData:()=>packageData(false),dropProject:file=>confirmAction({file}),get busy(){return busy;},
    async ready(){
      restoring=true;try{
        const data=await dbGet();if(data){await applyPackage(data,{mergeLibrary:false});status('Restored your last design');}
        else{for(const entry of api.snapshot().layers)await register(entry);status('Your work stays on this device.');}
      }catch(e){status('Automatic recovery unavailable. You can still Save / Open design files.');}
      finally{restoring=false;ready=true;revision=0;savedRevision=0;renderShelf();}
    }
  };
}
