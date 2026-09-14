export const RESET_ICON='<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4.5 8.5V4.5h4M5.2 7.1A8 8 0 1 1 4.4 14"/></svg>';
// Consistent range editing without changing the application's value handlers.
export function installSliderControls(defaultArtworkValue){
  const icon=RESET_ICON;
  const expandFor=(range,value)=>{
    if(range.dataset.expandRange!=='true'||!Number.isFinite(value)||value<=Number(range.max))return;
    range.max=String(Math.min(Number.MAX_VALUE,Math.max(200,Math.ceil(value/100)*100+100)));
  };
  const pairs=new Map();let wheelTimer;
  const unitLabels={artEmission:'Artwork glow intensity',lightPower:'Light intensity',artGlossiness:'Artwork glossiness',colorHue:'Hue'};
  for(const range of document.querySelectorAll('input[type="range"]')){
    let row=range.parentElement;
    if(range.id==='colorHue'){
      const wrap=document.createElement('div');wrap.className='hue-control slider-row';range.before(wrap);wrap.append(range);row=wrap;
    }
    row.classList.add('slider-row');
    let number=row.querySelector('input[type="number"]'),output=row.querySelector('output');
    if(!number){
      number=document.createElement('input');number.type='number';number.className='num';number.id=output?.id||(range.id+'Value');
      if(output)output.replaceWith(number);else range.after(number);
      number.addEventListener('blur',()=>number.value=range.value);
    }
    if(!number.hasAttribute('data-art-num')&&!number.id.match(/^(inertia|grid)/)){
      number.addEventListener('input',()=>{if(number.value===''||!Number.isFinite(number.valueAsNumber))return;expandFor(range,number.valueAsNumber);range.value=number.value;range.dispatchEvent(new Event('input',{bubbles:true}));number.value=range.value;});
      number.addEventListener('change',()=>{number.value=range.value;range.dispatchEvent(new Event('change',{bubbles:true}));});
    }
    number.addEventListener('blur',()=>number.value=range.value);
    number.min=range.min;number.max=range.max;number.step=range.step||'1';number.value=range.value;
    number.inputMode=Number(number.step)<1?'decimal':'numeric';
    const label=unitLabels[range.id]||row.querySelector('label')?.childNodes[0]?.textContent?.trim()||range.getAttribute('aria-label')||range.id;
    number.setAttribute('aria-label',label+' value');range.setAttribute('aria-label',label);
    let reset=row.querySelector('[data-reset-art-one],[data-reset-motion],.motionResetOne,[data-slider-reset]');
    const defaultValue=range.getAttribute('value')??range.value;
    const getDefault=()=>range.dataset.artRange!==undefined?defaultArtworkValue(range.dataset.prop):defaultValue;
    if(!reset){
      reset=document.createElement('button');reset.type='button';row.append(reset);
      reset.addEventListener('click',()=>{if(range.dataset.expandRange==='true')range.max=range.dataset.baseMax||'200';range.value=reset.dataset.defaultOverride??getDefault();range.dispatchEvent(new Event('input',{bubbles:true}));range.dispatchEvent(new Event('change',{bubbles:true}));});
    }
    reset.classList.add('slider-reset');reset.dataset.sliderReset=range.id;reset.innerHTML=icon;
    reset.removeAttribute('data-tip');reset.title='Reset '+label.toLowerCase();reset.setAttribute('aria-label',reset.title);
    const sync=()=>number.value=range.value;
    range.addEventListener('input',sync);range.addEventListener('change',sync);reset.addEventListener('click',sync);
    range.addEventListener('change',()=>{if(range.dataset.expandRange==='true'&&Number(range.value)>=Number(range.max))expandFor(range,Number(range.value)+(Number(range.step)||1));});
    pairs.set(range,{range,number,reset});pairs.set(number,{range,number,reset});
  }
  // Capture prevents old per-field wheel handlers from applying a second step.
  document.addEventListener('wheel',event=>{
    const pair=pairs.get(event.target);if(!pair||pair.range.disabled||pair.number.disabled||event.ctrlKey||!(event.deltaY||event.deltaX))return;
    event.preventDefault();event.stopImmediatePropagation();
    const {range,number}=pair,step=Number(range.step)||1,direction=(event.deltaY||event.deltaX)<0?1:-1;
    const next=Number((Number(range.value)+direction*step*(event.shiftKey?10:1)).toFixed(6));expandFor(range,next);range.value=String(next);
    range.dispatchEvent(new Event('input',{bubbles:true}));number.value=range.value;
    clearTimeout(wheelTimer);wheelTimer=setTimeout(()=>range.dispatchEvent(new Event('change',{bubbles:true})),180);
  },{capture:true,passive:false});
  const hue=document.getElementById('colorHue'),popover=document.getElementById('colorPopover');
  new MutationObserver(()=>{
    if(!popover.hidden){const p=pairs.get(hue);p.reset.dataset.defaultOverride=hue.value;p.number.value=hue.value;}
  }).observe(popover,{attributes:true,attributeFilter:['hidden']});
}
