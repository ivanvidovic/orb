// One measured viewport for layout, rendering and presentation backgrounds.
let size={width:window.innerWidth||1,height:window.innerHeight||1};
export const viewportSize=()=>size;
export function installViewport(onResize){
 let frame=0,rotationUntil=0,timers=[];
 const viewport=window.visualViewport;
 const editing=()=>document.activeElement?.matches('input,textarea,[contenteditable="true"]');
 function sync(){
  frame=0;
  // Do not resize the app into a user's pinch-zoomed viewport.
  const zoomed=viewport&&Math.abs(viewport.scale-1)>.02;
  // A rotation must still update the underlying layout at non-default zoom.
  // Ordinary pinch gestures retain their existing layout dimensions.
  if(zoomed&&performance.now()>=rotationUntil)return;
  const mobile=matchMedia('(pointer:coarse)').matches;
  const width=Math.max(1,Math.round(mobile&&viewport&&!zoomed?viewport.width:window.innerWidth));
  const height=Math.max(1,Math.round(mobile&&viewport&&!zoomed?viewport.height:window.innerHeight));
  const changed=width!==size.width||height!==size.height;
  size={width,height};
  document.documentElement.style.setProperty('--orb-viewport-width',width+'px');
  document.documentElement.style.setProperty('--orb-viewport-height',height+'px');
  if(!zoomed&&performance.now()<rotationUntil&&!editing()&&(window.scrollX||window.scrollY))window.scrollTo(0,0);
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
