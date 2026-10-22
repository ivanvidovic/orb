// Recolor only RGB; source alpha remains intact.
export function coverLogoColor(background,mode='auto',custom='#FFFFFF'){
 if(mode==='custom'&&/^#[a-f\d]{6}$/i.test(custom))return custom;
 const rgb=background.slice(1).match(/../g).map(v=>parseInt(v,16)/255).map(v=>v<=.04045?v/12.92:((v+.055)/1.055)**2.4);
 return rgb.reduce((sum,v,i)=>sum+v*[.2126,.7152,.0722][i],0)>.179?'#000000':'#FFFFFF';
}
export async function recolorCoverLogo(bytes,settings){
 const bitmap=await createImageBitmap(new Blob([bytes],{type:'image/png'})),canvas=document.createElement('canvas');canvas.width=bitmap.width;canvas.height=bitmap.height;
 try{const ctx=canvas.getContext('2d');ctx.drawImage(bitmap,0,0);ctx.globalCompositeOperation='source-in';ctx.fillStyle=coverLogoColor(settings.coverBackground,settings.logoMode,settings.logoColor);ctx.fillRect(0,0,canvas.width,canvas.height);return await new Promise((resolve,reject)=>canvas.toBlob(b=>b?resolve(b):reject(Error('Logo color conversion failed.')),'image/png'));}finally{bitmap.close();canvas.width=canvas.height=1;}
}
