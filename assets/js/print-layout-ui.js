import {defaultPrintSize,printPlan} from './print-layout.js?v=86';
import {psdSupported} from './print-package.js?v=91-flow';
export function installPrintLayoutUI({toggle,container,status}){
  const remembered=new Map();let surfaces=[],key='',ready=false,preference=true;
  toggle.addEventListener('change',()=>{preference=toggle.checked;});
  const el=(tag,cls,text)=>{const e=document.createElement(tag);if(cls)e.className=cls;if(text)e.textContent=text;return e;};
  function sync(){container.hidden=!toggle.checked;status.hidden=!toggle.checked&&!toggle.disabled;}
  toggle.addEventListener('change',sync);
  function set(next,garment){surfaces=next;key=garment;ready=true;container.replaceChildren();
    toggle.disabled=!psdSupported()||!surfaces.length;toggle.checked=preference;
    status.textContent=!psdSupported()?'Layered PSD export is unavailable in this browser.':!surfaces.length?'Add visible artwork to export a layered layout.':'300 PPI · Dimensions in inches. Set the print size for your garment.';
    if(toggle.disabled){toggle.checked=false;sync();return;}
    for(const surface of surfaces){
      const cacheKey=key+'/'+surface.id,size=remembered.get(cacheKey)||defaultPrintSize(surface);remembered.set(cacheKey,size);
      const details=el('section','print-layout'),summary=el('div','print-layout-heading'),title=el('span'),info=el('p','muted'),fields=el('div','print-dimensions'),canvasGroup=el('fieldset','print-size-group'),artGroup=el('fieldset','print-size-group'),canvasFields=el('div','print-size-fields'),artFields=el('div','print-size-fields'),artHeight=el('p','muted');
      summary.append(title);details.append(summary);const include=el('label','check-option'),checkbox=el('input');checkbox.type='checkbox';checkbox.checked=size.enabled;checkbox.addEventListener('change',()=>{size.enabled=checkbox.checked;update();});checkbox.setAttribute('aria-label','Include '+surface.name);include.append(checkbox,title);summary.append(include);
      canvasGroup.append(el('legend',null,'Canvas size (in)'),canvasFields);artGroup.append(el('legend',null,'Artwork size (in)'),artFields,artHeight);fields.append(canvasGroup,artGroup);
      const inputs={};for(const [prop,label] of [['width','Width'],['height','Height'],['artWidth','Width']]){
        const row=el('label',null,label),input=el('input');input.type='number';input.min='0.01';input.step='any';input.value=String(size[prop]);input.setAttribute('aria-label',surface.name+' '+(prop==='artWidth'?'Artwork ':'Canvas ')+label+' (in)');inputs[prop]=input;row.append(input);(prop==='artWidth'?artFields:canvasFields).append(row);input.addEventListener('input',()=>{size[prop]=Number(input.value);update();});
      }
      const fit=el('button',null,'Fit to canvas');fit.type='button';fit.addEventListener('click',()=>{const ratio=(surface.bounds[3]-surface.bounds[1])/(surface.bounds[2]-surface.bounds[0]);size.artWidth=Math.floor(Math.min(size.width,size.height/ratio)*1000)/1000;inputs.artWidth.value=String(size.artWidth);update();});
      function update(){details.dataset.invalid='false';artHeight.textContent=Number.isFinite(size.artWidth)?'Height '+(size.artWidth*(surface.bounds[3]-surface.bounds[1])/(surface.bounds[2]-surface.bounds[0])).toFixed(2)+' in · proportional':'';try{const plan=printPlan(surface,size);title.textContent=surface.name;info.textContent=`Art ${plan.inches.artWidth.toFixed(2)} × ${plan.inches.artHeight.toFixed(2)} in · Canvas ${plan.width} × ${plan.height} px`;info.removeAttribute('role');info.className='muted';}catch(e){title.textContent=surface.name+(size.enabled?'':' · off');info.textContent=e.message;info.className=size.enabled?'layout-warning':'muted';details.dataset.invalid=String(size.enabled);info.setAttribute('role','status');}container.dispatchEvent(new Event('printlayoutchange',{bubbles:true}));}
      artFields.append(fit);details.append(fields,info);container.append(details);update();
    }sync();
  }
  return {set,restoreAvailability(){toggle.disabled=!ready||!psdSupported()||!surfaces.length;},loading(){ready=false;container.replaceChildren();status.textContent='Preparing print surfaces…';},plans(){if(!toggle.checked)return [];if(!ready)throw new Error('Print surfaces are still preparing.');return surfaces.filter(s=>remembered.get(key+'/'+s.id)?.enabled).map(s=>printPlan(s,remembered.get(key+'/'+s.id)));}};
}
