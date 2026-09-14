import {RESET_ICON} from './controls.js?v=27';
const SAMPLE_ICON='<svg viewBox="0 0 24 24" aria-hidden="true"><path d="m15 3 6 6M13 5l6 6M16 2l6 6-3 3-6-6zM14 8 4 18v3h3L17 11"/></svg>';
export function installColorActions({picker,artworkTarget,resetColor,samplePreview}){
  let pending=null,controller=null,suppressClick=false;
  const hint=document.createElement('div');hint.id='screenSampler';hint.hidden=true;hint.setAttribute('role','status');
  hint.innerHTML='<span>Pick a swatch or a point in the preview</span><button type="button">Cancel</button>';document.body.append(hint);
  const resolve=id=>id==='artwork'?artworkTarget():document.getElementById(id);
  function cancel(){pending=null;controller?.abort();controller=null;hint.hidden=true;document.body.classList.remove('is-sampling');}
  function apply(input,color){
    if(!/^#[0-9a-f]{6}$/i.test(color)||!input?.isConnected||input.disabled)return;
    input.value=color;input.dispatchEvent(new Event('input',{bubbles:true}));input.dispatchEvent(new Event('change',{bubbles:true}));
  }
  for(const button of document.querySelectorAll('[data-sample-target]')){
    button.innerHTML=SAMPLE_ICON;
    button.addEventListener('click',async event=>{
      event.preventDefault();const input=resolve(button.dataset.sampleTarget);if(!input||input.disabled)return;
      cancel();picker.close();
      if('EyeDropper' in window){
        const current=new AbortController();controller=current;
        try{const result=await new EyeDropper().open({signal:current.signal});if(controller===current)apply(input,result.sRGBHex);}
        catch(error){if(error.name!=='AbortError'){pending=input;hint.hidden=false;document.body.classList.add('is-sampling');}}
        finally{if(controller===current)controller=null;}
      }else{pending=input;hint.hidden=false;document.body.classList.add('is-sampling');}
    });
  }
  for(const button of document.querySelectorAll('[data-reset-color]')){
    button.innerHTML=RESET_ICON;
    button.addEventListener('click',event=>{event.preventDefault();cancel();resetColor(button.dataset.resetColor);});
  }
  hint.querySelector('button').onclick=cancel;
  const colorHex=value=>{const m=value.match(/rgba?\(([^)]+)\)/);if(!m)return null;const v=m[1].split(/[,\s/]+/).map(Number);if(v.length>3&&v[3]===0)return null;return '#'+v.slice(0,3).map(n=>Math.round(n).toString(16).padStart(2,'0')).join('');};
  document.addEventListener('pointerdown',event=>{
    if(!pending||hint.contains(event.target))return;
    suppressClick=true;event.preventDefault();event.stopImmediatePropagation();
    const swatch=event.target.closest('[data-sample-color],.sw,input[type="color"]');let color=null;
    if(swatch){
      const input=swatch.matches('input[type="color"]')?swatch:swatch.querySelector('input[type="color"]');
      color=swatch.dataset.sampleColor||input?.value||colorHex(getComputedStyle(swatch.querySelector('i')||swatch).backgroundColor);
    }else if(event.target.id==='gl'||event.target.id==='bgPattern'||event.target.id==='stage')color=samplePreview(event.clientX,event.clientY);
    if(color){const input=pending;cancel();apply(input,color);}
  },true);
  // Prevent the sampled control's click from changing any unrelated setting.
  window.addEventListener('click',event=>{if(suppressClick){suppressClick=false;event.preventDefault();event.stopImmediatePropagation();}},true);
  document.addEventListener('keydown',event=>{if(event.key==='Escape'&&(pending||controller)){event.preventDefault();event.stopPropagation();cancel();}},true);
  return {cancel};
}
