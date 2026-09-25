// Fixed garment-space atlas. Artwork moves and edits never repack stored charge.
export function prepareChargeGeometry(THREE,geometry,maxSize=4096){
 maxSize=Math.min(maxSize,2048);
 if(geometry.userData.orbChargeLayout)return geometry.userData.orbChargeLayout;
 const uv=geometry.getAttribute('orbPrintUv')||geometry.getAttribute('uv'),islands=geometry.getAttribute('aPrintIsland');
 if(!uv||!islands)return null;
 const bounds=new Map();
 for(let i=0;i<uv.count;i++){
  const id=islands.getX(i),u=uv.getX(i),v=uv.getY(i);let b=bounds.get(id);
  if(!b){b={minU:u,maxU:u,minV:v,maxV:v};bounds.set(id,b);}
  b.minU=Math.min(b.minU,u);b.maxU=Math.max(b.maxU,u);b.minV=Math.min(b.minV,v);b.maxV=Math.max(b.maxV,v);
 }
 const cols=Math.ceil(Math.sqrt(bounds.size)),rows=Math.ceil(bounds.size/cols);
 const tile=Math.min(256,Math.floor(maxSize/Math.max(cols,rows))),width=cols*tile,height=rows*tile,gutter=4;
 const coords=new Float32Array(uv.count*2),clamps=new Float32Array(uv.count*4);let k=0;
 for(const b of bounds.values()){
  b.left=(k%cols)*tile;b.top=Math.floor(k/cols)*tile;k++;
  b.scale=(tile-gutter*2)/Math.max(1e-8,b.maxU-b.minU,b.maxV-b.minV);
  b.x=b.left+(tile-(b.maxU-b.minU)*b.scale)/2;b.y=b.top+(tile-(b.maxV-b.minV)*b.scale)/2;
 }
 for(let i=0;i<uv.count;i++){
  const b=bounds.get(islands.getX(i));coords[i*2]=(b.x+(uv.getX(i)-b.minU)*b.scale)/width;coords[i*2+1]=(b.y+(uv.getY(i)-b.minV)*b.scale)/height;
  clamps.set([(b.left+.5)/width,(b.top+.5)/height,(b.left+tile-.5)/width,(b.top+tile-.5)/height],i*4);
 }
 geometry.setAttribute('aChargeUv',new THREE.BufferAttribute(coords,2));geometry.setAttribute('aChargeClamp',new THREE.BufferAttribute(clamps,4));
 return geometry.userData.orbChargeLayout={width,height,tile,panels:bounds.size};
}
