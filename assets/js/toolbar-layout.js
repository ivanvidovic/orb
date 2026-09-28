// Measure the actual controls, including font and label changes, before wrapping.
const header=document.getElementById('mainToolbar');
const tools=header.querySelector('.topTools');
let frame=0;
function layout(){
  frame=0;
  const css=getComputedStyle(header),toolCss=getComputedStyle(tools);
  const width=header.clientWidth-parseFloat(css.paddingLeft)-parseFloat(css.paddingRight);
  const groups=[...tools.children];
  const toolWidth=groups.reduce((sum,e)=>sum+e.getBoundingClientRect().width,0)+(groups.length-1)*parseFloat(toolCss.columnGap);
  const fixed=['.brand-mark','.topActions','.helpBtn','.themeToggle'].reduce((sum,q)=>sum+header.querySelector(q).getBoundingClientRect().width,0);
  header.classList.toggle('toolbar-compact',innerWidth<=600||fixed+toolWidth+4*parseFloat(css.columnGap)>width);
}
function schedule(){if(!frame)frame=requestAnimationFrame(layout);}
new ResizeObserver(schedule).observe(header);
new MutationObserver(schedule).observe(tools,{childList:true,subtree:true,characterData:true});
addEventListener('resize',schedule,{passive:true});
document.fonts?.ready.then(schedule);
layout();
