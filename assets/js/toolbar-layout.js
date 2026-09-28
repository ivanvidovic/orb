// The responsive grid is CSS-only. These handlers control mobile utility panels.
const header=document.getElementById('mainToolbar');
const mobile=matchMedia('(max-width:600px)');
const modules=[...header.querySelectorAll('.toolbarModule')];
function closePanels(restore=false){
  for(const module of modules){
    const toggle=module.querySelector('.toolbarMenuToggle');
    if(restore&&module.classList.contains('is-open'))toggle.focus({preventScroll:true});
    module.classList.remove('is-open');toggle.setAttribute('aria-expanded','false');
  }
}
for(const module of modules){
  const toggle=module.querySelector('.toolbarMenuToggle');
  const panel=module.querySelector('.toolbarPanel');
  toggle.addEventListener('click',()=>{
    const opening=!module.classList.contains('is-open');
    closePanels();
    if(!opening||!mobile.matches)return;
    module.classList.add('is-open');toggle.setAttribute('aria-expanded','true');
    panel.style.top=`${Math.round(toggle.getBoundingClientRect().bottom+6)}px`;
    panel.querySelector('button')?.focus({preventScroll:true});
  });
  panel.addEventListener('click',event=>{
    if(mobile.matches&&event.target.closest('button'))closePanels(!!event.target.closest('#themeModes'));
  });
}
document.addEventListener('pointerdown',event=>{
  if(!modules.some(module=>module.contains(event.target)))closePanels();
});
document.addEventListener('focusin',event=>{
  if(!modules.some(module=>module.contains(event.target)))closePanels();
});
header.addEventListener('keydown',event=>{
  if(event.key==='Escape'&&modules.some(module=>module.classList.contains('is-open'))){
    event.preventDefault();event.stopPropagation();closePanels(true);
  }
});
addEventListener('resize',()=>closePanels());
mobile.addEventListener('change',()=>closePanels());
