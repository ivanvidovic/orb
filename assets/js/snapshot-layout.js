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
// Every band completely fills its rectangular grid. Order stays chronological.
export function mosaicLayout(count,width,height,mobile=false,gap=12,percent=null){
  width=Math.max(1,width);height=Math.max(1,height);
  if(count<3||width<300){const layout=reviewLayout(count,width,height,mobile,gap,percent);return {...layout,tiles:null};}
  // A stable size reference lets smaller units admit more columns.
  const largest=Math.max(1,Math.min((width-gap)/2,(height-gap)/2));
  const minPercent=Math.min(100,Math.ceil(100*Math.min(mobile?96:90,largest)/largest));
  if(percent!==null)percent=Math.max(minPercent,Math.min(100,percent));
  const requested=percent===null?Math.min(largest,Math.max(mobile?110:150,Math.sqrt(width*height/Math.max(count,1))*.7)):largest*percent/100;
  const columns=Math.max(2,Math.min(count,8,Math.floor((width+gap)/(requested+gap))));
  const unit=Math.min(requested,(width-gap*(columns-1))/columns),tiles=[];
  let remaining=count,row=1;
  while(remaining){
    const bandCount=2*columns-3;
    if(columns>=3&&remaining>=bandCount){
      tiles.push({x:1,y:row,w:2,h:2});
      for(let y=0;y<2;y++)for(let x=3;x<=columns;x++)tiles.push({x,y:row+y,w:1,h:1});
      remaining-=bandCount;row+=2;
    }else if(columns===2&&remaining>=3){
      tiles.push({x:1,y:row,w:1,h:2},{x:2,y:row,w:1,h:1},{x:2,y:row+1,w:1,h:1});remaining-=3;row+=2;
    }else{
      const n=Math.min(columns,remaining),base=Math.floor(columns/n),extra=columns%n;let x=1;
      for(let i=0;i<n;i++){const w=base+(i<extra?1:0);tiles.push({x,y:row,w,h:1});x+=w;}
      remaining-=n;row++;
    }
  }
  const rows=row-1;
  return {columns,width:unit,rows,tiles,minPercent,percent:percent??Math.round(100*unit/largest),scroll:unit*rows+gap*(rows-1)>height};
}
export function createCaptureDisclosure(){let first=true,explicitlyClosed=false;return {toggled(open){if(!open)explicitlyClosed=true;},captured(){const reveal=first&&!explicitlyClosed;first=false;return reveal;}};}
