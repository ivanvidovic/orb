// Independent of WebGL: the original vector mark is visible during module loading.
(()=>{
  const overlay=document.getElementById('startup'),ring=overlay.querySelector('.startup-progress');
  const meter=document.getElementById('startupProgress'),status=document.getElementById('startupStatus'),retry=document.getElementById('startupRetry');
  let active=true,finished=false,value=0,displayed=0,progressToken=0,radius=0,revealToken=0;
  const track=overlay.querySelector('.startup-track'),aperture=overlay.querySelector('#startupReveal circle');
  function setRadius(value){radius=value;for(const circle of [track,ring,aperture])circle.setAttribute('r',String(value));}
  function revealTo(target,duration,exiting=false){
    const token=++revealToken,from=radius,start=performance.now();
    if(matchMedia('(prefers-reduced-motion: reduce)').matches){setRadius(target);return Promise.resolve();}
    return new Promise(resolve=>{
      function frame(now){
        if(token!==revealToken){resolve();return;}
        const t=Math.max(0,Math.min(1,(now-start)/duration)),ease=exiting?t*t*t:1-Math.pow(1-t,3);
        setRadius(from+(target-from)*ease);
        if(t<1)requestAnimationFrame(frame);else resolve();
      }
      requestAnimationFrame(frame);
    });
  }
  revealTo(460,560);
  const locked=new Set();
  function lock(){
    if(!active)return;
    for(const node of document.body.children){
      if(node===overlay||['SCRIPT','STYLE','NOSCRIPT'].includes(node.tagName)||node.inert)continue;
      node.inert=true;locked.add(node);
    }
  }
  document.addEventListener('DOMContentLoaded',lock,{once:true});
  retry.onclick=()=>location.reload();
  // A slow connection stays recoverable, without pretending it failed.
  const slow=setTimeout(()=>{if(active&&!finished)retry.hidden=false;},30000);
  const phase=text=>{if(status.textContent!==text)status.textContent=text;};
  function progress(next,text){
    if(!active||finished||!Number.isFinite(next))return Promise.resolve();
    const target=Math.max(value,Math.min(1,next));
    if(text)phase(text);
    if(target===value)return Promise.resolve();
    value=target;
    const token=++progressToken,from=displayed,start=performance.now();
    const paint=amount=>{displayed=amount;ring.style.strokeDashoffset=String(100-amount*100);meter.setAttribute('aria-valuenow',String(Math.round(amount*100)));};
    if(matchMedia('(prefers-reduced-motion: reduce)').matches){paint(target);return Promise.resolve();}
    return new Promise(resolve=>{
      function frame(now){
        if(token!==progressToken){resolve();return;}
        const t=Math.max(0,Math.min(1,(now-start)/500));
        paint(from+(target-from)*(1-Math.pow(1-t,3)));
        if(t<1)requestAnimationFrame(frame);else resolve();
      }
      requestAnimationFrame(frame);
    });
  }
  function fail(text){
    if(!active||finished)return;
    progressToken++;overlay.classList.add('is-error');
    phase(text);meter.removeAttribute('aria-valuenow');retry.hidden=false;clearTimeout(slow);lock();
  }
  window.ORBStartup={get active(){return active&&!finished;},progress,
    preparing(){if(!active||finished)return;progress(.84,'Preparing preview');},
    async complete(){
      if(!active||finished)return;
      const fill=progress(1,'Ready');finished=true;clearTimeout(slow);retry.hidden=true;
      await fill;
      await new Promise(resolve=>requestAnimationFrame(resolve));
      overlay.classList.add('is-leaving');
      await Promise.all([revealTo(0,360,true),new Promise(resolve=>{if(matchMedia('(prefers-reduced-motion: reduce)').matches)resolve();else setTimeout(resolve,390);})]);
      active=false;overlay.hidden=true;document.body.classList.remove('startup-lock');
      for(const node of locked)node.inert=false;locked.clear();
    },fail};
  // Small opening fill, then hold until measured loading advances.
  progress(.06,'Preparing studio');
  window.addEventListener('error',event=>{
    if(active&&!finished&&(event.message||event.target?.tagName==='SCRIPT'))fail('The studio could not load. Check your connection and try again.');
  },true);
  window.addEventListener('unhandledrejection',()=>{if(active&&!finished)fail('The preview could not load. Check your connection and try again.');});
})();
