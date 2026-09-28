import {defaultPresentation,PRESENT_LIGHTS,PRESENT_NAMES,presentationPhase} from './present-options.js?v=91-present23';
export function installPresentation(api){
 const $=id=>document.getElementById(id),section=$('presentationSettings');
 let saved=null,elapsed=0,source=null,tinted=null,loadToken=0,phase=null;
 const background=document.createElement('canvas'),blend=document.createElement('canvas'),frame=document.createElement('canvas');
 background.id='presentationBackground';blend.id='presentationBlend';background.hidden=blend.hidden=true;
 document.body.append(background,blend);
 const settings=()=>api.state.presentation;
 function paintGraphic(){
  tinted=null;if(!source)return;
  const c=document.createElement('canvas'),scale=Math.min(1,2048/Math.max(source.width,source.height));
  c.width=Math.max(1,Math.round(source.width*scale));c.height=Math.max(1,Math.round(source.height*scale));
  const ctx=c.getContext('2d');ctx.drawImage(source,0,0,c.width,c.height);
  if(settings().graphicMode==='solid'){ctx.globalCompositeOperation='source-in';ctx.fillStyle=settings().graphicColor;ctx.fillRect(0,0,c.width,c.height);}
  tinted=c;
 }
 async function loadGraphic(){
  const token=++loadToken;source=null;tinted=null;
  if(!settings().graphic)return;
  try{const entry=await api.getGraphic(settings().graphic);if(token!==loadToken)return;source=entry?.source||null;paintGraphic();}
  catch(error){if(token===loadToken)$('presentGraphicName').textContent='Graphic unavailable. Choose it again from the library.';}
 }
 function sync(){
  api.state.presentation={...defaultPresentation(),...api.state.presentation};
  for(const input of section.querySelectorAll('[data-present-field]')){
   const v=settings()[input.dataset.presentField];if(input.type==='checkbox')input.checked=v;else input.value=v;
  }
  $('presentGraphicName').textContent=settings().graphicName||'No background graphic';
  const list=$('presentLightOrder');list.replaceChildren();
  settings().order.forEach((id,index)=>{
   const row=document.createElement('div');row.className='present-light-row';
   const label=document.createElement('label'),check=document.createElement('input');check.type='checkbox';check.checked=settings().selected.includes(id);
   check.addEventListener('change',()=>{api.beforeChange();settings().selected=settings().order.filter(v=>v===id?check.checked:settings().selected.includes(v));api.changed();});
   label.append(check,document.createTextNode(PRESENT_NAMES[PRESENT_LIGHTS.indexOf(id)]));row.append(label);
   for(const [text,delta] of [['↑',-1],['↓',1]]){
    const b=document.createElement('button');b.type='button';b.textContent=text;b.disabled=index+delta<0||index+delta>=8;b.setAttribute('aria-label',`Move ${PRESENT_NAMES[PRESENT_LIGHTS.indexOf(id)]} ${delta<0?'up':'down'}`);
    b.addEventListener('click',()=>{api.beforeChange();const a=settings().order;[a[index],a[index+delta]]=[a[index+delta],a[index]];api.changed();sync();list.children[index+delta].querySelectorAll('button')[delta<0?0:1].focus();});row.append(b);
   }list.append(row);
  });
  paintGraphic();
 }
 for(const input of section.querySelectorAll('[data-present-field]'))input.addEventListener('change',()=>{
  const key=input.dataset.presentField;let value=input.type==='checkbox'?input.checked:input.type==='number'||input.type==='range'?Number(input.value):input.value;
  if(typeof value==='number'){if(!Number.isFinite(value)){sync();return;}value=Math.max(Number(input.min),Math.min(Number(input.max),value));input.value=value;}
  api.beforeChange();settings()[key]=value;paintGraphic();api.changed();
 });
 $('presentChooseGraphic').onclick=()=>api.chooseGraphic();
 $('presentRemoveGraphic').onclick=()=>{api.beforeChange();settings().graphic=null;settings().graphicName='';++loadToken;source=tinted=null;sync();api.changed();};
 $('presentSettingsButton').onclick=()=>{
  for(const detail of document.querySelectorAll('#panel details'))detail.open=detail===section;
  section.open=true;const p=$('panel');p.scrollTop=0;
  section.scrollIntoView({block:'start',behavior:'auto'});section.querySelector('summary').focus({preventScroll:true});
 };
 function resize(c){const scale=Math.min(devicePixelRatio||1,1.5),w=Math.round(innerWidth*scale),h=Math.round(innerHeight*scale);if(c.width!==w||c.height!==h){c.width=w;c.height=h;}return c.getContext('2d');}
 function drawBackground(){
  const p=settings(),ctx=resize(background),w=background.width,h=background.height;
  ctx.clearRect(0,0,w,h);
  if(p.background){ctx.fillStyle=p.bg;ctx.fillRect(0,0,w,h);}else ctx.drawImage($('bgPattern'),0,0,w,h);
  if(tinted){const width=w*p.size/100,height=width*tinted.height/tinted.width;ctx.globalAlpha=p.opacity/100;ctx.drawImage(tinted,w*p.x/100-width/2,h*p.y/100-height/2,width,height);ctx.globalAlpha=1;}
 }
 sync();
 return {
  sync(){sync();loadGraphic();},
  setGraphic(entry){api.beforeChange();settings().graphic=entry.assetId;settings().graphicName=entry.name||entry.sourceName;source=entry.source;++loadToken;sync();api.changed();},
  get saved(){return saved;},
  begin(){saved=api.capture();elapsed=0;phase=presentationPhase(settings(),0,saved.settings.light);background.hidden=false;loadGraphic();if(settings().camera!=='current')api.setView(settings().camera);},
  end(){const prior=saved;saved=null;phase=null;background.hidden=blend.hidden=true;blend.width=frame.width=1;if(prior)api.restore(prior);},
  advance(dt){if(!saved)return;elapsed+=dt;phase=presentationPhase(settings(),elapsed,saved.settings.light);api.advanceLight(phase.from,dt);if(phase.mix>0)api.advanceLight(phase.to,dt);},
  render(renderScene){
   if(!saved){renderScene();return;}
   drawBackground();
   if(!phase||phase.mix===0||phase.from===phase.to){blend.hidden=true;api.light(phase?.from||saved.settings.light);renderScene();return;}
   // Both views use this frame's geometry/camera. Fade complete rendered colors,
   // including UV fabric and emission, rather than editing the glow shader.
   const ctx=resize(blend),other=resize(frame),w=blend.width,h=blend.height;
   api.light(phase.from);renderScene();ctx.globalAlpha=1;ctx.drawImage(background,0,0,w,h);ctx.drawImage(api.canvas,0,0,w,h);
   api.light(phase.to);renderScene();other.globalAlpha=1;other.drawImage(background,0,0,w,h);other.drawImage(api.canvas,0,0,w,h);
   ctx.globalAlpha=phase.mix;ctx.drawImage(frame,0,0,w,h);ctx.globalAlpha=1;blend.hidden=false;
  }
 };
}
