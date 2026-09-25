// Native range thumbs with logarithmic travel; application values stay in original units.
export function toTrack(value,min,max,zero=false){return zero?Math.log1p(value)/Math.log1p(max):Math.log(value/min)/Math.log(max/min);}
export function fromTrack(t,min,max,zero=false){return zero?Math.expm1(t*Math.log1p(max)):min*Math.pow(max/min,t);}
export function installMappedRanges(){
 const native=Object.getOwnPropertyDescriptor(HTMLInputElement.prototype,'value');
 for(const el of document.querySelectorAll('input[data-log-range]')){
  const min=Number(el.min),max=Number(el.max),initial=Number(el.value),zero=min===0;
  el.dataset.valueMin=min;el.dataset.valueMax=max;el.min='0';el.max='1';el.step='0.00001';
  let lastTrack=null,lastValue=initial;
  Object.defineProperty(el,'value',{configurable:true,get(){const track=native.get.call(this);if(track!==lastTrack){lastTrack=track;lastValue=Number(fromTrack(Number(track),min,max,zero).toPrecision(6));}return String(lastValue);},set(value){const n=Number(value);if(Number.isFinite(n)){lastValue=Math.max(min,Math.min(max,n));native.set.call(this,toTrack(lastValue,min,max,zero));lastTrack=native.get.call(this);this.setAttribute('aria-valuetext',String(Number((Number(this.value)*Number(this.dataset.displayFactor||1)).toPrecision(9))));}}});
  Object.defineProperty(el,'valueAsNumber',{configurable:true,get(){return Number(this.value);},set(value){this.value=value;}});
  el.value=initial;el.addEventListener('input',()=>el.setAttribute('aria-valuetext',String(Number((Number(el.value)*Number(el.dataset.displayFactor||1)).toPrecision(9)))));
 }
}
