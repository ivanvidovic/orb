const GUTTER=12,CAPTION=35;
// Whole columns fill each row. Native pixels cap image width independently of spacing.
function bounds(count,width,mobile,nativeWidth){
 const cap=Math.max(1,nativeWidth);
 const minimum=Math.max(Math.min(count||1,mobile?1:2),Math.ceil((width+GUTTER)/(cap+GUTTER)));
 const maximum=Math.max(minimum,Math.min(count||1,Math.max(1,Math.floor((width+GUTTER)/((mobile?104:96)+GUTTER)))));
 return {minimum,maximum,cap};
}
function arrangement(count,width,height,columns,ratio,b){
 const cardWidth=Math.min(b.cap,(width-GUTTER*(columns-1))/columns);
 const rows=Math.ceil(count/columns);
 return {width:Math.max(1,cardWidth),columns,percent:b.maximum===b.minimum?100:Math.round(100*(b.maximum-columns)/(b.maximum-b.minimum)),minPercent:0,gap:GUTTER,
 scroll:rows*(Math.ceil(cardWidth*ratio)+CAPTION)+GUTTER*Math.max(0,rows-1)>height};
}
export function reviewLayout(count,width,height,mobile=false,_gap=12,value=100,ratio=7/6,nativeWidth=1200){
 width=Math.max(1,width);height=Math.max(1,height);count=Math.max(0,count);
 const b=bounds(count,width,mobile,nativeWidth),level=Math.max(0,Math.min(100,Number(value)||0));
 const columns=b.maximum-Math.round((b.maximum-b.minimum)*level/100);
 return arrangement(count,width,height,columns,ratio,b);
}
export function fitReviewLayout(count,width,height,gap=12,ratio=7/6,mobile=false,nativeWidth=1200){
 width=Math.max(1,width);height=Math.max(1,height);count=Math.max(0,count);
 const b=bounds(count,width,mobile,nativeWidth);
 for(let columns=b.minimum;columns<=b.maximum;columns++){
  const layout=arrangement(count,width,height,columns,ratio,b);
  if(!layout.scroll||columns===b.maximum)return layout;
 }
}
export function createCaptureDisclosure(){let first=true,explicitlyClosed=false;return {toggled(open){if(!open)explicitlyClosed=true;},captured(){const reveal=first&&!explicitlyClosed;first=false;return reveal;}};}
