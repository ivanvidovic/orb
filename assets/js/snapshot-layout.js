export function reviewLayout(count,width,height,mobile=false,gap=12,percent=null){
  width=Math.max(1,width);height=Math.max(1,height);
  if(!count)return {width,columns:1,scroll:false,percent:100};
  const largest=Math.max(1,Math.min(width,(height-2)*6/7)),minPercent=Math.min(100,Math.ceil(100*Math.min(mobile?96:90,largest)/largest));
  if(percent!==null){
    percent=Math.max(minPercent,Math.min(100,percent));
    const cardWidth=Math.min(width,largest*percent/100);
    const columns=Math.max(1,Math.min(count,Math.floor((width+gap)/(cardWidth+gap))));
    return {width:cardWidth,columns,percent,minPercent,scroll:Math.ceil(count/columns)*(cardWidth*7/6+2)+gap*(Math.ceil(count/columns)-1)>height};
  }
  const minimum=mobile?145:190,maxColumns=Math.max(1,Math.floor((width+gap)/(minimum+gap)));
  let columns;
  if(mobile)columns=Math.min(count,2,maxColumns);
  else if(count<=6)columns=Math.min(count===4?2:Math.min(count,3),maxColumns);
  else{
    let best=0;columns=1;
    for(let c=1;c<=Math.min(count,maxColumns);c++){
      const rows=Math.ceil(count/c),w=Math.min((width-gap*(c-1))/c,((height-gap*(rows-1))/rows-2)*6/7);
      if(w>best){best=w;columns=c;}
    }
    if(best<minimum)columns=Math.min(count,maxColumns);
  }
  const rows=Math.ceil(count/columns),across=(width-gap*(columns-1))/columns,fit=((height-gap*(rows-1))/rows-2)*6/7;
  const cardWidth=Math.floor(Math.min(largest,across,Math.max(Math.min(minimum,across),fit))*100)/100;
  return {width:cardWidth,columns,minPercent,percent:Math.round(100*cardWidth/largest),scroll:rows*(cardWidth*7/6+2)+gap*(rows-1)>height+.5};
}
export function createCaptureDisclosure(){let first=true,explicitlyClosed=false;return {toggled(open){if(!open)explicitlyClosed=true;},captured(){const reveal=first&&!explicitlyClosed;first=false;return reveal;}};}
