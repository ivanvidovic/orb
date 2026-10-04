export function reviewLayout(count,width,height,mobile=false,gap=80,percent=35,ratio=7/6){
 width=Math.max(1,width);height=Math.max(1,height);
 const largest=Math.max(1,Math.min(width,(height-27)/ratio));
 const minPercent=Math.min(100,Math.ceil(100*Math.min(mobile?96:90,largest)/largest));
 percent=Math.max(minPercent,Math.min(100,percent??35));
 const cardWidth=Math.max(1,Math.floor(largest*percent/100));
 const columns=Math.max(1,Math.min(count||1,Math.floor((width+gap)/(cardWidth+gap)))),rows=Math.ceil(count/columns);
 return {width:cardWidth,columns,percent,minPercent,scroll:rows*(cardWidth*ratio+27)+gap*Math.max(0,rows-1)>height};
}
export function createCaptureDisclosure(){let first=true,explicitlyClosed=false;return {toggled(open){if(!open)explicitlyClosed=true;},captured(){const reveal=first&&!explicitlyClosed;first=false;return reveal;}};}


export function fitReviewLayout(count,width,height,_gap=80,ratio=7/6){
 count=Math.max(1,count);width=Math.max(1,width);height=Math.max(1,height);
 let best={width:0,columns:1,gap:0};
 // A proportional gutter leaves room without preserving oversized manual gaps.
 for(let columns=1;columns<=count;columns++){
  const rows=Math.ceil(count/columns);let lo=0,hi=width;
  for(let i=0;i<24;i++){const w=(lo+hi)/2,gap=Math.round(Math.min(80,Math.max(8,w*.12)));
   if(columns*w+(columns-1)*gap<=width&&rows*(w*ratio+27)+(rows-1)*gap<=height)lo=w;else hi=w;
  }
  const w=Math.floor(lo),gap=Math.round(Math.min(80,Math.max(8,w*.12)));
  if(w>best.width)best={width:w,columns,gap};
 }
 if(best.width<1){best={width:1,columns:Math.max(1,Math.floor(width/9)),gap:8};}
 const largest=Math.max(1,Math.min(width,(height-27)/ratio)),rows=Math.ceil(count/best.columns);
 return {...best,percent:Math.max(1,Math.round(100*best.width/largest)),minPercent:1,scroll:rows*(best.width*ratio+27)+(rows-1)*best.gap>height};
}
