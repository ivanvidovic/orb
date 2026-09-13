const teeOutline='M107 49 Q150 77 193 49 L223 62 L286 102 L260 153 L216 132 L216 294 Q150 306 84 294 L84 132 L40 153 L14 102 L77 62 Z';
const hoodieOutline='M108 78 Q99 37 124 16 Q150 0 176 16 Q201 37 192 78 L220 87 Q237 127 247 175 L274 277 L235 289 L205 195 L211 298 Q150 309 89 298 L95 195 L65 289 L26 277 L53 175 Q63 127 80 87 Z';
const outsideFront=[['rightchest',119,117],['chest',181,117],['front',150,171],['rightshoulder',51,114],['leftshoulder',249,114]];
const outsideBack=[['back',150,160],['lowerback',150,247]];
function figure(kind,view,inside){
  const hoodie=kind==='hoodie';
  const detail=hoodie?'<path d="M108 78 Q150 114 192 78 M124 16 Q102 48 143 89 M176 16 Q198 48 157 89 M89 285 Q150 296 211 285 M29 264 L69 277 M231 277 L270 264"/>'
    :view==='Front'?'<path d="M107 49 Q150 112 193 49 M107 57 Q150 119 193 57 M84 280 Q150 292 216 280 M20 112 L45 143 M255 143 L280 112"/>'
    :'<path d="M107 49 Q150 80 193 49 M84 280 Q150 292 216 280 M20 112 L45 143 M255 143 L280 112"/>';
  const pocket=hoodie&&view==='Front'&&!inside?'<path d="M114 216 L103 234 L104 266 Q150 274 196 266 L197 234 L186 216 Z M114 216 L119 238 M186 216 L181 238"/>':'';
  const tag=inside?`<rect x="137" y="${hoodie?100:75}" width="26" height="29" rx="2" class="tag-outline"/>`:'';
  return `<svg viewBox="0 0 300 320" aria-hidden="true"><path class="garment-outline" d="${hoodie?hoodieOutline:teeOutline}"/><g class="garment-seams">${detail}${pocket}${tag}</g></svg>`;
}
export function renderPlacementDiagram(container,{kind,side,available,meta,counts,suggested}){
  const inside=side==='inside',hoodie=kind==='hoodie';
  const groups=inside?[{title:'Inside',view:'Front',pins:[['necktag',150,hoodie?116:90],...(hoodie?[['hoodrightinside',119,49],['hoodleftinside',181,49]]:[])]}]
    :[{title:'Front',view:'Front',pins:[...outsideFront.map(pin=>pin[0]==='leftshoulder'?['leftshoulder',hoodie?226:251,hoodie?154:126]:pin[0]==='rightshoulder'?['rightshoulder',hoodie?74:49,hoodie?154:126]:pin),...(hoodie?[['pocket',150,242],['hoodright',119,49],['hoodleft',181,49]]:[])]},{title:'Back',view:'Back',pins:outsideBack}];
  container.classList.toggle('placement-inside',inside);
  let index=0;
  const descriptions=new Map();
  container.innerHTML=groups.map(group=>{
    // Read each drawing top to bottom, left to right. Codes belong to this
    // visible diagram rather than exposing the internal placement-key order.
    const pins=group.pins.filter(([slot])=>available.includes(slot)).sort((a,b)=>Math.round(a[2]/24)-Math.round(b[2]/24)||a[1]-b[1]);
    return `<section class="placement-diagram"><h3>${group.title}</h3><div class="garment-drawing">${figure(kind,group.view,inside)}${pins.map(([slot,x,y])=>{
      const code=String.fromCharCode(65+index++),label=meta[slot].label;
      descriptions.set(slot,`${code} · ${label}${counts[slot]?` · ${counts[slot]} added`:''}`);
      return `<div class="placement-pin" style="left:${x/3}%;top:${y/3.2}%"><button type="button" data-place="${slot}" class="pin-button${slot===suggested?' suggested':''}" aria-label="${code}: ${label}${counts[slot]?', add another graphic':''}">${code}</button></div>`;
    }).join('')}</div></section>`;
  }).join('')+'<p class="placement-caption" aria-live="polite" aria-atomic="true"></p>';
  const caption=container.querySelector('.placement-caption');
  const describe=target=>{caption.textContent=descriptions.get(target?.closest?.('[data-place]')?.dataset.place)||'Select a marker to place artwork';};
  container.onpointerover=event=>describe(event.target);
  container.onpointerleave=()=>describe(document.activeElement);
  container.onfocusin=event=>describe(event.target);
  container.onfocusout=event=>describe(event.relatedTarget);
  describe(null);
}
