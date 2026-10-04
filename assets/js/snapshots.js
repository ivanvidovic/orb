import {reviewLayout,fitReviewLayout,createCaptureDisclosure} from './snapshot-layout.js?v=91-labels68';
import {snapshotIcons,snapshotTip as tip,snapshotIconButton as iconButton} from './snapshot-icons.js?v=91-layout58';
import {createSnapshotStore} from './snapshot-store.js?v=91-gallery56';
import {downloadBlob,cleanFilename} from './design-format.js?v=91-present23';
const $=id=>document.getElementById(id);
export function installSnapshots(api){
  const store=createSnapshotStore(),section=$('snapshotsSection'),review=$('snapshotReview');
  let entries=[],selected=null,working=false,reviewing=false,returnFocus=null,galleryScale=35,fitAll=false,manualSide=false,statusTimer,revealGeneration=0;
  const trimCache=new Map();
  const disclosure=createCaptureDisclosure(),sides=new Map(),urls=new Map();
  const mobile=matchMedia('(max-width:820px), (pointer:coarse)');
  const message=(text,temporary=false)=>{clearTimeout(statusTimer);for(const id of ['snapshotStatus','snapshotReviewStatus']){$(id).textContent=text;$(id).hidden=!text;}if(temporary)statusTimer=setTimeout(()=>message(''),2500);};
  function url(entry,side,large=false){const key=entry.id+':'+(large?'gallery:':'thumb:')+side;if(!urls.has(key))urls.set(key,URL.createObjectURL(large?(entry.previews.gallery?.[side]||entry.previews[side]):entry.previews[side]));return urls.get(key);}
  function collectUrls(){const ids=new Set(entries.map(e=>e.id));for(const [key,value] of urls)if(!ids.has(key.split(':')[0])){URL.revokeObjectURL(value);urls.delete(key);}}
  function setExpanded(value){$('snapshotsBody').hidden=!value;$('snapshotsToggle').setAttribute('aria-expanded',String(value));$('snapshotsToggle').firstElementChild.textContent=value?'▾':'▸';}
  function lock(value){working=value;section.setAttribute('aria-busy',String(value));review.setAttribute('aria-busy',String(value));for(const el of document.querySelectorAll('#snapshotsSection button,#snapshotReview button,#snapshotReview input'))el.disabled=value;}
  async function run(action){if(working)return;lock(true);message('');try{await action();}catch(error){message(error.name==='QuotaExceededError'?'Snapshot storage is full. Download or delete older snapshots and try again.':error.message||'Snapshot operation failed.');}finally{lock(false);if(reviewing)mobileMode();}}
  async function refresh(){entries=await store.list();collectUrls();if(selected!==null&&!entries.some(e=>e.id===selected))selected=null;render();}
  async function capture({preserve=false}={}){
    const result=await api.workspace.captureSnapshot(api.previews,preserve?async data=>{entries=await store.list();const key=await store.fingerprintData(data);return entries.find(entry=>store.fingerprint(entry.doc,entry.modelKey||null)===key);}:null);
    if(result.existing)return result.existing;
    const entry=await store.save(result.data,result.previews);selected=entry.id;await refresh();return entry;
  }
  async function open(entry){const data=await store.load(entry.id);api.workspace.checkSnapshot(data);await capture({preserve:true});await api.workspace.restoreSavedSnapshot(data);closeReview();selected=entry.id;render();message('Snapshot opened. Your previous design is in the collection.',true);}
  async function download(entry){const data=await store.load(entry.id);data.doc={...data.doc,name:entry.name};downloadBlob(await api.workspace.archiveData(data),cleanFilename(entry.name)+'.orb');}
  function allCards(){return document.querySelectorAll('#snapshotGrid .snapshot-card,#snapshotReviewGrid .snapshot-card');}
  function syncSelected(){
    const entry=entries.find(e=>e.id===selected),name=$('snapshotSelectedName');name.textContent=entry?.name||'';tip(name,entry?'Selected design: '+entry.name:'No snapshot selected');
    for(const card of allCards()){const chosen=card.dataset.snapshotId===selected;card.classList.toggle('selected',chosen);card.querySelector('.snapshot-flip').setAttribute('aria-pressed',String(chosen));}
  }
  function select(entry){selected=entry.id;syncSelected();}
  function closeActions(except=null){for(const card of allCards())if(card!==except){card.classList.remove('actions-open');card.querySelector('.snapshot-more').setAttribute('aria-expanded','false');}}
  function syncSides(){const all=entries.map(e=>sides.get(e.id)||'front');for(const el of review.querySelectorAll('[data-snapshot-side]'))el.setAttribute('aria-pressed',String(!manualSide&&all.length>0&&all.every(side=>side===el.dataset.snapshotSide)));}
  function flipTip(card,entry){const side=card.dataset.side,large=card.dataset.large==='true';tip(card.querySelector('.snapshot-flip'),entry.name+', '+side,large?entry.name+' · '+side+'. Click or tap to flip; use the action icons to open or manage this design.':entry.name+' · Select this snapshot. Use its action icons to open, rename, download or delete.');}
  function flip(entry){manualSide=true;const next=(sides.get(entry.id)||'front')==='front'?'back':'front';sides.set(entry.id,next);for(const card of allCards())if(card.dataset.snapshotId===entry.id){card.dataset.side=next;card.querySelector('.snapshot-side-label').textContent=next==='front'?'Front':'Back';flipTip(card,entry);}syncSides();if(reviewing)layoutReview();}
  function restoreActionFocus(id,large){const grid=large?$('snapshotReviewGrid'):$('snapshotGrid');const card=Array.from(grid.children).find(c=>c.dataset.snapshotId===id);card?.querySelector('.snapshot-flip').focus({preventScroll:true});}
  // Shared editor keeps tiny thumbnails free of cramped text fields and confirmations.
  const dialog=document.createElement('dialog');dialog.className='workspace-dialog snapshot-edit-dialog';dialog.setAttribute('aria-labelledby','snapshotEditTitle');
  const heading=document.createElement('div');heading.className='snapshot-edit-heading';const title=document.createElement('span');title.id='snapshotEditTitle';title.className='lbl';heading.append(title);
  const cancel=document.createElement('button');cancel.type='button';cancel.textContent='Cancel';cancel.onclick=()=>dialog.close();
  const detail=document.createElement('p');detail.className='snapshot-note';
  const field=document.createElement('input');field.type='text';field.maxLength=80;field.setAttribute('aria-label','Snapshot name');
  const confirm=document.createElement('button');confirm.type='button';confirm.textContent='Save';const row=document.createElement('div');row.className='snapshot-edit-row';row.append(cancel,confirm);dialog.append(heading,detail,field,row);document.body.append(dialog);dialog.setAttribute('aria-describedby','snapshotEditDetail');detail.id='snapshotEditDetail';
  let editReturn=null,editTask=null;
  function edit(entry,kind,large){
    if(working)return;select(entry);closeActions();editReturn={id:entry.id,large};
    const rename=kind==='rename';title.textContent=rename?'Rename snapshot':'Delete snapshot?';detail.textContent=rename?'':'Delete '+entry.name+' from snapshots?';detail.hidden=rename;field.hidden=!rename;field.value=entry.name;
    confirm.textContent=rename?'Save':'Delete';confirm.setAttribute('aria-label',rename?'Save snapshot name':'Delete snapshot');
    editTask=async()=>{if(rename){const name=field.value.trim();if(!name){field.focus();return false;}await store.rename(entry.id,name);}else{await store.remove(entry.id);sides.delete(entry.id);}await refresh();restoreActionFocus(selected,large);return true;};
    dialog.showModal();dialog.append($('uiTooltip'));(rename?field:cancel).focus();if(rename)field.select();
  }
  confirm.onclick=()=>{if(working)return;const task=editTask;if(!field.hidden&&!field.value.trim()){field.focus();return;}dialog.close();run(task);};
  let backdropPress=false;
  const outsideDialog=event=>{const r=dialog.getBoundingClientRect();return event.target===dialog&&(event.clientX<r.left||event.clientX>r.right||event.clientY<r.top||event.clientY>r.bottom);};
  dialog.addEventListener('pointerdown',event=>{backdropPress=outsideDialog(event);});
  dialog.addEventListener('click',event=>{if(backdropPress&&outsideDialog(event))dialog.close();backdropPress=false;});
  field.onkeydown=event=>{if(event.key==='Enter'){event.preventDefault();confirm.click();}};
  dialog.addEventListener('close',()=>{const tooltip=$('uiTooltip');tooltip.classList.remove('show');tooltip.setAttribute('aria-hidden','true');document.body.append(tooltip);const prior=editReturn;if(prior)restoreActionFocus(prior.id,prior.large);});
  function card(entry,large){
    const card=document.createElement('article');card.className='snapshot-card';card.dataset.snapshotId=entry.id;card.dataset.side=sides.get(entry.id)||'front';card.dataset.large=String(large);
    const flipButton=document.createElement('button');flipButton.type='button';flipButton.className='snapshot-flip';
    const faces=document.createElement('span');faces.className='snapshot-faces';
    for(const side of ['front','back']){const image=new Image();image.src=url(entry,side,large);image.alt='';image.loading='lazy';image.decoding='async';image.className='snapshot-face snapshot-'+side;faces.append(image);}
    flipButton.append(faces);card.append(flipButton);
    const caption=document.createElement('div');caption.className='snapshot-caption';const name=document.createElement('span');name.className='snapshot-name';name.textContent=entry.name;tip(name,entry.name);name.onclick=()=>flipButton.click();const sideLabel=document.createElement('span');sideLabel.className='snapshot-side-label';sideLabel.textContent=card.dataset.side==='front'?'Front':'Back';caption.append(name,sideLabel);card.append(caption);
    const more=iconButton('more','Snapshot actions for '+entry.name,'Open, rename, download or delete this snapshot.',()=>{const expanded=!card.classList.contains('actions-open');select(entry);closeActions(card);card.classList.toggle('actions-open',expanded);more.setAttribute('aria-expanded',String(expanded));});more.classList.add('snapshot-more');more.setAttribute('aria-expanded','false');card.append(more);
    const actions=document.createElement('div');actions.className='snapshot-card-actions';actions.setAttribute('role','group');actions.setAttribute('aria-label','Actions for '+entry.name);
    actions.append(iconButton('open','Open '+entry.name,'Open this editable design. Altered work is backed up first.',()=>{select(entry);run(()=>open(entry));}),iconButton('rename','Rename '+entry.name,'Rename this snapshot and its download filename.',()=>edit(entry,'rename',large)),iconButton('download','Download '+entry.name,'Download this design as an editable .orb file.',()=>{select(entry);run(()=>download(entry));}),iconButton('remove','Delete '+entry.name,'Delete this snapshot. You will be asked to confirm.',()=>edit(entry,'remove',large)));card.append(actions);
    flipButton.onclick=()=>{const wasOpen=card.classList.contains('actions-open');select(entry);closeActions();if(large&&!wasOpen)flip(entry);};flipTip(card,entry);return card;
  }
  function empty(grid){const text=document.createElement('p');text.className='snapshot-note';text.textContent='Capture a design with + to start your collection.';grid.append(text);}
  function renderSidebar(){const grid=$('snapshotGrid');grid.replaceChildren(...entries.map(entry=>card(entry,false)));if(!entries.length)empty(grid);}
  function measureBottom(image,key){
    if(trimCache.has(key))return trimCache.get(key);
    if(!image.naturalWidth||!image.naturalHeight)return 7/6;
    const canvas=document.createElement('canvas');canvas.width=image.naturalWidth;canvas.height=image.naturalHeight;
    try{const ctx=canvas.getContext('2d',{willReadFrequently:true});ctx.drawImage(image,0,0);const {data}=ctx.getImageData(0,0,canvas.width,canvas.height);
      let bottom=canvas.height;outer:for(let y=canvas.height-1;y>=0;y--)for(let x=0;x<canvas.width;x++)if(data[(y*canvas.width+x)*4+3]>0){bottom=y+1;break outer;}
      const ratio=bottom/canvas.width;trimCache.set(key,ratio);return ratio;
    }catch{return 7/6;}finally{canvas.width=canvas.height=1;}
  }
  function sizeCard(card,width){
    const ratio=trimCache.get(card.dataset.snapshotId+':'+card.dataset.side)||7/6;
    card.style.setProperty('--image-height',Math.ceil(width*ratio)+'px');
    card.style.setProperty('--source-height',(width*7/6)+'px');
    card.style.aspectRatio='auto';card.style.height=(Math.ceil(width*ratio)+26)+'px';
  }
  async function revealReview(cards,generation){
    for(const card of cards){
      if(generation!==revealGeneration||!reviewing)return;
      const images=Array.from(card.querySelectorAll('img'));
      let timer;
      await Promise.race([Promise.all(images.map(image=>{image.loading='eager';return image.decode().catch(()=>{});})),new Promise(resolve=>{timer=setTimeout(resolve,10000);})]);
      clearTimeout(timer);
      if(generation!==revealGeneration||!reviewing)return;
      images.forEach((image,i)=>measureBottom(image,card.dataset.snapshotId+':'+(i?'back':'front')));
      layoutReview();card.classList.remove('snapshot-pending');
    }
  }
  function renderReview(){const grid=$('snapshotReviewGrid'),cards=entries.map(entry=>card(entry,true)),generation=++revealGeneration;for(const card of cards)card.classList.add('snapshot-pending');grid.replaceChildren(...cards);if(!entries.length)empty(grid);syncSides();syncSelected();layoutReview();void revealReview(cards,generation);}

  function render(){ $('snapshotCount').textContent=$('snapshotReviewCount').textContent=String(entries.length);renderSidebar();if(reviewing)renderReview();syncSelected();if(working)lock(true); }
  const laidOutCards=new WeakSet();
  function fitReviewLabels(){
    for(const card of $('snapshotReviewGrid').children){
      const caption=card.querySelector('.snapshot-caption');if(!caption)continue;
      caption.classList.remove('name-hidden');
      const name=caption.querySelector('.snapshot-name'),side=caption.querySelector('.snapshot-side-label');
      caption.classList.toggle('name-hidden',Math.ceil(name.scrollWidth+side.scrollWidth+5)>Math.floor(caption.clientWidth));
    }
  }
  document.fonts?.ready.then(()=>{if(reviewing)layoutReview();});
  function layoutReview(spacing){
    const groups=Array.from(review.querySelector('.snapshot-review-head').children);
    groups.forEach((el,i)=>el.classList.toggle('group-divider',i>0&&el.offsetTop===groups[i-1].offsetTop));
    const grid=$('snapshotReviewGrid'),gap=typeof spacing==='number'?spacing:(parseFloat(getComputedStyle(grid).columnGap)||0);
    if(!reviewing){if(typeof spacing==='number')grid.style.gap=gap+'px';return;}
    if(!entries.length){grid.style.gap=gap+'px';grid.style.gridTemplateColumns='1fr';grid.style.gridAutoRows='auto';return;}
    const cards=Array.from(grid.children);
    const before=new Map(cards.map(card=>[card,laidOutCards.has(card)?card.getBoundingClientRect?.():null]));
    // Keep a visible design at the same viewport offset when rows reflow.
    const viewport=grid.getBoundingClientRect?.();
    const visible=viewport?cards.filter(card=>{const r=before.get(card);return r&&r.bottom>viewport.top&&r.top<viewport.bottom;}):[];
    const anchor=grid.scrollTop>0?(visible.find(card=>card.dataset.snapshotId===selected)||visible[0]):null;
    const anchorTop=anchor?before.get(anchor).top:null;
    for(const card of cards)laidOutCards.add(card);
    grid.style.gap=gap+'px';
    const ratio=Math.max(...entries.flatMap(entry=>['front','back'].map(side=>trimCache.get(entry.id+':'+side)||7/6)));
    const layout=fitAll&&!mobile.matches?fitReviewLayout(entries.length,grid.clientWidth-4,grid.clientHeight-4,gap,ratio):reviewLayout(entries.length,grid.clientWidth-4,grid.clientHeight-4,mobile.matches,gap,galleryScale,ratio);
    if(fitAll&&!mobile.matches){galleryScale=layout.percent;grid.style.gap=layout.gap+'px';$('snapshotSpacing').value=$('snapshotSpacingValue').value=String(layout.gap);}
    grid.style.gridTemplateColumns=`repeat(${layout.columns},minmax(0,${layout.width}px))`;grid.style.gridAutoRows='max-content';

    for(const card of cards){sizeCard(card,layout.width);card.classList.toggle('compact-actions',layout.width<152);}
    if(anchor){const next=anchor.getBoundingClientRect();grid.scrollTop+=next.top-anchorTop;}
    fitReviewLabels();
    $('snapshotSize').min=$('snapshotSizeValue').min=String(layout.minPercent||1);
    $('snapshotSize').value=$('snapshotSizeValue').value=String(layout.percent);
    // Keep the requested size across viewport changes and reopening review.
  }
  function setGalleryScale(value){fitAll=false;galleryScale=Math.max(Number($('snapshotSize').min)||1,Math.min(100,Number(value)||1));$('snapshotSize').value=$('snapshotSizeValue').value=String(galleryScale);layoutReview();}
  $('snapshotSize').oninput=event=>setGalleryScale(event.target.value);$('snapshotSizeValue').onchange=event=>setGalleryScale(event.target.value);
  tip($('snapshotSize'),'Thumbnail size','Resize gallery tiles. 100% is the largest size that fits the viewer.');tip($('snapshotSizeValue'),'Thumbnail size percent','Enter a gallery tile size up to 100 percent. The minimum keeps card actions usable.');
  function setSpacing(value){fitAll=false;const gap=Math.max(0,Math.min(320,Math.round(Number(value)||0)));$('snapshotSpacing').value=$('snapshotSpacingValue').value=String(gap);layoutReview(gap);}
  $('snapshotSpacing').oninput=event=>setSpacing(event.target.value);$('snapshotSpacingValue').onchange=event=>setSpacing(event.target.value);
  $('snapshotViewReset').innerHTML=api.resetIcon;$('snapshotViewReset').onclick=()=>{if(mobile.matches){galleryScale=35;setSpacing(80);}else{fitAll=true;layoutReview();$('snapshotReviewGrid').scrollTop=0;}};
  function resetTip(){tip($('snapshotViewReset'),mobile.matches?'Reset image size and spacing':'Fit all images',mobile.matches?'Restore 35% image size and 80 px spacing.':'Fit every design in the viewport, reducing spacing when needed.');}resetTip();
  tip($('snapshotSpacing'),'Image spacing','Adjust the horizontal and vertical gaps between snapshot tiles.');tip($('snapshotSpacingValue'),'Image spacing in pixels');
  const reviewObserver=new ResizeObserver(layoutReview);reviewObserver.observe($('snapshotReviewGrid'));
  function mobileMode(){const modal=reviewing&&mobile.matches;review.setAttribute('role',modal?'dialog':'region');if(modal)review.setAttribute('aria-modal','true');else review.removeAttribute('aria-modal');for(const el of [document.querySelector('header'),$('panel')])el.inert=modal;}
  function openReview(){if(working||!api.canReview())return;returnFocus=document.activeElement;reviewing=true;review.hidden=false;document.body.classList.add('snapshot-reviewing');api.reviewing(true);renderReview();mobileMode();$('snapshotReviewClose').focus();}
  function closeReview(){if(!reviewing)return;++revealGeneration;reviewing=false;review.hidden=true;$('snapshotReviewGrid').replaceChildren();for(const [key,value] of urls)if(key.includes(':gallery:')){URL.revokeObjectURL(value);urls.delete(key);}document.body.classList.remove('snapshot-reviewing');mobileMode();api.reviewing(false);returnFocus?.focus({preventScroll:true});}
  const configure=(id,icon,label,detail,action)=>{const el=$(id);el.innerHTML=snapshotIcons[icon];el.classList.add('snapshot-icon');tip(el,label,detail);el.onclick=action;};
  configure('snapshotCapture','capture','Capture snapshot','Save this design with front and back previews in this browser.',()=>run(async()=>{const button=$('snapshotCapture');button.classList.add('capturing');button.setAttribute('aria-busy','true');try{await capture();if(disclosure.captured())setExpanded(true);}finally{button.classList.remove('capturing');button.removeAttribute('aria-busy');}}));
  configure('snapshotReviewOpen','review','Review snapshots','Review the saved designs side by side; click a shirt to flip it.',openReview);
  configure('snapshotReviewClose','close','Close snapshot review','Return to the live garment editor. Escape also closes review.',()=>{if(!working)closeReview();});
  $('snapshotsToggle').onclick=()=>{const expanded=$('snapshotsBody').hidden;disclosure.toggled(expanded);setExpanded(expanded);};tip($('snapshotsToggle'),'Snapshots','Expand or collapse snapshots saved in this browser.');setExpanded(false);

  for(const el of review.querySelectorAll('[data-snapshot-side]')){const side=el.dataset.snapshotSide;tip(el,'Show all '+side+' views','Show the '+side+' of every design. Individual shirts can still be flipped.');el.onclick=()=>{for(const entry of entries)if((sides.get(entry.id)||'front')!==side)flip(entry);manualSide=false;syncSides();};}
  document.addEventListener('pointerdown',event=>{if(!event.target.closest('.snapshot-card')){closeActions();if(!working&&!event.target.closest('button,input,select,textarea,a,label,[role=button],dialog')){selected=null;syncSelected();}}},true);

  document.addEventListener('keydown',event=>{
    if(document.querySelector('dialog[open]'))return;
    if(event.key==='Escape'&&document.querySelector('.snapshot-card.actions-open')){event.preventDefault();event.stopImmediatePropagation();closeActions();return;}
    if(!reviewing)return;
    if(event.key==='Escape'&&!event.target.matches('input')){event.preventDefault();event.stopImmediatePropagation();if(!working)closeReview();return;}
    if(event.key==='Tab'&&mobile.matches){const items=Array.from(review.querySelectorAll('button:not(:disabled),input:not(:disabled)')).filter(el=>getComputedStyle(el).visibility!=='hidden');const first=items[0],last=items.at(-1);if(event.shiftKey&&document.activeElement===first){event.preventDefault();last?.focus();}else if(!event.shiftKey&&document.activeElement===last){event.preventDefault();first?.focus();}}
    if(event.target.closest('#snapshotReview')&&!event.target.matches('input')&&!['Tab','Enter',' '].includes(event.key))event.stopImmediatePropagation();
  },true);
  mobile.addEventListener('change',()=>{resetTip();if(reviewing){mobileMode();layoutReview();}});
  window.addEventListener('pagehide',()=>{for(const value of urls.values())URL.revokeObjectURL(value);urls.clear();});window.addEventListener('pageshow',event=>{if(event.persisted)render();});
  run(refresh);
}
