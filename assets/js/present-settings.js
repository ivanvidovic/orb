import {viewportSize} from './mobile-viewport.js?v=91-opt43';
import {RESET_ICON} from './controls.js?v=91-history13';
import {createPresentCompositor} from './present-compositor.js?v=91-opt43';
import {defaultPresentation,resetPresentationSection,PRESENT_LIGHTS,PRESENT_NAMES,presentationPhase} from './present-options.js?v=0.9.65';
export function installPresentation(api){
 const $=id=>document.getElementById(id),section=$('presentationSettings');
 let saved=null,elapsed=0,source=null,tinted=null,loadToken=0,phase=null,pendingDt=0,backgroundDirty=true,backgroundKey='',useGPU=false;
 const background=document.createElement('canvas');
 background.id='presentationBackground';background.hidden=true;document.body.append(background);
 const backdrops=[document.createElement('canvas'),document.createElement('canvas')];
 let backdropKey='';
 const compositor=createPresentCompositor(api.THREE,api.renderer);
 const settings=()=>api.state.presentation;
 function paintGraphic(){
  backgroundDirty=true;tinted=null;if(!source)return;
  const c=document.createElement('canvas'),scale=Math.min(1,2048/Math.max(source.width,source.height));
  c.width=Math.max(1,Math.round(source.width*scale));c.height=Math.max(1,Math.round(source.height*scale));
  const ctx=c.getContext('2d');ctx.drawImage(source,0,0,c.width,c.height);
  if(settings().graphicMode==='solid'){ctx.globalCompositeOperation='source-in';ctx.fillStyle=settings().graphicColor;ctx.fillRect(0,0,c.width,c.height);}
  tinted=c;
 }
 async function loadGraphic(){
  const token=++loadToken;source=null;tinted=null;backgroundDirty=true;
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
 for(const button of section.querySelectorAll('[data-present-reset]')){
  button.innerHTML=RESET_ICON;
  button.onclick=()=>{
   api.beforeChange();const group=button.dataset.presentReset;
   api.state.presentation=resetPresentationSection(settings(),group);
   if(group==='background'){++loadToken;source=tinted=null;}
   if(group==='lighting')$('presentPerformanceNote').hidden=true;
   sync();api.changed();
  };
 }
 $('presentChooseGraphic').onclick=()=>api.chooseGraphic();
 $('presentRemoveGraphic').onclick=()=>{api.beforeChange();settings().graphic=null;settings().graphicName='';++loadToken;source=tinted=null;sync();api.changed();};
 $('presentSettingsButton').onclick=()=>{
  for(const detail of document.querySelectorAll('#panel details'))detail.open=detail===section;
  section.open=true;const p=$('panel');p.scrollTop=0;
  section.scrollIntoView({block:'start',behavior:'auto'});section.querySelector('summary').focus({preventScroll:true});
 };
 function resize(c){const scale=Math.min(devicePixelRatio||1,1.5),w=Math.round(viewportSize().width*scale),h=Math.round(viewportSize().height*scale);if(c.width!==w||c.height!==h){c.width=w;c.height=h;}return c.getContext('2d');}
 function drawBackground(){
  const p=settings(),from=Number(api.isDarkLighting(phase.from)),to=Number(api.isDarkLighting(phase.to));
  const mix=useGPU?phase.mix:Number(phase.mix>=.5),dark=from+(to-from)*mix;
  const key=[viewportSize().width,viewportSize().height,devicePixelRatio,p.background,p.bg,p.opacity,p.size,p.x,p.y,p.background?'custom':dark].join('/');
  if(!backgroundDirty&&key===backgroundKey)return;
  backgroundKey=key;backgroundDirty=false;
  const ctx=resize(background),w=background.width,h=background.height;
  ctx.clearRect(0,0,w,h);
  if(p.background){ctx.fillStyle=p.bg;ctx.fillRect(0,0,w,h);}else {
   const sizeKey=[w,h].join('/');
   if(backdropKey!==sizeKey){for(const [i,c] of backdrops.entries()){c.width=w;c.height=h;api.drawBackdrop(c,!!i);}backdropKey=sizeKey;}
   ctx.drawImage(backdrops[0],0,0);if(dark>0){ctx.globalAlpha=dark;ctx.drawImage(backdrops[1],0,0);ctx.globalAlpha=1;}
  }
  if(tinted){const width=w*p.size/100,height=width*tinted.height/tinted.width;ctx.globalAlpha=p.opacity/100;ctx.drawImage(tinted,w*p.x/100-width/2,h*p.y/100-height/2,width,height);ctx.globalAlpha=1;}
 }
 sync();
 return {
  sync(){sync();loadGraphic();},
  setGraphic(entry){api.beforeChange();settings().graphic=entry.assetId;settings().graphicName=entry.name||entry.sourceName;source=entry.source;++loadToken;sync();api.changed();},
  get saved(){return saved;},
  begin(){backdropKey='';saved=api.capture();elapsed=0;phase=presentationPhase(settings(),0,saved.settings.light);background.hidden=false;backgroundDirty=true;loadGraphic();useGPU=settings().cycle&&settings().fade>0&&settings().selected.length>1?compositor.begin():false;
    $('presentPerformanceNote').hidden=useGPU||!settings().cycle||settings().fade===0||settings().selected.length<2;if(settings().camera!=='current')api.setView(settings().camera);},
  end(){const prior=saved;saved=null;phase=null;background.hidden=true;compositor.dispose();useGPU=false;pendingDt=0;if(prior)api.restore(prior);},
  advance(dt){if(!saved)return;elapsed+=dt;phase=presentationPhase(settings(),elapsed,saved.settings.light);pendingDt=dt;},
  render(renderScene,rect){
   if(!saved){renderScene();return;}
   drawBackground();
   const dt=pendingDt;pendingDt=0;
   if(useGPU){compositor.render(phase,id=>api.light(id,dt),renderScene,rect);return;}
   api.light(phase.mix>=.5?phase.to:phase.from,dt);renderScene();
  }
 };
}
