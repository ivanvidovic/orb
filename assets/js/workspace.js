import {installArtworkPaste} from './clipboard-artwork.js?v=91-paste';
import {loadHostedLibrary,fetchHostedArtwork} from './hosted-library.js?v=77';
import {collectDrop} from './folder-import.js?v=58';
import {FORMAT_VERSION,LAYER_FIELDS,SETTING_FIELDS,pick,cleanFilename,canvasBlob,downloadBlob,validateProject} from './design-format.js?v=0.9.61';
const $=id=>document.getElementById(id);
const imageFile=f=>f.type.startsWith('image/')||/\.(png|jpe?g|webp|gif|avif|svg)$/i.test(f.name);
const pause=()=>new Promise(resolve=>setTimeout(resolve,0));
export function installWorkspace(api){
  const hostedAssets=new Map();let libraryName='',automaticName=true;
  const defaultName=()=>libraryName?libraryName+' Garment':'ORB Garment';
  const assets=new Map();let shelfIds=new Set(),ready=false,restoring=false,busy=false,saveTimer,dbPromise,saveChain=Promise.resolve(),revision=0,savedRevision=0,context={action:'choose'},pendingOpen=null;
  let preserveRecovery=false,storageAvailable=true,recoveryBlocked=false;
  const report=(stage,error)=>{console.warn('[ORB] '+stage,error);status(stage+': '+(error?.message||error?.name||'Unavailable')+'. Use Save to keep your work.');};
  const scope=location.pathname.replace(/\/index\.html$/,'/');
  const shelf=$('artShelf'),shelfHint=$('shelfAvailable'),shelfSeenKey='orb-library-seen:'+scope;
  let shelfSeen=false;try{shelfSeen=localStorage.getItem(shelfSeenKey)==='1';}catch{}
  shelf.open=false;
  shelf.addEventListener('toggle',()=>{if(!shelf.open)return;shelfSeen=true;shelfHint.hidden=true;try{localStorage.setItem(shelfSeenKey,'1');}catch{}});
  const dbName='orb-studio-36:'+scope;
  const status=(text)=>{
    const el=$('designStatus');
    const state=['Saved on this device','Design opened','Design file downloaded','Restored your last design'].includes(text)?'saved':
      ['Saving on this device…','Opening design…'].includes(text)?'saving':text==='Your work stays on this device.'?'info':'error';
    el.textContent=text;el.removeAttribute('title');el.dataset.tip=text;el.setAttribute('aria-label',text);el.dataset.state=state;
    el.dataset.icon=({saved:'✓',saving:'…',info:'○',error:'!'})[state];
  };
  const notify=()=>{revision++;if(ready&&!restoring){status('Saving on this device…');clearTimeout(saveTimer);saveTimer=setTimeout(autosave,900);}};
  function database(){
    if(!dbPromise){
      dbPromise=new Promise((resolve,reject)=>{
        const req=indexedDB.open(dbName,1);let settled=false;
        const timeout=setTimeout(()=>{settled=true;reject(new Error('Browser storage did not respond'));},8000);
        req.onupgradeneeded=()=>{if(!req.result.objectStoreNames.contains('workspace'))req.result.createObjectStore('workspace');};
        req.onsuccess=()=>{
          const db=req.result;
          if(settled){db.close();return;}settled=true;clearTimeout(timeout);
          db.onversionchange=()=>{db.close();dbPromise=null;};
          db.onclose=()=>{dbPromise=null;};
          resolve(db);
        };
        req.onerror=()=>{settled=true;clearTimeout(timeout);reject(req.error);};
        req.onblocked=()=>status('Recovery storage is waiting. Close other ORB tabs, then retry.');
      }).catch(error=>{dbPromise=null;throw error;});
    }
    return dbPromise;
  }
  async function dbGet(){const db=await database();return new Promise((resolve,reject)=>{const req=db.transaction('workspace').objectStore('workspace').get('current');req.onsuccess=()=>resolve(req.result);req.onerror=()=>reject(req.error);});}
  async function dbPut(data){
    const db=await database();
    return new Promise((resolve,reject)=>{
      const tx=db.transaction('workspace','readwrite'),store=tx.objectStore('workspace');
      // Preserve an unreadable/unrestored snapshot before replacing current.
      if(preserveRecovery){
        const old=store.get('current');
        old.onsuccess=()=>{if(old.result){const backup=store.get('recovery-backup');backup.onsuccess=()=>{if(!backup.result)store.put(old.result,'recovery-backup');};}};
      }
      store.put(data,'current');
      tx.oncomplete=()=>{preserveRecovery=false;resolve();};
      tx.onerror=()=>reject(tx.error);tx.onabort=()=>reject(tx.error);
    });
  }
  async function register(entry,{show=true}={}){
    if(entry.assetId&&assets.has(entry.assetId)){const asset=assets.get(entry.assetId);if(!asset.entry.source&&entry.source)asset.entry={...asset.entry,source:entry.source};if(show)shelfIds.add(entry.assetId);renderShelf();return {...asset.entry,...entry};}
    let blob=entry.originalFile||await canvasBlob(entry.source);
    if(!blob.type){const ext=entry.sourceName.split('.').pop().toLowerCase(),type=({svg:'image/svg+xml',jpg:'image/jpeg',jpeg:'image/jpeg',webp:'image/webp',gif:'image/gif',avif:'image/avif'})[ext]||'image/png';blob=new Blob([blob],{type});}
    if(!globalThis.crypto?.subtle)throw new Error('Open ORB over HTTPS to enable artwork saving');
    if(blob.type==='image/png'&&/\.svg$/i.test(entry.sourceName||''))entry={...entry,sourceName:entry.sourceName.replace(/\.svg$/i,'.png')};
    const bytes=await blob.arrayBuffer();
    const hash=Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',bytes))).map(n=>n.toString(16).padStart(2,'0')).join('');
    const id='asset-'+hash;
    if(!assets.has(id))assets.set(id,{id,name:entry.sourceName,blob,entry:{...entry,assetId:id}});
    else if(!assets.get(id).entry.source)assets.get(id).entry={...assets.get(id).entry,source:entry.source};
    if(show)shelfIds.add(id);renderShelf();notify();return assets.get(id).entry;
  }
  const libraryMessage=text=>{for(const id of ['hostedLibraryStatus','assetLibraryStatus']){const el=$(id);if(el){el.textContent=text;el.hidden=!text;}}};
  async function loadLibrary(){
    if(!new URLSearchParams(location.search||'').get('library'))return;
    libraryMessage('Loading library…');
    try{const library=await loadHostedLibrary(location.href);if(!library)return;
      hostedAssets.clear();for(const asset of library.assets)hostedAssets.set(asset.id,asset);
      libraryName=library.name;if(automaticName)$('designName').value=defaultName();libraryMessage(libraryName+' · '+hostedAssets.size+' graphics');renderShelf();
    }catch(error){libraryMessage(error.message||'Library unavailable. Reload to retry.');}
  }
  async function materializeHosted(asset){
    if(assets.has(asset.id))return assets.get(asset.id);
    const file=await fetchHostedArtwork(asset);
    const local={id:asset.id,name:asset.name,blob:file,entry:{...asset.entry,assetId:asset.id,originalFile:file}};
    assets.set(asset.id,local);return local;
  }
  function renderShelf(){
    const visible=new Map(hostedAssets);for(const id of shelfIds)if(assets.has(id))visible.set(id,assets.get(id));
    $('shelfCount').textContent=String(visible.size);shelfHint.hidden=shelfSeen||shelf.open||visible.size===0;$('shelfSearch').hidden=visible.size<7;
    for(const [grid,filter,remove] of [[$('shelfGrid'),$('shelfSearch').value,true],[$('assetGrid'),'',false]]){
      grid.replaceChildren();
      for(const [id,a] of visible){if(!a.name.toLowerCase().includes(filter.toLowerCase()))continue;
        const card=document.createElement('div');card.className='shelf-card';
        const button=document.createElement('button');button.type='button';button.className='shelf-use';button.title=a.name;button.setAttribute('aria-label','Use '+a.name);
        const img=new Image();img.src=a.entry.thumb;img.alt='';img.loading='lazy';img.decoding='async';const label=document.createElement('span');label.textContent=a.entry.name;
        button.append(img,label);button.onclick=()=>chooseAsset(a,grid===$('shelfGrid')?{action:'choose'}:context);card.append(button);
        if(remove&&!hostedAssets.has(id)){const x=document.createElement('button');x.type='button';x.className='shelf-remove';x.textContent='×';x.title='Remove from library (placed layers stay)';x.setAttribute('aria-label','Remove '+a.name+' from library');x.onclick=()=>{shelfIds.delete(id);renderShelf();notify();};card.append(x);}
        grid.append(card);
      }
      if(!grid.children.length){const empty=document.createElement('p');empty.className='muted';empty.textContent=filter?'No matching artwork.':'Your uploaded graphics will appear here.';grid.append(empty);}
    }
  }
  async function chooseAsset(asset,ctx){
    if(busy||api.busy())return;busy=true;
    try{
      if(asset.hosted){libraryMessage('Loading '+asset.entry.name+'…');asset=await materializeHosted(asset);}
      if(!asset.entry.source)asset.entry={...await api.decode(new File([asset.blob],asset.name,{type:asset.blob.type})),name:asset.entry.name,assetId:asset.id};
      $('assetDialog').close();
      if(ctx.action==='presentation')api.presentationAsset(asset.entry);
      else if(ctx.action==='choose')api.chooseEntries([asset.entry]);
      else api.addEntries(ctx.slot,[asset.entry],ctx.action,ctx.target);
      if(libraryName)libraryMessage(libraryName+' · '+hostedAssets.size+' graphics');
    }catch(error){libraryMessage(error.message||'This graphic could not be opened. Click it to retry.');}finally{busy=false;}
  }
  function openAssets(ctx={action:'choose'}){if(busy||api.busy())return;context=ctx;$('assetBrowse').hidden=ctx.action==='presentation';renderShelf();$('assetTitle').textContent=ctx.action==='presentation'?'Presentation background':ctx.action==='replace'?'Replace artwork':ctx.action==='add'?'Add artwork here':'Add artwork';$('assetDialog').showModal();}
  async function importImages(files,{place=false}={}){
    if(busy||api.busy())return;busy=true;$('shelfDropLabel').textContent='Adding artwork…';$('shelfBrowse').disabled=$('folderBrowse').disabled=true;const failed=[],entries=[];
    try{for(const file of files){if(!imageFile(file)){failed.push(file.name);continue;}try{if(shelfIds.size>=400)throw new Error('Library full');const entry=await register(await api.decode(file));if(place)entries.push(entry);if(!api.snapshot().layers.some(l=>l.assetId===entry.assetId))assets.get(entry.assetId).entry={...entry,source:null};}catch{failed.push(file.name);}await pause();}}
    finally{busy=false;$('shelfDropLabel').textContent='Drop images or folders · Browse';$('shelfBrowse').disabled=$('folderBrowse').disabled=false;renderShelf();notify();}
    if(failed.length)status('Could not add: '+failed.join(', '));
    // Cancelling placement leaves the image in the library. Avoid stacking
    // dialogs if another one opened while decoding the clipboard image.
    if(place&&entries.length&&!api.busy()&&!document.querySelector('dialog[open]'))api.chooseEntries(entries);
  }
  installArtworkPaste({
    blocked:()=>!ready||restoring||busy||api.busy()||!!document.querySelector('dialog[open]')||!$('colorPopover').hidden,
    importImages:files=>importImages(files,{place:true})
  });
  async function dropFolder(transfer){
    if(busy||api.busy())return;
    try{
      const files=(await collectDrop(transfer)).map(item=>item.file).filter(imageFile);
      if(!files.length){status('No supported images found in this folder.');return;}
      await importImages(files);
    }catch(error){status(error.message||'Could not read this folder. Try Browse folder.');}
  }
  $('folderBrowse').onclick=()=>{if(!busy&&!api.busy()){$('folderFiles').value='';$('folderFiles').click();}};
  $('folderFiles').onchange=()=>importImages(Array.from($('folderFiles').files).filter(imageFile));
  $('shelfBrowse').onclick=()=>{if(!busy&&!api.busy()){$('shelfFile').value='';$('shelfFile').click();}};
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
    const ids=new Set(snapshot.layers.map(l=>l.assetId));if(snapshot.settings.presentation?.graphic)ids.add(snapshot.settings.presentation.graphic);if(includeLibrary)for(const id of shelfIds)ids.add(id);
    // Autosave never downloads unused hosted graphics. Explicit Include library does.
    if(includeLibrary&&finishEditing)for(const asset of hostedAssets.values()){const a=await materializeHosted(asset);ids.add(a.id);}
    const records=Array.from(ids).map(id=>assets.get(id));
    const doc={format:'orb-design',version:FORMAT_VERSION,name:$('designName').value.trim()||defaultName(),garmentId:snapshot.garmentId,settings:pick(snapshot.settings,SETTING_FIELDS),regularBackdrop:snapshot.regularBackdrop,lighting:snapshot.lighting,camera:snapshot.camera,customFlipped:snapshot.customFlipped,active:snapshot.active,layers:snapshot.layers.map(l=>pick(l,LAYER_FIELDS)),assets:records.map(a=>({id:a.id,name:a.name,type:a.blob.type||'image/png',path:'artwork/'+a.id+'.'+(a.blob.type==='image/svg+xml'?'svg':a.blob.type==='image/jpeg'?'jpg':a.blob.type==='image/webp'?'webp':a.blob.type==='image/gif'?'gif':a.blob.type==='image/avif'?'avif':'png')})),shelf:includeLibrary?Array.from(new Set([...shelfIds,...ids])):Array.from(ids)};
    const model=api.modelFile();if(doc.garmentId==='custom'){if(!model)throw new Error('Please re-upload the custom GLB before saving.');doc.modelPath='model/garment.glb';}
    const artworkSize=records.reduce((sum,a)=>sum+a.blob.size,0),modelSize=doc.garmentId==='custom'?model.size:0;
    if(artworkSize>300*1024*1024||modelSize>250*1024*1024||artworkSize+modelSize>340*1024*1024)throw new Error('This design is too large to save. Use smaller artwork files or exclude unused library graphics.');
    validateProject(doc,api.schema);
    return {doc,records:records.map(({id,name,blob})=>({id,name,blob})),model:doc.garmentId==='custom'?model:null};
  }
  async function archiveData({doc,records,model}){
    const zip=new window.JSZip();
    zip.file('design.json',JSON.stringify(doc,null,2));
    for(const a of doc.assets)zip.file(a.path,await records.find(r=>r.id===a.id).blob.arrayBuffer());
    if(model)zip.file(doc.modelPath,await model.arrayBuffer());
    return zip.generateAsync({type:'blob',compression:'STORE'});
  }
  async function makeArchive(includeLibrary=false){return archiveData(await packageData(includeLibrary));}
  async function autosave(){
    if(!ready||restoring||revision===savedRevision)return;
    if(recoveryBlocked){status('Your previous design is preserved. Use New for a men’s tee design, or open the original on desktop.');return;}
    if(!storageAvailable){status('Temporary session. Automatic saving is unavailable; use Save to download your design.');return;}
    if(!document.hidden&&api.deferAutosave?.()){clearTimeout(saveTimer);saveTimer=setTimeout(autosave,900);return;}
    if(busy||api.busy()){clearTimeout(saveTimer);saveTimer=setTimeout(autosave,900);return;}
    const savingRevision=revision;
    saveChain=saveChain.catch(()=>{}).then(async()=>{
      const data=await packageData(true,false);data.revision=savingRevision;
      await dbPut(data);savedRevision=savingRevision;
      if(revision===savingRevision)status('Saved on this device');
    }).catch(error=>{report('Automatic save failed',error);});
    await saveChain;
  }
  async function decodePackage(data){
    validateProject(data.doc,api.schema);
    const staged=new Map();
    for(const a of data.doc.assets){const record=data.records.find(r=>r.id===a.id);if(!record?.blob)throw new Error('An artwork file is missing.');
      const entry=await api.decode(new File([record.blob],a.name,{type:a.type}));entry.assetId=a.id;if(!data.doc.layers.some(l=>l.assetId===a.id)&&data.doc.settings.presentation?.graphic!==a.id)entry.source=null;staged.set(a.id,{...record,name:entry.sourceName||a.name,blob:entry.originalFile||record.blob,entry});
    }
    const layers=data.doc.layers.map(l=>({...staged.get(l.assetId).entry,...pick(l,LAYER_FIELDS),solidInvert:l.solidInvert}));
    return {staged,layers};
  }
  async function applyPackage(data,{mergeLibrary=true,preserveEnvironment=false}={}){
    api.checkProject?.(data.doc);
    const {staged,layers}=await decodePackage(data);
    const snapshot={...data.doc,layers};
    // Decode and validate everything before replacing the active design.
    await api.restore(snapshot,data.model,{preserveEnvironment,mergePalettes:true});
    for(const [id,a] of staged)assets.set(id,a);api.presentationRestored?.();
    const incoming=(data.doc.shelf||Array.from(staged.keys())).filter(id=>staged.has(id));
    shelfIds=mergeLibrary?new Set([...shelfIds,...incoming]):new Set(incoming);
    $('designName').value=data.doc.name;automaticName=false;api.clearHistory();renderShelf();recoveryBlocked=false;
  }
  async function readArchive(file){
    if(file.size>350*1024*1024)throw new Error('This design file is too large to open (350 MB limit).');
    const zip=await window.JSZip.loadAsync(file),manifest=zip.file('design.json');
    if(!manifest||manifest._data.uncompressedSize>2*1024*1024)throw new Error('This ZIP does not contain a valid ORB design.');
    const doc=validateProject(JSON.parse(await manifest.async('string')),api.schema),records=[];
    api.checkProject?.(doc);
    let total=0;
    for(const a of doc.assets){const f=zip.file(a.path);if(!f)throw new Error('Missing artwork: '+a.name);total+=f._data.uncompressedSize;if(total>300*1024*1024)throw new Error('The artwork in this design is too large.');records.push({id:a.id,name:a.name,blob:new Blob([await f.async('uint8array')],{type:a.type})});}
    let model=null;if(doc.modelPath){const f=zip.file(doc.modelPath);if(!f||f._data.uncompressedSize>250*1024*1024)throw new Error('The custom garment is missing or too large.');model=new File([await f.async('uint8array')],'garment.glb',{type:'model/gltf-binary'});}
    return {doc,records,model};
  }
  async function openFile(file){
    if(busy||api.busy())return;busy=true;restoring=true;clearTimeout(saveTimer);api.lock(true,'Opening design…');status('Opening design…');let opened=false;
    try{const data=await readArchive(file);await applyPackage(data,{preserveEnvironment:true});opened=true;status('Design opened');}
    catch(e){status(e.message||'This design could not open.');}
    finally{restoring=false;busy=false;api.lock(false);if(opened)notify();}
  }
  function confirmAction(action){pendingOpen=action;$('confirmTitle').textContent=action.file?'Open another design?':'Start a new design?';$('confirmText').textContent=action.file?'Save your current design before opening another?':'Save your current design before starting over?';$('confirmContinue').textContent=action.file?'Open without saving':'Start without saving';$('confirmSave').textContent=action.file?'Save & open':'Save & start new';$('confirmDialog').showModal();}
  async function continueAction(){const action=pendingOpen;pendingOpen=null;$('confirmDialog').close();if(action?.file)await openFile(action.file);else{recoveryBlocked=false;api.newDesign();automaticName=true;$('designName').value=defaultName();notify();}}
  $('confirmContinue').onclick=continueAction;
  $('confirmSave').onclick=async()=>{if(busy)return;busy=true;const buttons=$('confirmDialog').querySelectorAll('button');buttons.forEach(b=>b.disabled=true);try{await saveDesign();busy=false;await continueAction();}catch(e){$('confirmText').textContent=e.message;}finally{busy=false;buttons.forEach(b=>b.disabled=false);}};
  $('designNew').onclick=()=>{if(!busy&&!api.busy())confirmAction({});};
  $('designOpen').onclick=()=>{if(!busy&&!api.busy()){$('projectFile').value='';$('projectFile').click();}};
  $('projectFile').onchange=()=>{if($('projectFile').files[0])confirmAction({file:$('projectFile').files[0]});};
  async function saveDesign(){const blob=await makeArchive($('saveIncludeLibrary').checked);downloadBlob(blob,cleanFilename($('designName').value)+'.orb');status('Design file downloaded');return blob;}
  $('designSave').onclick=()=>{if(!busy&&!api.busy()){$('saveStatus').textContent='';$('saveDialog').showModal();}};
  $('saveConfirm').onclick=async()=>{if(busy||api.busy())return;busy=true;$('saveConfirm').disabled=true;$('saveStatus').textContent='Packaging artwork…';try{await saveDesign();$('saveDialog').close();}catch(e){$('saveStatus').textContent=e.message;}finally{busy=false;$('saveConfirm').disabled=false;}};
  $('designName').addEventListener('input',()=>{automaticName=false;notify();});
  document.getElementById('gl').addEventListener('wheel',notify,{passive:true});
  for(const button of document.querySelectorAll('[data-close-dialog]'))button.onclick=()=>{if(!busy)button.closest('dialog').close();};
  for(const dialog of document.querySelectorAll('.workspace-dialog'))dialog.addEventListener('cancel',e=>{if(busy)e.preventDefault();});
  document.addEventListener('change',e=>{if(!e.target.closest('#snapshotsSection,#snapshotReview')&&e.target.closest('#panel,header,#colorPopover'))notify();});
  document.addEventListener('click',e=>{if(e.target.closest('#snapshotsSection,#snapshotReview'))return;if(e.target.closest('summary,#btnPresent,#presentSettingsButton,.toolbarMenuToggle,#btnHelp,#btnArtist,#presentChooseGraphic,#btnSave,#btnExportAll,#designSave,#designOpen'))return;if(e.target.closest('#panel,header,#colorPopover'))queueMicrotask(notify);});
  window.addEventListener('beforeunload',e=>{if(ready&&revision!==savedRevision){e.preventDefault();e.returnValue='';}});
  document.addEventListener('visibilitychange',()=>{if(document.hidden)autosave();});
  async function captureSnapshot(previews){
    if(!ready||busy||restoring||api.busy())throw new Error('Wait for the current operation to finish.');
    busy=true;clearTimeout(saveTimer);api.lock(true,'Capturing snapshot…');
    try{const data=await packageData(false);data.doc=structuredClone(data.doc);return {data,previews:await previews()};}
    finally{busy=false;api.lock(false);if(revision!==savedRevision)saveTimer=setTimeout(autosave,900);}
  }
  async function restoreSavedSnapshot(data){
    if(!ready||busy||restoring||api.busy())throw new Error('Wait for the current operation to finish.');
    busy=true;restoring=true;clearTimeout(saveTimer);api.lock(true,'Opening snapshot…');
    let opened=false;
    try{await applyPackage(data);opened=true;}
    finally{restoring=false;busy=false;api.lock(false);if(opened)notify();}
  }
  async function beginExportSession(){
    if(busy||restoring)throw new Error('Wait for the current operation to finish.');
    const saved=api.snapshot(),model=api.modelFile(),savedAssets=new Map(assets),savedShelf=new Set(shelfIds),savedName=$('designName').value,savedAutomatic=automaticName;
    busy=true;restoring=true;clearTimeout(saveTimer);
    return {async load(data){api.checkProject?.(data.doc);const {staged,layers}=await decodePackage(data);for(const [id,a] of staged)assets.set(id,a);await api.restore({...data.doc,layers},data.model);},async restore(){try{await api.restore(saved,model);}finally{assets.clear();for(const [id,a] of savedAssets)assets.set(id,a);shelfIds=savedShelf;$('designName').value=savedName;automaticName=savedAutomatic;restoring=false;busy=false;renderShelf();if(revision!==savedRevision)saveTimer=setTimeout(autosave,900);}}};
  }
  return {beginExportSession,captureSnapshot,restoreSavedSnapshot,archiveData,checkSnapshot:data=>{validateProject(data.doc,api.schema);api.checkProject?.(data.doc);},getAsset:async id=>{const a=assets.get(id);if(!a)throw new Error('Background artwork is missing.');if(!a.entry.source)a.entry={...await api.decode(new File([a.blob],a.name,{type:a.blob.type})),assetId:id};return a.entry;},register,openAssets,notify,loadLibrary,makeArchive,dropFolder,artworkData:()=>packageData(false),dropProject:file=>confirmAction({file}),get busy(){return busy;},
    async ready(){
      restoring=true;
      let data=null,restored=false,sampleLoaded=false,failure=null;
      try{
        try{data=await dbGet();}
        catch(error){storageAvailable=false;preserveRecovery=true;failure=['Temporary session; use Save to download your design',error];}
        if(data!=null){
          try{await applyPackage(data,{mergeLibrary:false});restored=true;}
          catch(error){preserveRecovery=true;recoveryBlocked=error.code==='DESKTOP_GARMENT';failure=['Previous design preserved',error];}
        }
        // Only an absent saved project is a first visit. Never substitute the
        // sample for an empty design, unreadable recovery, or unavailable storage.
        if(storageAvailable&&data==null){
          const controller=new AbortController(),timeout=setTimeout(()=>controller.abort(),8000);
          try{
            const response=await fetch(new URL('../samples/ORB-Mockup-01.orb',import.meta.url),{signal:controller.signal});
            if(!response.ok)throw new Error('Sample download failed ('+response.status+')');
            const sample=await readArchive(await response.blob());
            sample.doc.name=defaultName();await applyPackage(sample,{mergeLibrary:false,preserveEnvironment:true});automaticName=true;restored=true;sampleLoaded=true;
          }catch(error){failure=['Sample unavailable',error];}
          finally{clearTimeout(timeout);}
        }
        if(!restored){
          for(const entry of api.snapshot().layers){
            try{await register(entry);}
            catch(error){failure=failure||['Artwork setup failed',error];console.warn('[ORB] Artwork setup failed',error);}
          }
        }
        if(failure)report(...failure);
        else status(restored&&!sampleLoaded?'Restored your last design':'Your work stays on this device.');
      }finally{restoring=false;ready=true;revision=0;savedRevision=0;renderShelf();}
    }
  };
}
