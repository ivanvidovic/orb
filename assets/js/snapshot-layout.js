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
  const columns=mobile||width<620?2:4,tiles=[];let remaining=count,row=1;
  while(remaining){
    const n=remaining===6?3:remaining===7?4:remaining===8?4:Math.min(5,remaining);
    if(columns===4){
      if(n>=3){tiles.push({x:1,y:row,w:2,h:2});
        if(n===3)tiles.push({x:3,y:row,w:2,h:1},{x:3,y:row+1,w:2,h:1});
        if(n===4)tiles.push({x:3,y:row,w:2,h:1},{x:3,y:row+1,w:1,h:1},{x:4,y:row+1,w:1,h:1});
        if(n===5)tiles.push({x:3,y:row,w:1,h:1},{x:4,y:row,w:1,h:1},{x:3,y:row+1,w:1,h:1},{x:4,y:row+1,w:1,h:1});
        row+=2;
      }else{for(let i=0;i<n;i++)tiles.push({x:1+i*(4/n),y:row,w:4/n,h:1});row++;}
    }else{
      if(n===3||n===5){tiles.push({x:1,y:row,w:1,h:2},{x:2,y:row,w:1,h:1},{x:2,y:row+1,w:1,h:1});row+=2;if(n===5){tiles.push({x:1,y:row,w:1,h:1},{x:2,y:row,w:1,h:1});row++;}}
      else{for(let i=0;i<n;i++)tiles.push({x:1+i%2,y:row+Math.floor(i/2),w:n===1?2:1,h:1});row+=Math.ceil(n/2);}
    }
    remaining-=n;
  }
  const rows=row-1,across=(width-gap*(columns-1))/columns;
  const maxSpan=Math.max(...tiles.map(t=>t.h));
  const largest=Math.max(1,Math.min(across,(height-gap*(maxSpan-1))/maxSpan)),minPercent=Math.min(100,Math.ceil(100*Math.min(mobile?96:90,largest)/largest));
  if(percent!==null)percent=Math.max(minPercent,Math.min(100,percent));
  const fit=(height-gap*(rows-1))/rows;
  const unit=percent===null?Math.min(largest,Math.max(Math.min(mobile?110:150,largest),fit)):largest*Math.max(1,Math.min(100,percent))/100;
  return {columns,width:unit,rows,tiles,minPercent,percent:percent??Math.round(100*unit/largest),scroll:unit*rows+gap*(rows-1)>height};
}
export function createCaptureDisclosure(){let first=true,explicitlyClosed=false;return {toggled(open){if(!open)explicitlyClosed=true;},captured(){const reveal=first&&!explicitlyClosed;first=false;return reveal;}};}
