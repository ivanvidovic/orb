import {recolorCoverLogo} from './pdf-logo.js?v=0.9.81';
// PDF dependencies are local and loaded only for PDF presentations.
import {reference,artworkColors} from './deck-metadata.js?v=0.9.81';
let ready;
export function loadPdfEngine(){return ready??=Promise.all(['pdf-lib.min.js','fontkit.umd.min.js'].map(file=>new Promise((resolve,reject)=>{const s=document.createElement('script');s.src=new URL('../vendor/pdf/'+file,import.meta.url);s.onload=resolve;s.onerror=()=>reject(Error('Could not load the PDF engine.'));document.head.append(s);}))).catch(e=>{ready=null;throw e;});}
export async function createDeckWriter(settings,total,logoBytes){
 settings={...settings,primary:'Regular',secondary:'Regular'};
 await loadPdfEngine();const {PDFDocument,rgb,PDFName}=window.PDFLib,pdf=await PDFDocument.create();pdf.registerFontkit(window.fontkit);
 const bytes=async style=>{const r=await fetch(new URL('../fonts/geist-pixel/'+style.toLowerCase()+'.ttf',import.meta.url));if(!r.ok)throw Error('PDF font could not load.');return r.arrayBuffer();};
 const fontBytes={},fonts={};for(const style of new Set([settings.primary,settings.secondary])){fontBytes[style]=await bytes(style);fonts[style]=await pdf.embedFont(fontBytes[style],{subset:true});}
 const primary=fonts[settings.primary],secondary=fonts[settings.secondary],W=1920,H=1080,M=40;
 const color=hex=>rgb(...hex.slice(1).match(/../g).map(x=>parseInt(x,16)/255)),ink=color(settings.text),accent=color(settings.accent);
 pdf.setTitle(settings.collection);pdf.setSubject(settings.subtitle);pdf.setCreator('ORB Garment Studio');
 const bg=settings.background.slice(1).match(/../g).map(x=>parseInt(x,16)/255),light=bg.reduce((v,c,i)=>v+c*[.2126,.7152,.0722][i],0)>.5,muted=color(light?'#666666':'#B8B8B8');
 const supported=(text,font)=>{const chars=new Set(font.getCharacterSet());return [...String(text)].map(c=>chars.has(c.codePointAt(0))?c:'?').join('');};
 function text(page,value,x,y,{font=secondary,size=18,max=1800,align='left',fill=muted}={}){value=supported(value,font);if(font.widthOfTextAtSize(value,size)>max)throw Error('A page label is too long. Shorten the title or collection name.');const width=font.widthOfTextAtSize(value,size);page.drawText(value,{x:x-(align==='right'?width:align==='center'?width/2:0),y,font,size,color:fill});}
 const drawCommands=new WeakMap(),imageSources=new Map(),imageCache=new Map();
 async function embedImage(blob){const data=await blob.arrayBuffer(),hash=Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',data)),n=>n.toString(16).padStart(2,'0')).join('');if(!imageCache.has(hash)){const img=await(blob.type==='image/jpeg'?pdf.embedJpg(data):pdf.embedPng(data));imageCache.set(hash,img);if(settings.previewRaster)imageSources.set(img,blob);}return imageCache.get(hash);}
 function page(bg=settings.background){const p=pdf.addPage([W,H]);if(settings.previewRaster){const commands=[];drawCommands.set(p,commands);for(const method of ['drawRectangle','drawText','drawImage']){const original=p[method].bind(p);p[method]=(...args)=>{commands.push([method,args]);return original(...args);};}}p.drawRectangle({x:0,y:0,width:W,height:H,color:color(bg)});return p;}
 function link(p,label,x,y,dest){text(p,label,x,y,{font:primary,size:18,fill:accent});const a=pdf.context.obj({Type:'Annot',Subtype:'Link',Rect:[x,y-5,x+190,y+22],Border:[0,0,0],A:{S:'GoTo',D:[dest.ref,PDFName.of('Fit')]}});p.node.addAnnot(pdf.context.register(a));}
 const logo=logoBytes?await embedImage(await recolorCoverLogo(logoBytes,settings)):null;
 function cover(closing=false){const p=page(settings.coverBackground),fill=color(settings.coverText);if(logo){const s=Math.min(1050/logo.width,420/logo.height);p.drawImage(logo,{x:(W-logo.width*s)/2,y:490,width:logo.width*s,height:logo.height*s});}text(p,closing?settings.closingNote:[settings.collection,settings.subtitle,settings.date].filter(Boolean).join(' · '),W/2,logo?415:535,{font:primary,size:22,max:1680,align:'center',fill});}

 if(settings.cover)cover();
 const reviews=settings.overview?Array.from({length:Math.ceil(total/16)},()=>page()):[],designs=[];
 async function add({metadata:m,identity,front,back},index){
 const p=page();designs.push(p);const id=reference(m),title=[id,m.title].filter(Boolean).join(' · '),colors=settings.colors?artworkColors(identity):[],original=settings.colors&&(identity.artwork||[]).some(a=>a.visible!==false&&a.mode==='original');
 if(colors.length>12)throw Error('More than 12 artwork colors will not fit the header. Disable Artwork Colors for this deck.');
 const colorLabel='Artwork Colors',labelGap=10,itemGap=12,originalWidth=original?secondary.widthOfTextAtSize('Original',18):0;
 const colorItems=colors.map(c=>({color:c,width:23+(colors.length<=3?7+secondary.widthOfTextAtSize(c,18):0)}));
 const colorWidth=colors.length?secondary.widthOfTextAtSize(colorLabel,18)+labelGap+colorItems.reduce((sum,item)=>sum+item.width,0)+(colors.length-1)*itemGap:0,rightWidth=colorWidth+originalWidth+(original&&colors.length?itemGap:0);
 const detail=[m.garment,m.fabric].join(' · '),detailWidth=settings.details?secondary.widthOfTextAtSize(supported(detail,secondary),18):0;
 text(p,title,M,H-43,{font:primary,fill:ink,max:settings.details?W/2-detailWidth/2-M-28:W-2*M-rightWidth-20,size:18});
 if(settings.details)text(p,detail,W/2,H-43,{max:2*(W/2-M-rightWidth-28),align:'center',size:18});
 if(colors.length){let x=W-M-rightWidth;text(p,colorLabel,x,H-43,{size:18,max:200});x+=secondary.widthOfTextAtSize(colorLabel,18)+labelGap;for(const item of colorItems){p.drawRectangle({x,y:H-45,width:23,height:23,color:color(item.color),borderColor:ink,borderWidth:.5});if(colors.length<=3)text(p,item.color,x+item.width,H-43,{size:18,max:100,align:'right'});x+=item.width+itemGap;}}
 if(original)text(p,'Original',W-M,H-43,{max:105,align:'right'});
 const images=[];for(const [j,blob] of [front,back].entries()){const img=await embedImage(blob);images.push(img);const x=M+j*940,y=102,w=900,h=902,s=Math.min(w/img.width,h/img.height);p.drawImage(img,{x:x+(w-img.width*s)/2,y:y+(h-img.height*s)/2,width:img.width*s,height:img.height*s});text(p,j?'Back':'Front',x+w/2,92,{align:'center',max:w,size:14});}
 const overview=reviews[Math.floor(index/16)];if(overview)link(p,'← Back to Review',M,27,overview);
 text(p,[settings.collection,settings.subtitle,settings.date].filter(Boolean).join(' · '),W/2,27,{max:1260,size:18,align:'center'});if(settings.pageNumbers)text(p,String(pdf.getPageCount()).padStart(2,'0'),W-M,27,{size:18,max:60,align:'right'});
 if(overview){const local=index%16,n=Math.min(16,total-Math.floor(index/16)*16),row=Math.floor(local/6),col=local%6,items=Math.min(6,n-row*6),cellW=300,cellH=308,x=(W-items*cellW)/2+col*cellW,y=H-85-(row+1)*cellH;
 const img=images[settings.overviewView==='front'?0:1],s=Math.min(270/img.width,270/img.height);overview.drawImage(img,{x:x+(cellW-img.width*s)/2,y:y+35,width:img.width*s,height:img.height*s});text(overview,[id,m.fabric].filter(Boolean).join(' · '),x+cellW/2,y+18,{font:primary,fill:ink,size:15,max:290,align:'center'});
 const annotation=pdf.context.obj({Type:'Annot',Subtype:'Link',Rect:[x,y,x+cellW,y+cellH],Border:[0,0,0],A:{S:'GoTo',D:[p.ref,PDFName.of('Fit')]}});overview.node.addAnnot(pdf.context.register(annotation));}
 
 }
 async function save(){reviews.forEach((p,i)=>{text(p,settings.collection,M,H-43,{font:primary,fill:ink,size:18,max:1350});text(p,'Review '+(i+1)+' / '+reviews.length,W-M,H-43,{size:18,max:350,align:'right'});text(p,'Select a garment to view the design',M,27,{size:18});if(settings.pageNumbers)text(p,String(pdf.getPages().indexOf(p)+1).padStart(2,'0'),W-M,27,{size:18,max:80,align:'right'});});if(settings.closing)cover(true);return new Blob([await pdf.save()],{type:'application/pdf'});}
 async function preview(edge=1920){
  if(!settings.previewRaster||!designs[0])throw Error('No preview page is available.');
  const faces=[],names=new Map(),bitmaps=new Map(),canvas=document.createElement('canvas');canvas.width=edge;canvas.height=Math.round(edge*H/W);const ctx=canvas.getContext('2d');if(!ctx)throw Error('Could not render the page preview.');
  const css=c=>`rgb(${Math.round(c.red*255)} ${Math.round(c.green*255)} ${Math.round(c.blue*255)})`;
  try{for(const [style,font] of Object.entries(fonts)){const name='ORBDeckPreview'+style,face=new FontFace(name,fontBytes[style]);await face.load();document.fonts.add(face);faces.push(face);names.set(font,name);}
   ctx.scale(edge/W,edge/W);ctx.textBaseline='alphabetic';ctx.imageSmoothingQuality='high';
   for(const [method,args] of drawCommands.get(designs[0])){
    if(method==='drawRectangle'){const o=args[0];if(o.color){ctx.fillStyle=css(o.color);ctx.fillRect(o.x,H-o.y-o.height,o.width,o.height);}if(o.borderWidth){ctx.strokeStyle=css(o.borderColor);ctx.lineWidth=o.borderWidth;ctx.strokeRect(o.x,H-o.y-o.height,o.width,o.height);}}
    else if(method==='drawText'){const [value,o]=args;ctx.font=`${o.size}px "${names.get(o.font)}"`;ctx.fillStyle=css(o.color);ctx.fillText(value,o.x,H-o.y);}
    else{const [img,o]=args;if(!bitmaps.has(img))bitmaps.set(img,await createImageBitmap(imageSources.get(img)));ctx.drawImage(bitmaps.get(img),o.x,H-o.y-o.height,o.width,o.height);}
   }
   return await new Promise((resolve,reject)=>canvas.toBlob(b=>b?resolve(b):reject(Error('Could not encode the page preview.')),'image/png'));
  }finally{for(const face of faces)document.fonts.delete(face);for(const bitmap of bitmaps.values())bitmap.close();canvas.width=canvas.height=1;}
 }
 return {add,save,preview};
}
