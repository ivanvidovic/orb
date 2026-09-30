// Keep layout and WebGL on one viewport size. Leave user pinch zoom untouched.
let size={width:window.innerWidth||1,height:window.innerHeight||1};
export const viewportSize=()=>size;
export function installViewport(onResize){
 let frame=0,rotationUntil=0,timers=[];
 const viewport=window.visualViewport;
 const editing=()=>document.activeElement?.matches('input,textarea,[contenteditable="true"]');
 function sync(){
  frame=0;
  if(viewport&&Math.abs(viewport.scale-1)>.02)return;
  const mobile=matchMedia('(pointer:coarse)').matches;
  const width=Math.max(1,Math.round(mobile&&viewport?viewport.width:window.innerWidth));
  const height=Math.max(1,Math.round(mobile&&viewport?viewport.height:window.innerHeight));
  const changed=width!==size.width||height!==size.height;
  size={width,height};
  document.documentElement.style.setProperty('--orb-viewport-width',width+'px');
  document.documentElement.style.setProperty('--orb-viewport-height',height+'px');
  // Only correct document drift during rotation, never the drawer's scroll position.
  if(performance.now()<rotationUntil&&!editing()&&(window.scrollX||window.scrollY))window.scrollTo(0,0);
  if(changed)onResize();
 }
 function schedule(){if(!frame)frame=requestAnimationFrame(sync);}
 function rotate(){rotationUntil=performance.now()+1000;timers.forEach(clearTimeout);schedule();timers=[setTimeout(schedule,150),setTimeout(schedule,400),setTimeout(schedule,800)];}
 window.addEventListener('resize',schedule);
 window.addEventListener('orientationchange',rotate);
 window.screen?.orientation?.addEventListener('change',rotate);
 viewport?.addEventListener('resize',schedule);
 viewport?.addEventListener('scroll',()=>{if(performance.now()<rotationUntil)schedule();});
 window.addEventListener('pageshow',schedule);
 sync();onResize();
}
