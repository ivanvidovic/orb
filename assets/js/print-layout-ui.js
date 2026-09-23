import {defaultPrintSize,printPlan} from './print-layout.js?v=86';
import {psdSupported} from './print-package.js?v=87';
export function installPrintLayoutUI({toggle,container,status}){
  const remembered=new Map();let surfaces=[],key='',ready=false,preference=true;
  toggle.addEventListener('change',()=>{preference=toggle.checked;});
  const el=(tag,cls,text)=>{const e=document.createElement(tag);if(cls)e.className=cls;if(text)e.textContent=text;return e;};
  function sync(){container.hidden=!toggle.checked;}
  toggle.addEventListener('change',sync);
  function set(next,garment){surfaces=next;key=garment;ready=true;container.replaceChildren();
    toggle.disabled=!psdSupported()||!surfaces.length;toggle.checked=preference;
    status.textContent=!psdSupported()?'Layered PSD export is unavailable in this browser.':!surfaces.length?'Add visible artwork to export a layered layout.':'300 PPI · inches. One PSD per surface, with treated layers and a hidden untreated backup.';
    if(toggle.disabled){toggle.checked=false;sync();return;}
    for(const surface of surfaces){
      const cacheKey=key+'/'+surface.id,size=remembered.get(cacheKey)||defaultPrintSize(surface);remembered.set(cacheKey,size);
      const details=el('section','print-layout'),summary=el('div','print-layout-heading'),title=el('span'),info=el('p','muted'),fields=el('div','export-options');
      summary.append(title);details.append(summary);const include=el('label','check-option'),checkbox=el('input');checkbox.type='checkbox';checkbox.checked=size.enabled;checkbox.addEventListener('change',()=>{size.enabled=checkbox.checked;update();});checkbox.setAttribute('aria-label','Include '+surface.name);include.append(checkbox,title);summary.append(include);
      const inputs={};for(const [prop,label] of [['width','Canvas width (in)'],['height','Canvas height (in)'],['artWidth','Artwork width (in)']]){
        const row=el('label',null,label),input=el('input');input.type='number';input.min='0.01';input.step='any';input.value=String(size[prop]);input.setAttribute('aria-label',surface.name+' '+label);inputs[prop]=input;row.append(input);fields.append(row);input.addEventListener('input',()=>{size[prop]=Number(input.value);update();});
      }
      const fit=el('button',null,'Fit to canvas');fit.type='button';fit.addEventListener('click',()=>{const ratio=(surface.bounds[3]-surface.bounds[1])/(surface.bounds[2]-surface.bounds[0]);size.artWidth=Math.floor(Math.min(size.width,size.height/ratio)*1000)/1000;inputs.artWidth.value=String(size.artWidth);update();});
      function update(){try{const plan=printPlan(surface,size);title.textContent=surface.name;info.textContent=`Art ${plan.inches.artWidth.toFixed(2)} × ${plan.inches.artHeight.toFixed(2)} in · Canvas ${plan.width} × ${plan.height} px`;info.removeAttribute('role');}catch(e){title.textContent=surface.name+(size.enabled?'':' · off');info.textContent=e.message;info.setAttribute('role','status');}}
      summary.append(fit);details.append(fields,info);container.append(details);update();
    }sync();
  }
  return {set,restoreAvailability(){toggle.disabled=!ready||!psdSupported()||!surfaces.length;},loading(){ready=false;container.replaceChildren();status.textContent='Preparing print surfaces…';},plans(){if(!toggle.checked)return [];if(!ready)throw new Error('Print surfaces are still preparing.');return surfaces.filter(s=>remembered.get(key+'/'+s.id)?.enabled).map(s=>printPlan(s,remembered.get(key+'/'+s.id)));}};
}
