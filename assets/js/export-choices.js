// Content-sized columns, balanced across rows without breaking a label.
export function installBalancedChoices(dialog){
 const groups=[...dialog.querySelectorAll('.export-views')];let scheduled=false;
 function balance(){scheduled=false;for(const group of groups){
  if(!group.getClientRects().length||!group.clientWidth)continue;
  const labels=[...group.querySelectorAll('label')].filter(e=>!e.hidden);if(!labels.length)continue;
  const widths=labels.map(label=>{label.style.width='max-content';const width=label.getBoundingClientRect().width;label.style.removeProperty('width');return Math.ceil(width);});
  const gap=16,available=group.clientWidth;let placement=[],columns=1;
  for(let rows=1;rows<=labels.length;rows++){
   const trial=[],columnWidths=[];let index=0;
   for(let row=0;row<rows;row++){const count=Math.ceil((labels.length-index)/(rows-row));for(let col=0;col<count;col++){trial.push([row+1,col+1]);columnWidths[col]=Math.max(columnWidths[col]||0,widths[index++]);}}
   if(columnWidths.reduce((a,b)=>a+b,0)+gap*(columnWidths.length-1)<=available||rows===labels.length){placement=trial;columns=columnWidths.length;break;}
  }
  labels.forEach((label,i)=>{label.style.gridRow=String(placement[i][0]);label.style.gridColumn=String(placement[i][1]);});
  const template=`repeat(${columns},max-content)`;if(group.style.gridTemplateColumns!==template)group.style.gridTemplateColumns=template;
 }}
 const schedule=()=>{if(!scheduled){scheduled=true;requestAnimationFrame(balance);}};
 const observer=new ResizeObserver(schedule);groups.forEach(g=>observer.observe(g));dialog.addEventListener('toggle',schedule,true);schedule();
}
