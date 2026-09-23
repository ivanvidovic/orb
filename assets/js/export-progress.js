// Counts completed export work, not elapsed time. Long jobs keep their last
// completed position while a subtle glint indicates that processing continues.
export function createExportProgress(element){
  let total=1,done=0;
  function show(value){const percent=Math.max(0,Math.min(100,value));element.firstElementChild.style.width=percent+'%';element.setAttribute('aria-valuenow',String(Math.round(percent)));}
  return {
    start(units){total=Math.max(1,units);done=0;element.hidden=false;element.classList.add('is-working');element.setAttribute('aria-busy','true');show(0);},
    advance(units=1){done=Math.min(total,done+units);show(done/total*100);},
    packaging(fraction){show((done+Math.max(0,Math.min(1,fraction))*2)/total*100);},
    finish(success=false){if(success)show(100);element.classList.remove('is-working');element.setAttribute('aria-busy','false');},
    reset(){element.hidden=true;this.finish();show(0);}
  };
}
