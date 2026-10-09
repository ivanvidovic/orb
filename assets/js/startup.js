// Independent of WebGL: the original vector mark is visible during module loading.
(()=>{
  const overlay=document.getElementById('startup'),ring=overlay.querySelector('.startup-progress');
  const meter=document.getElementById('startupProgress'),status=document.getElementById('startupPhase'),retry=document.getElementById('startupRetry');
  const version=document.querySelector('meta[name=orb-version]').content;
  const syncVersion=()=>document.querySelectorAll('[data-orb-version]').forEach(node=>node.textContent='v'+version);
  syncVersion();document.addEventListener('DOMContentLoaded',syncVersion,{once:true});
  const timings=[];let lastPhase='Preparing studio',phaseStart=performance.now();
  const ns='http://www.w3.org/2000/svg',svg=overlay.querySelector('svg');
  // Rotate an independent HTML layer so the browser can composite the arc.
  const spinner=document.createElement('div');spinner.className='startup-spinner';
  const spinnerSvg=document.createElementNS(ns,'svg');spinnerSvg.setAttribute('viewBox','0 0 1000 1000');
  spinnerSvg.setAttribute('aria-hidden','true');
  spinnerSvg.innerHTML=`<defs>
    <linearGradient id="prismWispColor" gradientUnits="userSpaceOnUse" x1="655" y1="68" x2="944" y2="578">
      <stop offset="0" stop-color="#7ba9ee" stop-opacity="0"/>
      <stop offset=".2" stop-color="#7ba9ee" stop-opacity=".8"/>
      <stop offset=".47" stop-color="#b89bdd"/>
      <stop offset=".7" stop-color="#e6b0c0"/>
      <stop offset=".87" stop-color="#efc49c" stop-opacity=".85"/>
      <stop offset="1" stop-color="#efc49c" stop-opacity="0"/>
    </linearGradient>
    <filter id="prismWispBlur" x="-100%" y="-50%" width="300%" height="200%" color-interpolation-filters="sRGB"><feGaussianBlur stdDeviation="9"/></filter>
  </defs>
  <g class="startup-wisp-shape" fill="none" stroke="url(#prismWispColor)" stroke-linecap="round">
    <path d="M 657.2 67.7 A 460 460 0 0 1 952.9 579.9" stroke-width="14" opacity=".48" filter="url(#prismWispBlur)"/>
    <path d="M 657.2 67.7 A 460 460 0 0 1 952.9 579.9" stroke-width="5" opacity=".95"/>
  </g>`;
  const wisp=spinnerSvg.querySelector('.startup-wisp-shape');
  ring.remove();spinner.append(spinnerSvg);svg.parentNode.append(spinner);
  let active=true,finished=false,failed=false,radius=0,revealToken=0;
  const track=overlay.querySelector('.startup-track'),aperture=overlay.querySelector('#startupReveal circle');
  function setRadius(value){
    radius=value;for(const circle of [track,aperture])circle.setAttribute('r',String(value));
    wisp.setAttribute('transform',`translate(499.8461609 500) scale(${value/460}) translate(-499.8461609 -500)`);
    // Start only when the actual reveal reaches 95%, about 1.3 seconds in.
    if(value>=437&&active&&!finished&&!failed)spinner.classList.add('is-running');
  }
  function revealTo(target,duration,exiting=false){
    const token=++revealToken,from=radius,start=performance.now();
    if(matchMedia('(prefers-reduced-motion: reduce)').matches){setRadius(target);return Promise.resolve();}
    return new Promise(resolve=>{
      function frame(now){
        if(token!==revealToken){resolve();return;}
        const t=Math.max(0,Math.min(1,(now-start)/duration)),ease=exiting?t*t*t:t*t*(3-2*t);
        setRadius(from+(target-from)*ease);
        if(t<1)requestAnimationFrame(frame);else resolve();
      }
      requestAnimationFrame(frame);
    });
  }
  const opening=revealTo(460,1500);
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
  const phase=text=>{if(status.textContent!==text){timings.push({stage:lastPhase,ms:Math.round(performance.now()-phaseStart)});lastPhase=text;phaseStart=performance.now();status.textContent=text;}};
  function progress(next,text){
    if(active&&!finished&&text)phase(text);
    return Promise.resolve();
  }
  function fail(text){
    if(!active||finished)return;
    failed=true;overlay.classList.add('is-error');
    phase(text);meter.removeAttribute('aria-valuenow');retry.hidden=false;clearTimeout(slow);lock();
  }
  window.ORBStartup={timings,stage:phase,get active(){return active&&!finished;},progress,
    preparing(){if(!active||finished)return;progress(.84,'Preparing garment');},
    async complete(){
      if(!active||finished)return;
      phase('Ready');finished=true;clearTimeout(slow);retry.hidden=true;
      // Fade immediately; never wait for a lap or fill the circle.
      revealToken++;
      overlay.classList.add('is-leaving');
      await new Promise(resolve=>{if(matchMedia('(prefers-reduced-motion: reduce)').matches)resolve();else setTimeout(resolve,200);});
      active=false;overlay.hidden=true;document.body.classList.remove('startup-lock');
      for(const node of locked)node.inert=false;locked.clear();
    },fail};
  // Existing callers supply stage labels; the indicator remains indeterminate.
  progress(.06,'Preparing studio');
  window.addEventListener('error',event=>{
    if(!active||finished||(!event.message&&event.target?.tagName!=='SCRIPT'))return;
    let file='';try{file=new URL(event.filename||event.target?.src,location.href).pathname.split('/').pop()||'';}catch{}
    const detail=event.error?.message||event.message||'Script download failed';
    fail('Startup error'+(file?' in '+file:'')+(event.lineno?':'+event.lineno:'')+': '+detail);
  },true);
  window.addEventListener('unhandledrejection',event=>{if(active&&!finished)fail('Startup error: '+(event.reason?.message||String(event.reason||'Unknown error')));});
})();
