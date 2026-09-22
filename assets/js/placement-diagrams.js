const teeOutline='M107 49 Q150 77 193 49 L223 62 L286 102 L260 153 L216 132 L216 294 Q150 306 84 294 L84 132 L40 153 L14 102 L77 62 Z';
const hoodieOutline='M108 78 Q99 37 124 16 Q150 0 176 16 Q201 37 192 78 L220 87 Q237 127 247 175 L274 277 L235 289 L205 195 L211 298 Q150 309 89 298 L95 195 L65 289 L26 277 L53 175 Q63 127 80 87 Z';
function figure(kind,view,inside){
  const hoodie=kind==='hoodie';
  const cuffs='M89 285 Q150 296 211 285 M29 264 L69 277 M231 277 L270 264';
  // The rear hood shows its center seam, never the face opening or front folds.
  const detail=hoodie?(view==='Back'?`<path d="M150 10 Q146 44 150 83 ${cuffs}"/>`:`<path d="M108 78 Q150 114 192 78 M124 16 Q102 48 143 89 M176 16 Q198 48 157 89 ${cuffs}"/>`)
    :view==='Front'?'<path d="M107 49 Q150 112 193 49 M107 57 Q150 119 193 57 M84 280 Q150 292 216 280 M20 112 L45 143 M255 143 L280 112"/>'
    :'<path d="M107 49 Q150 80 193 49 M84 280 Q150 292 216 280 M20 112 L45 143 M255 143 L280 112"/>';
  const pocket=hoodie&&view==='Front'&&!inside?'<path d="M114 216 L103 234 L104 266 Q150 274 196 266 L197 234 L186 216 Z M114 216 L119 238 M186 216 L181 238"/>':'';
  const tag=inside?`<rect x="137" y="${hoodie?100:75}" width="26" height="29" rx="2" class="tag-outline"/>`:'';
  return `<svg viewBox="0 0 300 320" aria-hidden="true"><path class="garment-outline" d="${hoodie?hoodieOutline:teeOutline}"/><g class="garment-seams">${detail}${pocket}${tag}</g></svg>`;
}
export function placementPins(kind,side){
  const hoodie=kind==='hoodie';
  if(side==='inside')return [['necktag',150,hoodie?116:90],...(hoodie?[['hoodrightinside',119,49],['hoodleftinside',181,49]]:[])];
  // Back-view left/right are mirrored relative to the front view (wearer's sides).
  if(side==='back')return [['backneck',150,hoodie?104:90],['leftblade',105,140],['rightblade',195,140],['back',150,196],['lowerback',150,266]];
  return [['centerchest',150,110],['rightchest',109,146],['chest',191,146],['front',150,188],['rightshoulder',hoodie?74:49,hoodie?156:126],['leftshoulder',hoodie?226:251,hoodie?156:126],['righthem',110,274],['lefthem',190,274],...(hoodie?[['pocket',150,239],['hoodright',119,49],['hoodleft',181,49],['rightwrist',55,247],['leftwrist',245,247]]:[])];
}
export function renderPlacementDiagram(container,{kind,side,available,meta,counts,suggested}){
  const inside=side==='inside',title=inside?'Inside':side==='back'?'Back':'Front';
  const pins=placementPins(kind,side).filter(([slot])=>available.includes(slot)).sort((a,b)=>Math.round(a[2]/24)-Math.round(b[2]/24)||a[1]-b[1]);
  container.classList.toggle('placement-inside',inside);
  const descriptions=new Map();
  const items=pins.map(([slot,x,y],index)=>{const code=String.fromCharCode(65+index),label=meta[slot].label;descriptions.set(slot,`${label}${counts[slot]?` · ${counts[slot]} added`:''}`);return {slot,x,y,code,label};});
  container.innerHTML=`<section class="placement-diagram"><h3>${title}</h3><div class="garment-drawing">${figure(kind,title,inside)}${items.map(({slot,x,y,code,label})=>`<div class="placement-pin" style="left:${x/3}%;top:${y/3.2}%"><button type="button" data-place="${slot}" title="${label}" class="pin-button${slot===suggested?' suggested':''}" aria-label="${label}${counts[slot]?', add another graphic':''}">${code}</button></div>`).join('')}</div></section><div class="placement-choice-list" aria-label="${title} placements">${items.map(({slot,code,label})=>`<button type="button" data-place="${slot}" class="placement-choice${slot===suggested?' suggested':''}"><span>${code}</span>${label}${counts[slot]?`<small>${counts[slot]}</small>`:''}</button>`).join('')}</div><p class="placement-caption" aria-live="polite" aria-atomic="true"></p>`;
  const caption=container.querySelector('.placement-caption');
  const describe=target=>{
    const slot=target?.closest?.('[data-place]')?.dataset.place;
    caption.textContent=descriptions.get(slot)||'Select a marker or placement name';
    container.querySelectorAll('[data-place]').forEach(b=>b.classList.toggle('placement-hover',!!slot&&b.dataset.place===slot));
  };
  container.onpointerover=event=>describe(event.target);container.onpointerleave=()=>describe(document.activeElement);
  container.onfocusin=event=>describe(event.target);container.onfocusout=event=>describe(event.relatedTarget);describe(null);
}
