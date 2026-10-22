// Mouse/pen paint selection in independent checkbox groups. Touch keeps native scrolling.
let gesture=null,suppress=null;
const groups='.export-views,.export-file-options,#exportPrintLayouts,[data-paint-select],#presentLightOrder';
function hit(target){if(target.matches('.link-select')){const group=target.closest('#artLayers');return group&&!target.disabled?{group,input:target,label:target}:null;}const label=target.closest('label'),group=label?.closest(groups),input=label?.querySelector('input[type="checkbox"]');return group&&input&&!input.disabled?{group,label,input}:null;}
function paint(item){if(!item||item.group!==gesture.group||gesture.seen.has(item.input))return;gesture.seen.add(item.input);item.input.checked=gesture.value;item.input.dispatchEvent(new Event('input',{bubbles:true}));item.input.dispatchEvent(new Event('change',{bubbles:true}));}
document.addEventListener('pointerdown',e=>{if(e.button!==0||e.pointerType==='touch')return;const item=hit(e.target);if(!item)return;e.preventDefault();gesture={group:item.group,value:!item.input.checked,seen:new Set(),id:e.pointerId};paint(item);item.input.focus({preventScroll:true});},true);
document.addEventListener('pointermove',e=>{if(!gesture||e.pointerId!==gesture.id)return;paint(hit(document.elementFromPoint(e.clientX,e.clientY)||e.target));},true);
document.addEventListener('pointerup',()=>{if(!gesture)return;suppress=gesture.group;gesture=null;setTimeout(()=>suppress=null,0);},true);
document.addEventListener('pointercancel',()=>{gesture=null;},true);
window.addEventListener('blur',()=>{gesture=null;});
document.addEventListener('click',e=>{if(suppress&&suppress.contains(e.target)&&e.detail){e.preventDefault();e.stopImmediatePropagation();}},true);
