// Presentation, camera, selection and labels do not change the garment design.
export function designFingerprint(doc,modelKey=null){
  const s=doc.settings||{};
  const ignored=new Set(['id','name','sourceName','thumb']);
  const layers=(doc.layers||[]).map(layer=>Object.fromEntries(Object.entries(layer).filter(([k])=>!ignored.has(k))));
  const design={garment:doc.garmentId,customFlipped:!!doc.customFlipped,modelKey,
    fabric:{blank:s.blank,garmentCustom:s.garmentCustom,matchFabricToTheme:s.matchFabricToTheme,theme:s.matchFabricToTheme?s.theme:undefined},camo:{id:s.camoId,scale:s.camoScale,scales:s.camoScales},paletteBook:s.paletteBook,lockupGroups:s.lockupGroups,artGlossiness:s.artGlossiness,layers};
  function stable(value){if(Array.isArray(value))return value.map(stable);if(value&&typeof value==='object')return Object.fromEntries(Object.keys(value).sort().filter(k=>value[k]!==undefined).map(k=>[k,stable(value[k])]));return typeof value==='number'?Math.round(value*1e6)/1e6:value;}
  return JSON.stringify(stable(design));
}
export async function modelIdentity(model){if(!model)return null;const hash=await crypto.subtle.digest('SHA-256',await model.arrayBuffer());return 'model-'+Array.from(new Uint8Array(hash),v=>v.toString(16).padStart(2,'0')).join('');}
