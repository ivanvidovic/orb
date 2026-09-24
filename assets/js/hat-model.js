import * as THREE from 'three';
import {mergeGeometries} from 'three/addons/utils/BufferGeometryUtils.js';
export const HAT_ID='y7005-cap';
export const HAT_META={
 hatfront:{label:'Front panel',side:'Front',w:.085,origin:[0,-.038],normal:[0,0,1],angles:[0,1.30],area:[.095,.045]},
 hatleft:{label:'Left side',side:'Front',w:.05,origin:[0,-.046],normal:[1,0,0],angles:[Math.PI/2,1.40],area:[.065,.035]},
 hatright:{label:'Right side',side:'Front',w:.05,origin:[0,-.046],normal:[-1,0,0],angles:[-Math.PI/2,1.40],area:[.065,.035]},
 hatback:{label:'Back panel',side:'Back',w:.065,origin:[0,-.072],normal:[0,0,-1],angles:[Math.PI,1.30],area:[.075,.027]},
 hatbill:{label:'Upper bill',side:'Front',w:.075,origin:[0,.139],normal:[0,1,0],angles:[0,.18],area:[.09,.045]},
 hatunderbill:{label:'Under bill',side:'Inside',w:.075,origin:[0,-.139],normal:[0,-1,0],angles:[0,2.95],area:[.09,.045]},
 hatcrown:{label:'Crown',side:'Back',w:.075,origin:[0,-.003],normal:[0,1,0],angles:[0,.14],area:[.085,.07]},
 hatinside:{label:'Inside front',side:'Inside',w:.045,origin:[0,-.038],normal:[0,0,-1],angles:[Math.PI,2.52],area:[.06,.035]},
 hatband:{label:'Sweatband',side:'Inside',w:.04,origin:[0,-.014],normal:[0,0,-1],angles:[Math.PI,2.63],area:[.06,.013]}
};
export const HAT_KEYS=Object.keys(HAT_META),HAT_SCALE=3;
export const isHat=id=>id===HAT_ID;
const ids=Object.fromEntries(HAT_KEYS.map((k,i)=>[k,i+1]));
const mapPoint=(id,x,y,z)=>id==='hatleft'?[-z,-y]:id==='hatright'?[z,-y]:['hatback','hatinside','hatband'].includes(id)?[-x,-y]:['hatbill','hatcrown'].includes(id)?[x,z]:id==='hatunderbill'?[x,-z]:[x,-y];
function partRole(name,material){
 if(/Black|metal|hardware|webbing/i.test(material.name))return 'fixed';
 if(name.startsWith('Underbill')||name.startsWith('Bill matching'))return 'under';
 if(name.startsWith('Bill ')||name.startsWith('Continuous rounded fabric bill'))return 'bill';
 return 'crown';
}
function surfaces(name,mat){
 const inner=/Interior cotton/.test(mat.name);
 if(name.startsWith('Front print panel'))return inner?['hatinside']:['hatfront'];
 if(name.startsWith('Left side panel'))return inner?[]:['hatright'];
 if(name.startsWith('Right side panel'))return inner?[]:['hatleft'];
 if(/^(Left|Right) top panel/.test(name))return inner?[]:['hatback','hatcrown'];
 if(name.startsWith('Bill cotton upper'))return ['hatbill'];
 if(name.startsWith('Bill matching'))return ['hatunderbill'];
 if(name.startsWith('Padded folded sweatband'))return ['hatband'];
 return [];
}
function neutralTexture(source,cache){
 if(!source)return null;if(cache.has(source))return cache.get(source);
 const im=source.image,c=document.createElement('canvas');c.width=im.width;c.height=im.height;
 const ctx=c.getContext('2d',{willReadFrequently:true});ctx.drawImage(im,0,0);const pixels=ctx.getImageData(0,0,c.width,c.height),d=pixels.data;
 let mean=0;for(let i=0;i<d.length;i+=4)mean+=(d[i]+d[i+1]+d[i+2])/3;mean/=d.length/4;
 for(let i=0;i<d.length;i+=4){const v=Math.max(180,Math.min(255,235+((d[i]+d[i+1]+d[i+2])/3-mean)*1.4));d[i]=d[i+1]=d[i+2]=v;}
 ctx.putImageData(pixels,0,0);const t=source.clone();t.image=c;t.needsUpdate=true;cache.set(source,t);return t;
}
export function prepareHat(root,{patchMaterial,depthMaterial,anisotropy=8}){
 root.updateMatrixWorld(true);const buckets=new Map(),textures=new Map();let tris=0;
 root.traverse(o=>{
  if(!o.isMesh)return;
  const g=o.geometry.clone();g.applyMatrix4(o.matrixWorld);
  const mats=Array.isArray(o.material)?o.material:[o.material],groups=g.groups.length?g.groups:[{start:0,count:g.index?.count||g.attributes.position.count,materialIndex:0}];
  for(const group of groups){const mat=mats[group.materialIndex],name=o.name.replace(/_\d+$/,'').replace(/_/g,' '),charts=surfaces(name,mat),role=partRole(name,mat),p=g.attributes.position;
   const parts=new Map();
   for(let i=group.start;i<group.start+group.count;i+=3){const tri=[0,1,2].map(k=>g.index?g.index.getX(i+k):i+k);let chart=charts[0]||'';
    if(charts.length===2){const y=tri.reduce((s,k)=>s+p.getY(k),0)/3,z=tri.reduce((s,k)=>s+p.getZ(k),0)/3;chart=z<-.042&&y<.089?'hatback':'hatcrown';}
    if(chart==='hatband'&&tri.reduce((s,k)=>s+p.getZ(k),0)/3<.055)chart='';
    if(!parts.has(chart))parts.set(chart,[]);parts.get(chart).push(...tri);
   }
   for(const [chart,indices] of parts){
    const geom=new THREE.BufferGeometry(),remap=new Map(),used=[],index=indices.map(i=>{if(!remap.has(i)){remap.set(i,used.length);used.push(i);}return remap.get(i);});
    for(const [attr,n] of [['position',3],['normal',3],['uv',2],['uv1',2]]){const src=g.getAttribute(attr)||g.getAttribute(attr==='uv1'?'uv':attr),data=new Float32Array(used.length*n);if(src)for(let i=0;i<used.length;i++)for(let k=0;k<n;k++)data[i*n+k]=src.getComponent(used[i],k);geom.setAttribute(attr,new THREE.BufferAttribute(data,n));}
    geom.setIndex(index);const pos=geom.attributes.position,uvs=new Float32Array(pos.count*2);
    for(let i=0;i<pos.count;i++){const x=pos.getX(i),y=pos.getY(i),z=pos.getZ(i);uvs.set(mapPoint(chart,x,y,z),2*i);pos.setXYZ(i,x*HAT_SCALE,.19+y*HAT_SCALE,(z-.031)*HAT_SCALE);}
    geom.setAttribute('orbPrintUv',new THREE.BufferAttribute(uvs,2));geom.setAttribute('aPrintIsland',new THREE.BufferAttribute(new Float32Array(pos.count).fill(ids[chart]||0),1));
    const key=mat.uuid+':'+role;if(!buckets.has(key))buckets.set(key,{mat,role,geometries:[]});buckets.get(key).geometries.push(geom);tris+=indices.length/3;
   }
  }g.dispose();
 });
 const out=new THREE.Group(),profiles={};out.name='Y7005 · revised master';out.userData.hat=true;
 for(const {mat,role,geometries} of buckets.values()){
  const g=mergeGeometries(geometries);geometries.forEach(g=>g.dispose());
  const pos=g.attributes.position,n=pos.count;
  g.setAttribute('aMotionAnchor',pos.clone());g.setAttribute('aFlow',new THREE.BufferAttribute(new Float32Array(n),1));
  g.setAttribute('aArtworkUv',new THREE.BufferAttribute(new Float32Array(n*2).fill(-1),2));g.setAttribute('aArtworkClamp',new THREE.BufferAttribute(new Float32Array(n*4),4));
  const material=mat.clone(),meshId=100+out.children.length;
  material.side=THREE.DoubleSide;material.userData.orbMeshId=meshId;material.userData.orbTintable=role!=='fixed';material.userData.hatRole=role;
  material.userData.orbBaseColor=role==='fixed'?material.color.toArray():[1,1,1];
  if(role!=='fixed'){material.map=neutralTexture(material.map,textures);material.color.set('#b29268');}
  for(const t of Object.values(material))if(t?.isTexture)t.anisotropy=anisotropy;
  patchMaterial(material);const mesh=new THREE.Mesh(g,material);mesh.name=role+' · '+mat.name;mesh.userData.orbMeshId=meshId;mesh.castShadow=mesh.receiveShadow=true;mesh.customDepthMaterial=depthMaterial();out.add(mesh);
  const present=new Set(g.attributes.aPrintIsland.array);
  for(const slot of HAT_KEYS)if(present.has(ids[slot])){const def=HAT_META[slot];profiles[slot]={origin:[...def.origin],basis:[1,0,0,1],offsetScale:[.22,.22],point:[0,.35,0],normal:def.normal,mesh:meshId,island:ids[slot],hat:true};}
 }
 // Triangles are sampled in calibrated print space, shared by focus cameras,
 // guides and conforming patches. Material UVs are kept entirely independent.
 const sample=createHatSampler(out);
 for(const [slot,q] of Object.entries(profiles)){const s=sample(q,q.origin);if(s)q.point=s.point.toArray();}
 out.userData.halfWidth=.27;out.userData.hatSampler=sample;out.userData.hatProfiles=profiles;
 return {group:out,profiles,tris,size:new THREE.Box3().setFromObject(out).getSize(new THREE.Vector3())};
}
export function createHatSampler(group){
 const charts=new Map();
 group.traverse(mesh=>{if(!mesh.isMesh||mesh.userData.orbPatch)return;const g=mesh.geometry,uv=g.attributes.orbPrintUv,part=g.attributes.aPrintIsland;if(!uv||!part)return;
  const p=g.attributes.position,n=g.attributes.normal;
  for(let i=0;i<(g.index?.count||p.count);i+=3){const v=[0,1,2].map(k=>g.index?g.index.getX(i+k):i+k),id=part.getX(v[0]);if(!id)continue;const key=mesh.userData.orbMeshId+':'+id;
   if(!charts.has(key))charts.set(key,[]);
   const a=v.map(j=>new THREE.Vector2(uv.getX(j),uv.getY(j))),det=(a[1].x-a[0].x)*(a[2].y-a[0].y)-(a[2].x-a[0].x)*(a[1].y-a[0].y);if(Math.abs(det)<1e-12)continue;
   charts.get(key).push({a,det,p:v.map(j=>new THREE.Vector3().fromBufferAttribute(p,j)),n:v.map(j=>new THREE.Vector3().fromBufferAttribute(n,j)),cx:(a[0].x+a[1].x+a[2].x)/3,cy:(a[0].y+a[1].y+a[2].y)/3});
  }
 });
 // Grid lookup makes patch edits independent of the full hat's mesh density.
 const grids=new Map(),borders=new Map();for(const [key,ts] of charts){const edges=new Map();for(const t of ts)for(let i=0;i<3;i++){const j=(i+1)%3,k=[t.a[i],t.a[j]].map(v=>v.toArray().map(n=>n.toFixed(7)).join(",")).sort().join("/");if(edges.has(k))edges.get(k).count++;else edges.set(k,{t,i,j,count:1});}borders.set(key,[...edges.values()].filter(e=>e.count===1));const cells=new Map();for(const t of ts){const x0=Math.floor(Math.min(...t.a.map(a=>a.x))*250),x1=Math.floor(Math.max(...t.a.map(a=>a.x))*250),y0=Math.floor(Math.min(...t.a.map(a=>a.y))*250),y1=Math.floor(Math.max(...t.a.map(a=>a.y))*250);for(let x=x0;x<=x1;x++)for(let y=y0;y<=y1;y++){const k=x+','+y;if(!cells.has(k))cells.set(k,[]);cells.get(k).push(t);}}grids.set(key,cells);}
 return (q,[x,y])=>{
  const key=q.mesh+':'+q.island,ts=charts.get(key);if(!ts)return null;
  const candidates=grids.get(key).get(Math.floor(x*250)+','+Math.floor(y*250))||[];let chosen=null,weights=null;
  for(const t of candidates){const [a,b,c]=t.a,dx=x-a.x,dy=y-a.y,u=(dx*(c.y-a.y)-dy*(c.x-a.x))/t.det,v=((b.x-a.x)*dy-(b.y-a.y)*dx)/t.det;if(u>=-1e-5&&v>=-1e-5&&u+v<=1.00001){chosen=t;weights=[1-u-v,u,v];break;}}
  const inside=!!chosen;
  let boundary=null;
  if(!chosen){
   let best=Infinity;
   for(const {t,i,j} of borders.get(key)){const a=t.a[i],b=t.a[j],dx=b.x-a.x,dy=b.y-a.y,f=Math.max(0,Math.min(1,((x-a.x)*dx+(y-a.y)*dy)/(dx*dx+dy*dy||1))),bx=a.x+f*dx,by=a.y+f*dy,d=(x-bx)**2+(y-by)**2;if(d<best){best=d;chosen=t;weights=[0,0,0];weights[i]=1-f;weights[j]=f;boundary=[bx,by];}}
   if(!chosen)return null;
  }
  const point=new THREE.Vector3(),normal=new THREE.Vector3();for(let i=0;i<3;i++){point.addScaledVector(chosen.p[i],weights[i]);normal.addScaledVector(chosen.n[i],weights[i]);}
  const axis=new THREE.Vector3(...q.normal);
  if(normal.dot(axis)<0)normal.negate();normal.normalize();
  if(boundary){
   // Extend the nearest panel edge tangentially. Extrapolating barycentric
   // normals from tiny boundary triangles creates spikes on oversized patches.
   const dx=(x-boundary[0])*HAT_SCALE,dy=(y-boundary[1])*HAT_SCALE,id=q.island;
   const delta=id===ids.hatleft?new THREE.Vector3(0,-dy,-dx):id===ids.hatright?new THREE.Vector3(0,-dy,dx):[ids.hatback,ids.hatinside,ids.hatband].includes(id)?new THREE.Vector3(-dx,-dy,0):[ids.hatbill,ids.hatcrown].includes(id)?new THREE.Vector3(dx,0,dy):id===ids.hatunderbill?new THREE.Vector3(dx,0,-dy):new THREE.Vector3(dx,-dy,0);
   point.add(delta).addScaledVector(axis,-delta.dot(normal)/Math.max(.25,normal.dot(axis)));
  }
  return {point,normal,inside};
 };
}
export function refreshHatGuide(root,slot,visible){
 let guide=root?.getObjectByName('Hat placement guide');
 if(!root?.userData.hat)return;
 if(!visible||!HAT_META[slot]){if(guide)guide.visible=false;return;}
 if(guide?.userData.slot===slot){guide.visible=true;return;}
 if(guide){guide.removeFromParent();guide.geometry.dispose();guide.material.dispose();}
 const q=root.userData.hatProfiles[slot],m=HAT_META[slot],points=[];
 const corners=[[-1,-1],[1,-1],[1,1],[-1,1],[-1,-1]];
 for(let edge=0;edge<4;edge++)for(let i=0;i<24;i++){const t=i/24,a=corners[edge],b=corners[edge+1],hit=root.userData.hatSampler(q,[q.origin[0]+(a[0]+(b[0]-a[0])*t)*m.area[0]/2,q.origin[1]+(a[1]+(b[1]-a[1])*t)*m.area[1]/2]);points.push(hit.point.addScaledVector(hit.normal,.001));}
 points.push(points[0].clone());guide=new THREE.Line(new THREE.BufferGeometry().setFromPoints(points),new THREE.LineDashedMaterial({color:'#95c8ff',dashSize:.008,gapSize:.005,depthTest:true,transparent:true,opacity:.8}));guide.name='Hat placement guide';guide.userData={orbGuide:true,slot};guide.computeLineDistances();root.add(guide);
}
