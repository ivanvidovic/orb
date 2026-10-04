const GUTTER=12,CAPTION=27;
function fitted(count,width,height,ratio,mobile){
 count=Math.max(1,count);let best={width:0,columns:1};
 const limit=!mobile&&count>1?Math.ceil(count/2):count;
 for(let columns=1;columns<=limit;columns++){
  const rows=Math.ceil(count/columns),w=Math.floor(Math.min((width-GUTTER*(columns-1))/columns,((height-GUTTER*(rows-1))/rows-CAPTION)/ratio));
  if(w>best.width)best={width:w,columns};
 }
 return {...best,width:Math.max(1,best.width)};
}
export function reviewLayout(count,width,height,mobile=false,_gap=12,percent=100,ratio=7/6){
 width=Math.max(1,width);height=Math.max(1,height);
 const maximum=fitted(count,width,height,ratio,mobile);
 const minPercent=Math.min(100,Math.ceil(100*Math.min(mobile?96:90,maximum.width)/maximum.width));
 percent=Math.max(minPercent,Math.min(100,percent??100));
 const cardWidth=Math.max(1,Math.floor(maximum.width*percent/100));
 const columns=percent===100?maximum.columns:Math.max(1,Math.min(count||1,Math.floor((width+GUTTER)/(cardWidth+GUTTER))));
 const rows=Math.ceil(count/columns);
 return {width:cardWidth,columns,percent,minPercent,gap:GUTTER,scroll:rows*(Math.ceil(cardWidth*ratio)+26)+GUTTER*Math.max(0,rows-1)>height};
}
export function fitReviewLayout(count,width,height,_gap=12,ratio=7/6,mobile=false){
 return reviewLayout(count,width,height,mobile,GUTTER,100,ratio);
}
export function createCaptureDisclosure(){let first=true,explicitlyClosed=false;return {toggled(open){if(!open)explicitlyClosed=true;},captured(){const reveal=first&&!explicitlyClosed;first=false;return reveal;}};}
