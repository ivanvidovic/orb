const GUTTER=12,CAPTION=35;
// The control is a 0–100 small-to-large range, not a literal percentage.
export function reviewLayout(count,width,height,mobile=false,_gap=12,value=100,ratio=7/6){
 width=Math.max(1,width);height=Math.max(1,height);count=Math.max(0,count);
 const maxColumns=mobile||count<=1?1:2;
 const maximum=Math.max(1,(width-GUTTER*(maxColumns-1))/maxColumns);
 const level=Math.max(0,Math.min(100,Math.round(Number(value)||0)));
 const cardWidth=Math.max(1,Math.floor(maximum*(.25+.75*level/100)));
 const columns=Math.max(1,Math.min(count||1,Math.floor((width+GUTTER)/(cardWidth+GUTTER))));
 const rows=Math.ceil(count/columns);
 return {width:cardWidth,columns,percent:level,minPercent:0,gap:GUTTER,scroll:rows*(Math.ceil(cardWidth*ratio)+CAPTION)+GUTTER*Math.max(0,rows-1)>height};
}
export function fitReviewLayout(count,width,height,gap=12,ratio=7/6,mobile=false){
 for(let value=100;value>=0;value--){
  const layout=reviewLayout(count,width,height,mobile,gap,value,ratio);
  if(!layout.scroll||value===0)return layout;
 }
}
export function createCaptureDisclosure(){let first=true,explicitlyClosed=false;return {toggled(open){if(!open)explicitlyClosed=true;},captured(){const reveal=first&&!explicitlyClosed;first=false;return reveal;}};}
