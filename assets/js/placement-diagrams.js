const teeOutline='M107 49 Q150 77 193 49 L223 62 L286 102 L260 153 L216 132 L216 294 Q150 306 84 294 L84 132 L40 153 L14 102 L77 62 Z';
const hoodieOutline='M108 78 Q99 37 124 16 Q150 0 176 16 Q201 37 192 78 L220 87 Q237 127 247 175 L274 277 L235 289 L205 195 L211 298 Q150 309 89 298 L95 195 L65 289 L26 277 L53 175 Q63 127 80 87 Z';
function figure(kind,view,inside){
  if(kind==='hat'){
    const isInside=view==='Inside'||inside;
    return `<svg viewBox="0 0 300 320" aria-hidden="true"><path class="garment-outline" d="${isInside?'M55 105 Q150 25 245 105 L245 224 Q150 290 55 224 Z M85 220 Q150 255 215 220 L226 117 Q150 60 74 117 Z':view==='Back'?'M50 238 Q41 68 150 42 Q259 68 250 238 Q206 254 182 237 L179 211 Q150 176 121 211 L118 237 Q92 254 50 238 Z':'M53 187 Q39 76 150 46 Q261 76 247 187 Q274 234 238 273 Q150 305 62 273 Q26 234 53 187 Z'}"/><g class="garment-seams"><path d="${isInside?'M76 112 Q150 77 224 112 M62 113 L75 221 M238 113 L225 221':view==='Back'?'M150 46 L150 191 M118 237 L182 237':'M53 187 Q150 153 247 187 M86 171 L101 66 M214 171 L199 66 M67 245 Q150 277 233 245'}"/></g></svg>`;
  }
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
  if(kind==='hat')return side==='inside'?[['hatunderbill',150,74],['hatinside',150,148],['hatband',150,231]]:side==='back'?[['hatcrown',150,97],['hatback',150,172]]:[['hatfront',150,137],['hatright',69,179],['hatleft',231,179],['hatbill',150,253]];
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
  container.innerHTML=`<section class="placement-diagram"><h3>${title}</h3><div class="garment-drawing">${figure(kind,kind==='hat'&&inside?'Inside':title,inside)}${items.map(({slot,x,y,code,label})=>`<div class="placement-pin" style="left:${x/3}%;top:${y/3.2}%"><button type="button" data-place="${slot}" title="${label}" class="pin-button${slot===suggested?' suggested':''}" aria-label="${label}${counts[slot]?', add another graphic':''}">${code}</button></div>`).join('')}</div></section><div class="placement-choice-list" aria-label="${title} placements">${items.map(({slot,code,label})=>`<button type="button" data-place="${slot}" class="placement-choice${slot===suggested?' suggested':''}"><span>${code}</span>${label}${counts[slot]?`<small>${counts[slot]}</small>`:''}</button>`).join('')}</div><p class="placement-caption" aria-live="polite" aria-atomic="true"></p>`;
  const caption=container.querySelector('.placement-caption');
  const describe=target=>{
    const slot=target?.closest?.('[data-place]')?.dataset.place;
    caption.textContent=descriptions.get(slot)||'Select a marker or placement name';
    container.querySelectorAll('[data-place]').forEach(b=>b.classList.toggle('placement-hover',!!slot&&b.dataset.place===slot));
  };
  container.onpointerover=event=>describe(event.target);container.onpointerleave=()=>describe(document.activeElement);
  container.onfocusin=event=>describe(event.target);container.onfocusout=event=>describe(event.relatedTarget);describe(null);
}
