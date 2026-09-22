// Portable ORB files contain a versioned manifest and deduplicated image bytes.
export const FORMAT_VERSION=2;
export const LAYER_FIELDS=['id','assetId','sourceName','name','autoName','nameEdited','slot','defaultSlot','defaultMode','defaultScale','mode','inkCustom','tintCustom','solidCutoff','solidSoftness','solidInvert','defaultSolidInvert','printPattern','printSize','printAngle','printStrength','printVersion','printMarkSize','printTone','printErosion','printPixelScale','fit','sleevePreset','visible','glow','uvReactive','emission','anchor','placementSpace','placement'];
export const SETTING_FIELDS=['themeMode','blank','garmentCustom','artGlossiness','matchFabricToTheme','bg','dotGrid','gridType','gridColor','gridColorCustom','gridStroke','gridScale','gridCharSize','light','lightPower','blackLightPower','regularLightPower','nightLightPower','nightTraffic','nightPaused','lightLocked','nightGreen','nightMagenta','selfShadows','wind','inertia'];
export function pick(object,keys){return Object.fromEntries(keys.filter(k=>object[k]!==undefined).map(k=>[k,object[k]]));}
export function cleanFilename(value){return String(value||'Untitled design').replace(/[<>:"/\\|?*\x00-\x1f]/g,'').replace(/[. ]+$/,'').trim().slice(0,80)||'Untitled design';}
const fail=message=>{throw new Error(message);};
const finite=(v,min,max)=>typeof v==='number'&&Number.isFinite(v)&&v>=min&&v<=max;
const color=v=>typeof v==='string'&&/^#[a-f\d]{6}$/i.test(v);
export function validateProject(doc,{garments,slots}){
  if(!doc||doc.format!=='orb-design'||![1,FORMAT_VERSION].includes(doc.version))fail('This is not a supported ORB design file.');
  if(!garments.includes(doc.garmentId)&&doc.garmentId!=='custom')fail('This design uses an unknown garment.');
  if(typeof doc.name!=='string'||doc.name.length>80)fail('The design name is invalid.');
  if(!Array.isArray(doc.layers)||doc.layers.length>200||!Array.isArray(doc.assets)||doc.assets.length>400)fail('The design has too many layers or assets.');
  const assetIds=new Set(),layerIds=new Set();
  for(const a of doc.assets){
    if(!a||typeof a.id!=='string'||!/^[a-zA-Z\d-]{1,100}$/.test(a.id)||assetIds.has(a.id)||typeof a.path!=='string'||!/^artwork\/[a-zA-Z\d-]+\.[a-z\d]+$/i.test(a.path)||typeof a.name!=='string'||a.name.length>512||typeof a.type!=='string')fail('The artwork list is invalid.');
    assetIds.add(a.id);
  }
  for(const l of doc.layers){
    if(!l||typeof l.id!=='string'||!/^art-\d{1,12}$/.test(l.id)||layerIds.has(l.id)||!assetIds.has(l.assetId)||!slots.includes(l.slot)||!['original','ink','tint'].includes(l.mode)||typeof l.name!=='string'||l.name.length>512)fail('A design layer is invalid.');
    layerIds.add(l.id);
    if(l.placementSpace!==undefined&&l.placementSpace!=='relative-v1')fail('Unsupported placement reference.');
    const relative=l.placementSpace==='relative-v1',offsetLimit=relative?100:10;
    if(!l.placement||!finite(l.placement.x,-offsetLimit,offsetLimit)||!finite(l.placement.y,-offsetLimit,offsetLimit)||!finite(l.placement.scale,relative?.000001:.001,relative?1000:100)||!finite(l.placement.rot,-360,360))fail('A layer has an invalid position.');
    if(!finite(l.emission??100,0,10000)||!finite(l.defaultScale??100,.1,10000))fail('A layer has an invalid appearance.');
    for(const k of ['inkCustom','tintCustom'])if(l[k]!=null&&!color(l[k]))fail('A layer color is invalid.');
    for(const [k,min,max] of [['solidCutoff',0,95],['solidSoftness',1,100]])if(l[k]!==undefined&&!finite(l[k],min,max))fail('A Solid setting is invalid.');
    for(const k of ['solidInvert','defaultSolidInvert','fit','visible','glow','uvReactive','nameEdited'])if(l[k]!==undefined&&typeof l[k]!=='boolean')fail('A layer option is invalid.');
    if(l.printPattern!==undefined&&!['none','dots','lines','grain','pixel'].includes(l.printPattern))fail('A print pattern is invalid.');
    if(l.printVersion!==undefined&&l.printVersion!==2)fail('A print texture version is invalid.');
    for(const [key,min,max] of [['printSize',.001,100],['printAngle',0,180],['printStrength',0,100],['printMarkSize',0,100],['printTone',0,100],['printErosion',0,100],['printPixelScale',0,100]])if(l[key]!==undefined&&!finite(l[key],min,max))fail('A print texture setting is invalid.');
    if(l.sleevePreset!==undefined&&!['patch','full'].includes(l.sleevePreset))fail('A sleeve setting is invalid.');
    if(l.anchor){
      for(const [k,n] of [['point',3],['normal',3],['origin',2],['basis',4]])if(!Array.isArray(l.anchor[k])||l.anchor[k].length!==n||!l.anchor[k].every(v=>finite(v,-1e6,1e6)))fail('A custom placement is invalid.');
      if(typeof l.anchor.mesh!=='number')fail('A custom placement has no mesh.');
    }
  }
  const s=doc.settings;
  if(!s||!['light','dark','system'].includes(s.themeMode)||!['studio','softbox','day','night','uv'].includes(s.light)||!['square','pattern'].includes(s.gridType)||!(s.blank==='custom'||Number.isInteger(s.blank)&&s.blank>=0&&s.blank<5))fail('The design settings are invalid.');
  for(const k of ['garmentCustom','bg','gridColor','nightGreen','nightMagenta'])if(!color(s[k]))fail('A design color is invalid.');
  for(const [k,min,max] of [['artGlossiness',0,100],['lightPower',0,Number.MAX_VALUE],['blackLightPower',0,Number.MAX_VALUE],['regularLightPower',0,Number.MAX_VALUE],['gridStroke',.1,10],['gridScale',1,500],['gridCharSize',1,500],['wind',0,2]])if(!finite(s[k],min,max))fail('A design setting is out of range.');
  for(const k of ['matchFabricToTheme','dotGrid','gridColorCustom','lightLocked','selfShadows'])if(typeof s[k]!=='boolean')fail('A design option is invalid.');
  if(s.nightLightPower!==undefined&&!finite(s.nightLightPower,0,Number.MAX_VALUE))fail('City intensity is invalid.');
  if(s.nightTraffic!==undefined&&!['off','subtle','active'].includes(s.nightTraffic))fail('Traffic setting is invalid.');
  if(s.nightPaused!==undefined&&typeof s.nightPaused!=='boolean')fail('Traffic pause setting is invalid.');
  const inertia=s.inertia;
  if(!inertia||typeof inertia.enabled!=='boolean')fail('Motion settings are invalid.');
  for(const k of ['strength','ramp','settle','elasticity','overshoot','release','sensitivity','bias','sleeve','arc'])if(!finite(inertia[k],0,1000))fail('Motion settings are invalid.');
  if(doc.camera){for(const k of ['az','el','r'])if(!finite(doc.camera[k],-10000,10000))fail('Camera settings are invalid.');if(!Array.isArray(doc.camera.focus)||doc.camera.focus.length!==3||!doc.camera.focus.every(v=>finite(v,-10,10)))fail('Camera focus is invalid.');}
  if(doc.lighting){for(const k of ['reference','quaternion'])if(!Array.isArray(doc.lighting[k])||doc.lighting[k].length!==4||!doc.lighting[k].every(v=>finite(v,-1,1)))fail('Lighting settings are invalid.');}
  if(doc.regularBackdrop){if(!color(doc.regularBackdrop.bg)||!color(doc.regularBackdrop.gridColor)||typeof doc.regularBackdrop.gridColorCustom!=='boolean')fail('Background settings are invalid.');}
  if(doc.garmentId==='custom'&&doc.modelPath!=='model/garment.glb')fail('The custom garment is missing.');
  return doc;
}
export function canvasBlob(canvas){return new Promise((resolve,reject)=>canvas.toBlob(blob=>blob?resolve(blob):reject(new Error('The image could not be encoded.')),'image/png'));}
export function downloadBlob(blob,name){const url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download=name;a.click();setTimeout(()=>URL.revokeObjectURL(url),60000);}
