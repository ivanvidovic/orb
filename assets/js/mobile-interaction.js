import {MOBILE_MEMORY} from './render-budget.js?v=91-opt43';
export function installMobileInteraction(){
 if(!MOBILE_MEMORY)return;
 document.documentElement.classList.add('orb-mobile');
 const meta=document.querySelector('meta[name="viewport"]');
 if(meta)meta.content='width=device-width, initial-scale=1, minimum-scale=1, maximum-scale=1, user-scalable=no, viewport-fit=cover';
 // Cancel page gestures without stopping the viewer's own touch handlers.
 for(const type of ['gesturestart','gesturechange','gestureend'])document.addEventListener(type,event=>event.preventDefault(),{passive:false});
 document.addEventListener('touchmove',event=>{if(event.touches.length>1)event.preventDefault();},{passive:false});
 document.addEventListener('dblclick',event=>{if(!event.target.closest?.('#gl'))event.preventDefault();},{passive:false});
}
