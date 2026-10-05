// Standard GLB material partitions retain the original Studio print topology.
// Other glTF viewers render the ordinary primitives directly.
export async function restoreGarmentTopology(gltf,THREE){
  const tasks=[];
  gltf.scene.traverse(group=>{
    const association=gltf.parser.associations.get(group);
    if(!group.isGroup||association?.meshes===undefined)return;
    const parts=gltf.parser.json.meshes[association.meshes].extras?.orbStudioParts;
    if(!parts)return;
    tasks.push((async()=>{
      const children=[...group.children],meshes=[];
      for(const part of parts){
        const sources=children.slice(part.first,part.first+part.count);
        if(sources.length!==part.count||sources.some(o=>!o.isMesh))throw new Error('Invalid garment material partition.');
        if(part.count===1){meshes.push(sources[0]);continue;}
        const geometry=sources[0].geometry.clone();
        geometry.setIndex(await gltf.parser.getDependency('accessor',part.index));
        geometry.clearGroups();
        for(const range of part.groups)geometry.addGroup(range.start,range.count,range.materialIndex);
        const mesh=new THREE.Mesh(geometry,sources.map(o=>o.material));
        mesh.name=sources[0].name;
        meshes.push(mesh);
        for(const source of sources)source.geometry.dispose();
      }
      const primitiveCount=parts.reduce((n,p)=>Math.max(n,p.first+p.count),0);
      group.clear();for(const mesh of [...meshes,...children.slice(primitiveCount)])group.add(mesh);
    })());
  });
  await Promise.all(tasks);
}
