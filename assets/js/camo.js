// Coordinated solid trims sampled from each source pattern palette.
export const CAMO_TRIMS={
 duck:{cord:'#604A39',thread:'#3D4C3B'},
 'desert-duck':{cord:'#9A928F',thread:'#8C847E'},
 forest:{cord:'#555744',thread:'#45473B'},
 black:{cord:'#464449',thread:'#363337'},
 tiger:{cord:'#515339',thread:'#675539'},
 army:{cord:'#777A5D',thread:'#444C32'},
 winter:{cord:'#CDC9BA',thread:'#CDC9BA'},
 realtree:{cord:'#786A52',thread:'#574C36'},
 deadwood:{cord:'#A49A91',thread:'#958C85'},
 darkwood:{cord:'#5C5651',thread:'#4D4946'}
};
export const CAMO_BASE_SCALES={army:60,winter:60,forest:50,black:50,duck:55,'desert-duck':55,tiger:85,realtree:120,deadwood:150,darkwood:150};
export const CAMO_LIBRARY=['duck','desert-duck','forest','black','tiger','army','winter','realtree','deadwood','darkwood'].map(id=>({id,name:(id==='winter'?'Snow':id.split('-').map(s=>s[0].toUpperCase()+s.slice(1)).join(' '))+' Camo',file:id+(['realtree','darkwood','deadwood'].includes(id)?'.jpg':'.svg'),tileWidth:.60*CAMO_BASE_SCALES[id]/100,defaultScale:100,trims:CAMO_TRIMS[id]}));
export function normalizeCamoScales(settings){
 if(settings.camoScaleVersion===1)return settings;
 const scales={};
 for(const [id,value] of Object.entries(settings.camoScales||{}))if(CAMO_BASE_SCALES[id])scales[id]=value*100/CAMO_BASE_SCALES[id];
 if(settings.camoId&&CAMO_BASE_SCALES[settings.camoId]){
  settings.camoScale=(settings.camoScale??100)*100/CAMO_BASE_SCALES[settings.camoId];
  scales[settings.camoId]=settings.camoScale;
 }else settings.camoScale=100;
 settings.camoScales=scales;settings.camoScaleVersion=1;return settings;
}

export function createCamo(THREE,renderer){
 const uniforms={uCamoMap:{value:null},uCamoEnabled:{value:0},uCamoRepeat:{value:1},uCamoAspect:{value:1}};
 const cache=new Map();let queue=Promise.resolve();
 function load(id){
  const item=CAMO_LIBRARY.find(p=>p.id===id);if(!item)return Promise.reject(new Error('Unknown camo pattern'));
  const task=queue.then(async()=>{
   if(cache.has(id)){const t=cache.get(id);cache.delete(id);cache.set(id,t);return t;}
   const response=await fetch(new URL('../camo/'+item.file,import.meta.url));if(!response.ok)throw new Error('Could not load '+item.name);
   const side=Math.min(4096,renderer.capabilities.maxTextureSize);
   let blob,width,height,ratio;
   if(item.file.endsWith('.svg')){
    const doc=new DOMParser().parseFromString(await response.text(),'image/svg+xml');
    const svg=doc.documentElement,box=svg.getAttribute('viewBox').trim().split(/[ ,]+/).map(Number);
    ratio=box[2]/box[3];width=Math.round(side*Math.min(1,ratio));height=Math.round(side*Math.min(1,1/ratio));
    svg.setAttribute('width',width);svg.setAttribute('height',height);
    blob=new Blob([new XMLSerializer().serializeToString(svg)],{type:'image/svg+xml'});
   }else blob=await response.blob();
   const url=URL.createObjectURL(blob);let t;
   try{
    const img=new Image();img.src=url;await img.decode();
    if(!width){ratio=img.naturalWidth/img.naturalHeight;const scale=Math.min(1,renderer.capabilities.maxTextureSize/Math.max(img.naturalWidth,img.naturalHeight));width=Math.round(img.naturalWidth*scale);height=Math.round(img.naturalHeight*scale);}
    const c=document.createElement('canvas');c.width=width;c.height=height;c.getContext('2d').drawImage(img,0,0,width,height);
    t=new THREE.CanvasTexture(c);t.colorSpace=THREE.SRGBColorSpace;t.wrapS=t.wrapT=THREE.RepeatWrapping;t.flipY=false;
    t.anisotropy=Math.min(8,renderer.capabilities.getMaxAnisotropy());t.userData.camoAspect=ratio;
   }finally{URL.revokeObjectURL(url);}
   cache.set(id,t);
   // Retain the active texture and one alternate at most.
   for(const [key,value] of cache){if(cache.size<=2)break;if(value!==uniforms.uCamoMap.value&&value!==t){cache.delete(key);value.dispose();}}
   return t;
  });queue=task.catch(()=>{});return task;
 }
 return {uniforms,load};
}
