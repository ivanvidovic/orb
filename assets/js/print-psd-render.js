import {createArtworkTreatment} from './artwork-treatment.js?v=91-history13';
import {treatPixels} from './artwork-export.js?v=0.9.51';
import {pixelateArtwork} from './print-texture.js?v=91-history13';
import {transformedBounds,alphaBounds} from './print-layout.js?v=0.9.51';
// This module runs in an export-only worker. Slider rendering is unchanged.
export function createPrintRenderer(canvasFactory){
  const canvas=(w,h)=>{const c=canvasFactory();c.width=w;c.height=h;return c;};
  const engine=createArtworkTreatment(canvasFactory);
  function pixels(c){return c.getContext('2d').getImageData(0,0,c.width,c.height);}
  function put(c,data,w,h){const ctx=c.getContext('2d'),im=ctx.createImageData(w,h);im.data.set(data);ctx.putImageData(im,0,0);}
  function occupiedBounds(source){
    const w=source.width,h=source.height,ctx=source.getContext('2d');
    let left=w,top=h,right=0,bottom=0;
    // Scan short strips instead of retaining another full-resolution RGBA copy.
    for(let y=0;y<h;y+=256){
      const rows=Math.min(256,h-y),im=ctx.getImageData(0,y,w,rows),b=alphaBounds(im.data,w,rows);
      if(b){left=Math.min(left,b[0]*w);top=Math.min(top,y+b[1]*rows);right=Math.max(right,b[2]*w);bottom=Math.max(bottom,y+b[3]*rows);}
    }
    return right>left&&bottom>top?[left/w,top/h,right/w,bottom/h]:null;
  }
  function place(source,desc,name,hidden){
    // Find occupied source bounds before allocating the rotated output canvas.
    // Matrix and source dimensions remain unchanged: transparent margins still
    // define registration, and treated pixels are measured after all effects.
    const occupied=occupiedBounds(source);
    if(!occupied)return {name,hidden,top:Math.floor(desc.matrix[5]),left:Math.floor(desc.matrix[4]),imageData:{width:1,height:1,data:new Uint8ClampedArray(4)}};
    const margin=2,rect=[Math.max(0,occupied[0]-margin/source.width),Math.max(0,occupied[1]-margin/source.height),Math.min(1,occupied[2]+margin/source.width),Math.min(1,occupied[3]+margin/source.height)];
    const m=desc.matrix,b=transformedBounds(m,rect),left=Math.floor(b[0]),top=Math.floor(b[1]),w=Math.max(1,Math.ceil(b[2])-left),h=Math.max(1,Math.ceil(b[3])-top),out=canvas(w,h),ctx=out.getContext('2d');
    ctx.setTransform(m[0]/source.width,m[1]/source.width,m[2]/source.height,m[3]/source.height,m[4]-left,m[5]-top);
    ctx.imageSmoothingEnabled=!(Math.abs(m[0])===source.width&&Math.abs(m[3])===source.height&&m[1]===0&&m[2]===0&&Number.isInteger(m[4])&&Number.isInteger(m[5]));ctx.imageSmoothingQuality='high';ctx.drawImage(source,0,0);
    const im=pixels(out);out.width=out.height=1;
    // Crop channels, not layer coordinates. Small logos don't occupy a whole PSD canvas.
    let x0=w,y0=h,x1=-1,y1=-1;for(let y=0,i=3;y<h;y++)for(let x=0;x<w;x++,i+=4)if(im.data[i]){x0=Math.min(x0,x);x1=Math.max(x1,x);y0=Math.min(y0,y);y1=Math.max(y1,y);}
    if(x1<0)return {name,hidden,top,left,imageData:{width:1,height:1,data:new Uint8ClampedArray(4)}};
    const tw=x1-x0+1,th=y1-y0+1;
    if(tw===w&&th===h)return {name,hidden,top,left,imageData:im};
    const data=new Uint8ClampedArray(tw*th*4);
    for(let y=0;y<th;y++)data.set(im.data.subarray(((y+y0)*w+x0)*4,((y+y0)*w+x0+tw)*4),y*tw*4);
    return {name,hidden,top:top+y0,left:left+x0,imageData:{width:tw,height:th,data}};
  }
  function layer(bitmap,desc,settings,color){
    const m=desc.matrix,crop=desc.crop,pad=desc.pad||[0,0];
    const tw=Math.max(1,Math.ceil(Math.hypot(m[0],m[1]))),th=Math.max(1,Math.ceil(Math.hypot(m[2],m[3])));
    const cw=Math.max(1,Math.round(tw*(1-2*pad[0]))),ch=Math.max(1,Math.round(th*(1-2*pad[1])));
    if(tw*th>48000000)throw new Error('A print layer exceeds the browser export budget. Reduce the artwork size.');
    const work=canvas(cw,ch),ctx=work.getContext('2d'),texture=canvas(tw,th),tx=texture.getContext('2d');
    const dx=tw*pad[0],dy=th*pad[1],dw=tw-2*dx,dh=th-2*dy;
    const draw=(source,smooth=true)=>{ctx.clearRect(0,0,cw,ch);ctx.imageSmoothingEnabled=smooth&&(Math.abs(crop[2]*source.width-cw)>.0001||Math.abs(crop[3]*source.height-ch)>.0001);ctx.imageSmoothingQuality='high';ctx.drawImage(source,crop[0]*source.width,crop[1]*source.height,crop[2]*source.width,crop[3]*source.height,0,0,cw,ch);};
    tx.imageSmoothingEnabled=!(Number.isInteger(dx)&&Number.isInteger(dy)&&dw===cw&&dh===ch);draw(bitmap);tx.drawImage(work,dx,dy,dw,dh);
    const name=settings.name||'Artwork',hidden=settings.visible===false,untreated=place(texture,desc,name,hidden);
    if(settings.printPattern==='pixel'){
      const source=pixelateArtwork(bitmap,settings,canvasFactory);draw(source,false);if(source!==bitmap)source.width=source.height=1;
    }
    work.orbCrop={fullWidth:cw/crop[2],fullHeight:ch/crop[3],offsetX:crop[0]*cw/crop[2],offsetY:crop[1]*ch/crop[3]};
    const result=engine.render(work,{...settings,fit:false,printPattern:settings.printPattern==='pixel'?'none':settings.printPattern},0);
    let rgba=result.data;
    if(result.coverageOnly){const rgb=color.slice(1).match(/../g).map(x=>parseInt(x,16));rgba=new Uint8ClampedArray(result.width*result.height*4);for(let i=0,j=0;i<result.data.length;i++,j+=4){rgba[j]=rgb[0];rgba[j+1]=rgb[1];rgba[j+2]=rgb[2];rgba[j+3]=result.data[i];}}
    else if(settings.mode==='tint')treatPixels(rgba,settings,color,result.width,result.height);
    const treatedCanvas=canvas(result.width,result.height);put(treatedCanvas,rgba,result.width,result.height);
    tx.clearRect(0,0,tw,th);const p=result.padding||0;
    tx.drawImage(treatedCanvas,p,p,result.width-2*p,result.height-2*p,dx,dy,dw,dh);
    const treated=place(texture,desc,name,hidden);
    engine.clear();for(const c of [work,texture,treatedCanvas])c.width=c.height=1;
    return {treated,untreated,groupId:desc.groupId,groupName:desc.groupName,sourcePixels:{width:bitmap.width,height:bitmap.height},rasterScale:Math.max(cw/(bitmap.width*crop[2]),ch/(bitmap.height*crop[3]))};
  }
  function grouped(pairs,key){const out=[];let run=null;for(const p of [...pairs].reverse()){if(p.groupId){if(!run||run.id!==p.groupId){run={id:p.groupId,name:p.groupName||'Lockup',opened:true,children:[]};out.push(run);}run.children.push(p[key]);}else{run=null;out.push(p[key]);}}return out.map(x=>{if(x.children)delete x.id;return x;});}
  function document(plan,pairs){
    const merged=canvas(plan.width,plan.height),ctx=merged.getContext('2d');
    for(const pair of [...pairs].reverse()){const l=pair.treated;if(l.hidden)continue;const c=canvas(l.imageData.width,l.imageData.height);put(c,l.imageData.data,c.width,c.height);ctx.drawImage(c,l.left,l.top);c.width=c.height=1;}
    const imageData=pixels(merged);ctx.fillStyle='#777777';ctx.fillRect(0,0,plan.width,plan.height);const background=pixels(merged);merged.width=merged.height=1;
    // PSD records are bottom-to-top; the studio layer list is top-to-bottom.
    return {width:plan.width,height:plan.height,imageData,children:[
      {name:'Treated artwork',opened:true,children:grouped(pairs,'treated')},
      {name:'Untreated artwork',hidden:true,opened:false,children:grouped(pairs,'untreated')},
      {name:'Background preview · hidden for print',hidden:true,left:0,top:0,imageData:background}
    ].reverse(),imageResources:{resolutionInfo:{horizontalResolution:300,horizontalResolutionUnit:'PPI',widthUnit:'Inches',verticalResolution:300,verticalResolutionUnit:'PPI',heightUnit:'Inches'}}};
  }
  return {layer,document};
}
