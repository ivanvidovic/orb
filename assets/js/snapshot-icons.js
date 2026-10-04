const svg=path=>`<svg viewBox="0 0 24 24" aria-hidden="true">${path}</svg>`;
export const snapshotIcons={
 capture:svg('<path d="M12 5v14M5 12h14"/>'),
 review:svg('<rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/>'),
 mosaic:svg('<rect x="3" y="3" width="10" height="18"/><rect x="17" y="3" width="4" height="7"/><rect x="17" y="14" width="4" height="7"/>'),
 open:svg('<path d="M14 3h7v7M21 3 10 14M10 5H4v15h15v-6"/>'),
 rename:svg('<path d="m15 5 4 4M4 20l4-1L20 7a2.8 2.8 0 0 0-4-4L4 15z"/>'),
 download:svg('<path d="M12 3v12m-5-5 5 5 5-5M4 16v5h16v-5"/>'),
 remove:svg('<path d="M3 6h18M9 6V3h6v3M5 6l1 15h12l1-15M10 10v7M14 10v7"/>'),
 close:svg('<path d="m6 6 12 12M18 6 6 18"/>'),
 confirm:svg('<path d="m5 12 4 4L19 6"/>'),
 more:svg('<circle cx="5" cy="12" r="1"/><circle cx="12" cy="12" r="1"/><circle cx="19" cy="12" r="1"/>')
};
export function snapshotTip(el,label,detail=label){el.setAttribute('aria-label',label);el.dataset.tip=detail;el.setAttribute('aria-describedby','uiTooltip');el.removeAttribute('title');return el;}
export function snapshotIconButton(icon,label,detail,action){const el=document.createElement('button');el.type='button';el.className='snapshot-icon';el.innerHTML=snapshotIcons[icon];snapshotTip(el,label,detail);el.onclick=action;return el;}
