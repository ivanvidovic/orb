import {reviewLayout,createCaptureDisclosure} from './snapshot-layout.js?v=91-gallery56';
import {createSnapshotStore} from './snapshot-store.js?v=91-gallery56';
import {downloadBlob,cleanFilename} from './design-format.js?v=91-present23';
const $=id=>document.getElementById(id);
const button=(text,action,label)=>{const el=document.createElement('button');el.type='button';el.textContent=text;if(label)el.setAttribute('aria-label',label);el.onclick=action;return el;};
export function installSnapshots(api){
  const store=createSnapshotStore(),section=$('snapshotsSection'),review=$('snapshotReview');
  let entries=[],selected=null,working=false,reviewing=false,returnFocus=null,galleryScale=null;
  const disclosure=createCaptureDisclosure();
  const sides=new Map(),urls=new Map(),mobile=matchMedia('(max-width:820px), (pointer:coarse)');
  const message=text=>{for(const id of ['snapshotStatus','snapshotReviewStatus']){$(id).textContent=text;$(id).hidden=!text;}};
  function url(entry,side,large=false){const key=entry.id+':'+(large?'gallery:':'thumb:')+side;if(!urls.has(key))urls.set(key,URL.createObjectURL(large?(entry.previews.gallery?.[side]||entry.previews[side]):entry.previews[side]));return urls.get(key);}
  function collectUrls(){const ids=new Set(entries.map(e=>e.id));for(const [key,value] of urls)if(!ids.has(key.split(':')[0])){URL.revokeObjectURL(value);urls.delete(key);}}
  function setExpanded(value){$('snapshotsBody').hidden=!value;$('snapshotsToggle').setAttribute('aria-expanded',String(value));$('snapshotsToggle').firstElementChild.textContent=value?'▾':'▸';}
  function lock(value){working=value;section.setAttribute('aria-busy',String(value));review.setAttribute('aria-busy',String(value));for(const el of document.querySelectorAll('#snapshotsSection button,#snapshotReview button,#snapshotReview input,#snapshotsSection input'))el.disabled=value;}
  async function run(action){if(working)return;lock(true);message('');try{await action();}catch(error){message(error.name==='QuotaExceededError'?'Snapshot storage is full. Download or delete older snapshots and try again.':error.message||'Snapshot operation failed.');}finally{lock(false);if(reviewing)mobileMode();}}
  async function refresh(){entries=await store.list();collectUrls();if(!entries.some(e=>e.id===selected))selected=entries[0]?.id||null;render();}
  async function capture({preserve=false}={}){
    const result=await api.workspace.captureSnapshot(api.previews,preserve?async data=>{
      entries=await store.list();const key=await store.fingerprintData(data);
      return entries.find(entry=>store.fingerprint(entry.doc,entry.modelKey||null)===key);
    }:null);
    if(result.existing)return result.existing;
    const entry=await store.save(result.data,result.previews);
    selected=entry.id;await refresh();return entry;
  }
  async function open(entry){
    const data=await store.load(entry.id);api.workspace.checkSnapshot(data);
    // Commit the current design before replacing it. A storage failure aborts opening.
    await capture({preserve:true});
    await api.workspace.restoreSavedSnapshot(data);closeReview();
    selected=entry.id;render();message('Snapshot opened. Your previous design is in the collection.');
  }
  async function download(entry){const data=await store.load(entry.id);data.doc={...data.doc,name:entry.name};downloadBlob(await api.workspace.archiveData(data),cleanFilename(entry.name)+'.orb');}
  function actions(entry){
    const row=document.createElement('div');row.className='snapshot-actions';
    row.append(button('Open design',()=>run(()=>open(entry))),button('↓',()=>run(()=>download(entry)),'Download '+entry.name+' as .orb'),button('Rename',()=>rename(entry,row)),button('×',()=>remove(entry,row),'Delete '+entry.name));
    return row;
  }
  function rename(entry,row){
    if(working)return;row.replaceChildren();const input=document.createElement('input');input.type='text';input.maxLength=80;input.value=entry.name;input.setAttribute('aria-label','Snapshot name');
    const save=()=>run(async()=>{const name=input.value.trim();if(!name){input.focus();return;}await store.rename(entry.id,name);await refresh();});
    input.onkeydown=e=>{if(e.key==='Enter'){e.preventDefault();save();}if(e.key==='Escape'){e.stopPropagation();render();}};
    row.append(input,button('Save',save),button('Cancel',render));input.focus();input.select();
  }
  function remove(entry,row){
    if(working)return;row.replaceChildren();const label=document.createElement('span');label.textContent='Delete snapshot?';row.append(label,button('Delete',()=>run(async()=>{await store.remove(entry.id);sides.delete(entry.id);await refresh();})),button('Cancel',render));
  }
  function syncSides(){const all=entries.map(e=>sides.get(e.id)||'front');for(const el of review.querySelectorAll('[data-snapshot-side]'))el.setAttribute('aria-pressed',String(all.length>0&&all.every(side=>side===el.dataset.snapshotSide)));}
  function flip(entry){
    const next=(sides.get(entry.id)||'front')==='front'?'back':'front';sides.set(entry.id,next);
    for(const card of document.querySelectorAll('[data-snapshot-id]'))if(card.dataset.snapshotId===entry.id){card.dataset.side=next;const el=card.querySelector('.snapshot-flip');el.setAttribute('aria-label',entry.name+', '+next+'. Click to show '+(next==='front'?'back':'front'));card.querySelector('.snapshot-side-label').textContent=next==='front'?'Front':'Back';}
    syncSides();
  }
  function card(entry,large){
    const card=document.createElement('article');card.className='snapshot-card';card.dataset.snapshotId=entry.id;card.dataset.side=sides.get(entry.id)||'front';
    const flipButton=button('',()=>{selected=entry.id;if(large)flip(entry);renderSidebar();if(reviewing)renderReviewActions(); },entry.name+', '+card.dataset.side+(large?'. Click to flip':'. Select snapshot'));flipButton.className='snapshot-flip';
    const faces=document.createElement('span');faces.className='snapshot-faces';
    for(const side of ['front','back']){const image=new Image();image.src=url(entry,side,large);image.alt='';image.loading='lazy';image.decoding='async';image.className='snapshot-face snapshot-'+side;faces.append(image);}
    const sideLabel=document.createElement('span');sideLabel.className='snapshot-side-label';sideLabel.textContent=card.dataset.side==='front'?'Front':'Back';flipButton.append(faces,sideLabel);
    const title=document.createElement('span');title.className='snapshot-name';title.textContent=entry.name;title.title=entry.name;card.append(flipButton,title);
    if(!large)flipButton.setAttribute('aria-pressed',String(selected===entry.id));card.classList.toggle('selected',selected===entry.id);
    return card;
  }
  function empty(grid){const text=document.createElement('p');text.className='snapshot-note';text.textContent='Capture a design with + to start your collection.';grid.append(text);}
  function renderSidebar(){
    const grid=$('snapshotGrid');grid.replaceChildren(...entries.map(entry=>card(entry,false)));if(!entries.length)empty(grid);
    const area=$('snapshotActions'),entry=entries.find(e=>e.id===selected);area.replaceChildren();area.hidden=!entry;if(entry)area.append(actions(entry));
  }
  function renderReviewActions(){const area=$('snapshotReviewActions'),entry=entries.find(e=>e.id===selected);area.replaceChildren();area.hidden=!entry;if(entry){const name=document.createElement('span');name.className='snapshot-name';name.textContent=entry.name;area.append(name,actions(entry));}for(const card of review.querySelectorAll('[data-snapshot-id]'))card.classList.toggle('selected',card.dataset.snapshotId===selected);}
  function renderReview(){const grid=$('snapshotReviewGrid');grid.replaceChildren(...entries.map(entry=>card(entry,true)));if(!entries.length)empty(grid);syncSides();renderReviewActions();layoutReview();}
  function render(){ $('snapshotCount').textContent=$('snapshotReviewCount').textContent=String(entries.length);renderSidebar();if(reviewing)renderReview();if(working)lock(true); }
  function layoutReview(){
    if(!reviewing)return;
    const grid=$('snapshotReviewGrid'),style=getComputedStyle(grid),gap=parseFloat(style.columnGap)||12;
    const layout=reviewLayout(entries.length,grid.clientWidth-4,grid.clientHeight-4,mobile.matches,gap,galleryScale);
    grid.style.setProperty('--snapshot-card-width',layout.width+'px');
    grid.style.gridTemplateColumns=`repeat(${layout.columns}, minmax(0, ${layout.width}px))`;
    grid.style.alignContent='start';
    const remainder=entries.length%layout.columns;
    Array.from(grid.children).forEach((card,i)=>{
      const last=remainder&&i>=entries.length-remainder;
      card.style.transform=last?`translateX(${(layout.columns-remainder)*(layout.width+gap)/2}px)`:'';
    });
    if(galleryScale===null){$('snapshotSize').value=String(layout.percent);$('snapshotSizeValue').value=String(layout.percent);}
    $('snapshotSizeReset').setAttribute('aria-label','Reset thumbnail size to auto fit');
  }
  function setGalleryScale(value){galleryScale=Math.max(1,Math.min(100,Number(value)||1));$('snapshotSize').value=$('snapshotSizeValue').value=String(galleryScale);layoutReview();}
  $('snapshotSizeReset').innerHTML=api.resetIcon;
  $('snapshotSize').oninput=event=>setGalleryScale(event.target.value);
  $('snapshotSizeValue').onchange=event=>setGalleryScale(event.target.value);
  $('snapshotSizeReset').onclick=()=>{galleryScale=null;layoutReview();};
  const reviewObserver=new ResizeObserver(layoutReview);reviewObserver.observe($('snapshotReviewGrid'));
  function mobileMode(){const modal=reviewing&&mobile.matches;review.setAttribute('role',modal?'dialog':'region');if(modal)review.setAttribute('aria-modal','true');else review.removeAttribute('aria-modal');for(const el of [document.querySelector('header'),$('panel')])el.inert=modal;}
  function openReview(){
    if(working||!api.canReview())return;returnFocus=document.activeElement;reviewing=true;review.hidden=false;document.body.classList.add('snapshot-reviewing');api.reviewing(true);renderReview();mobileMode();$('snapshotReviewClose').focus();
  }
  function closeReview(){
    if(!reviewing)return;reviewing=false;review.hidden=true;$('snapshotReviewGrid').replaceChildren();for(const [key,value] of urls)if(key.includes(':gallery:')){URL.revokeObjectURL(value);urls.delete(key);}document.body.classList.remove('snapshot-reviewing');mobileMode();api.reviewing(false);returnFocus?.focus({preventScroll:true});
  }
  $('snapshotCapture').onclick=()=>run(async()=>{message('Capturing front and back…');await capture();if(disclosure.captured())setExpanded(true);message('Snapshot saved.');});
  $('snapshotsToggle').onclick=()=>{const open=$('snapshotsBody').hidden;disclosure.toggled(open);setExpanded(open);};
  setExpanded(false);
  $('snapshotReviewOpen').onclick=openReview;$('snapshotReviewClose').onclick=()=>{if(!working)closeReview();};
  for(const el of review.querySelectorAll('[data-snapshot-side]'))el.onclick=()=>{for(const entry of entries)sides.set(entry.id,el.dataset.snapshotSide);renderReview();};
  // Editing a desktop control returns to the live garment before handling the input.
  document.addEventListener('pointerdown',event=>{if(reviewing&&!working&&!event.target.closest('#snapshotReview,#snapshotsSection')&&event.target.closest('#panel,header'))closeReview();},true);
  document.addEventListener('focusin',event=>{if(reviewing&&!working&&!mobile.matches&&!event.target.closest('#snapshotReview,#snapshotsSection')&&event.target.closest('#panel,header'))closeReview();},true);
  document.addEventListener('keydown',event=>{
    if(!reviewing)return;
    if(event.key==='Escape'&&!event.target.matches('input')){event.preventDefault();event.stopImmediatePropagation();if(!working)closeReview();return;}
    if(event.key==='Tab'&&mobile.matches){const items=Array.from(review.querySelectorAll('button:not(:disabled),input:not(:disabled)'));const first=items[0],last=items.at(-1);if(event.shiftKey&&document.activeElement===first){event.preventDefault();last?.focus();}else if(!event.shiftKey&&document.activeElement===last){event.preventDefault();first?.focus();}}
    if(!event.target.matches('input')&&event.key!=='Tab'&&event.key!=='Enter'&&event.key!==' ')event.stopImmediatePropagation();
  },true);
  mobile.addEventListener('change',()=>{if(reviewing){mobileMode();layoutReview();}});
  window.addEventListener('pagehide',()=>{for(const value of urls.values())URL.revokeObjectURL(value);urls.clear();});
  window.addEventListener('pageshow',event=>{if(event.persisted)render();});
  run(refresh);
}
