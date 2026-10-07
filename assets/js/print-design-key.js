// Hash actual sources and the complete visible print recipe, not garment colors
// or project IDs. Keep placement in the key even when export centers the canvas.
export async function printDesignKey(data,plans,colorFor){
  const hex=async bytes=>Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',bytes))).map(n=>n.toString(16).padStart(2,'0')).join('');
  const hashes=new Map();
  const recipe=[];
  for(const plan of plans){
    const layers=[],groups=new Map();
    for(const desc of plan.layers){
      const layer=data.doc.layers.find(l=>l.id===desc.id),record=data.records.find(r=>r.id===layer?.assetId);
      if(!record)throw Error('Missing print artwork.');
      if(!hashes.has(record.id))hashes.set(record.id,await hex(await record.blob.arrayBuffer()));
      const {id,assetId,paletteSlot,groupId,...settings}=layer;
      const {id:descriptorId,groupId:descriptorGroup,...geometry}=desc;
      if(desc.groupId&&!groups.has(desc.groupId))groups.set(desc.groupId,groups.size);
      layers.push({group:desc.groupId?groups.get(desc.groupId):null,source:hashes.get(record.id),settings,geometry,color:layer.mode==='original'?null:colorFor(layer)});
    }
    recipe.push({name:plan.name,width:plan.width,height:plan.height,inches:plan.inches,ppi:plan.ppi,layers});
  }
  const canonical=value=>Array.isArray(value)?value.map(canonical):value&&typeof value==='object'?Object.fromEntries(Object.keys(value).sort().map(k=>[k,canonical(value[k])])):value;
  return hex(new TextEncoder().encode(JSON.stringify(canonical(recipe))));
}
