// Preserve native form state/events while exposing short lists as consistent buttons.
export function installChoiceButtons(root){
 for(const select of root.querySelectorAll('select')){
  if(select.hasAttribute('data-native-select')||select.dataset.choiceButtons||select.options.length<2||select.options.length>6||select.multiple)continue;
  select.dataset.choiceButtons='true';select.hidden=true;
  const group=document.createElement('div');group.className='choice-buttons';group.setAttribute('role','group');group.setAttribute('aria-label',select.parentElement.firstChild?.textContent?.trim()||'Choose option');
  for(const option of select.options){const b=document.createElement('button');b.type='button';b.textContent=option.textContent;b.title=option.title;b.dataset.value=option.value;b.onclick=()=>{select.value=option.value;select.dispatchEvent(new Event('input',{bubbles:true}));select.dispatchEvent(new Event('change',{bubbles:true}));};group.append(b);}
  const sync=()=>{for(const b of group.children){b.setAttribute('aria-pressed',String(b.dataset.value===select.value));b.disabled=select.disabled||select.querySelector(`option[value="${b.dataset.value}"]`)?.disabled;}};
  select.after(group);select.addEventListener('change',sync);new MutationObserver(sync).observe(select,{attributes:true,attributeFilter:['disabled']});sync();
 }
 for(const input of root.querySelectorAll('[data-paint-select] input[type=checkbox]')){
  const label=input.closest('label');if(!label||label.classList.contains('choice-toggle'))continue;
  label.classList.add('choice-toggle');const span=document.createElement('span');for(const node of [...label.childNodes])if(node!==input)span.append(node);label.append(span);
 }
}
// Existing short-choice menus use the same presentation outside PDF as well.
function enhanceExisting(){for(const root of document.querySelectorAll('#exportDialog,#presentationSettings'))installChoiceButtons(root);}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',enhanceExisting);else enhanceExisting();
