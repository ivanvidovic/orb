import * as THREE from 'three';
import {SVGLoader} from 'three/addons/loaders/SVGLoader.js';
import {mergeGeometries} from 'three/addons/utils/BufferGeometryUtils.js';
import {HAT_META,HAT_SCALE} from './hat-model.js?v=92';
import {patchContours,patchMatrix} from './patch-shapes.js?v=92';
import {quadTransform} from './print-layout.js?v=92';
import {placementOffsets} from './placement-space.js?v=82';
const $=id=>document.getElementById(id);
export function defaultPatch(layer){const w=HAT_META[layer.slot]?.w||.07,aspect=(layer.source?.height||1)/(layer.source?.width||1);return {shape:'rounded',width:Math.round((w*layer.placement.scale+.012)*1000),height:Math.round((w*layer.placement.scale*aspect+.012)*1000),x:layer.placement.x*.22*1000,y:-layer.placement.y*.22*1000,thickness:1.4,corner:4,color:'#A46F42',depth:65,stitch:true};}
export function parsePatchSVG(text,name='Custom outline'){
 if(text.length>1000000||/<!DOCTYPE|<!ENTITY/i.test(text))throw new Error('Use a simple SVG outline under 1 MB.');
 const doc=new DOMParser().parseFromString(text,'image/svg+xml');
 if(doc.querySelector('parsererror')||doc.documentElement.localName!=='svg')throw new Error('This file is not a valid SVG.');
 const unsupported=doc.querySelector('script,foreignObject,image,use,text,mask,clipPath,filter');
 if(unsupported)throw new Error('Outline SVGs need filled paths or basic shapes. Convert text and strokes to paths and remove images, masks and filters.');
 for(const el of doc.querySelectorAll('*'))for(const attr of el.attributes)if(/^on/i.test(attr.name)||/href/i.test(attr.name)||/url\(/i.test(attr.value))throw new Error('Use a self-contained SVG outline without external references.');
 const parsed=new SVGLoader().parse(text),shapes=[];
 for(const path of parsed.paths){const style=path.userData?.style;if(style?.fill==='none'||style?.opacity===0||style?.fillOpacity===0)continue;
  for(const sub of path.subPaths){const points=sub.getPoints(2);if(!sub.autoClose&&points.length&&points[0].distanceTo(points.at(-1))>.001)throw new Error('Close the outline path before using it as a leather patch.');}
  shapes.push(...SVGLoader.createShapes(path));
 }
 if(shapes.length!==1)throw new Error('Use one connected filled silhouette. Interior cutouts are supported; separate letters or pieces need a surrounding outline.');
 const shape=shapes[0],pts=shape.extractPoints(16),all=[pts.shape,...pts.holes],flat=all.flat(),box=new THREE.Box2().setFromPoints(flat),size=box.getSize(new THREE.Vector2());
 if(size.x<=0||size.y<=0||flat.length>4096)throw new Error('Simplify the outline to fewer than 4,096 points.');
 return {name:String(name).slice(0,128),aspect:size.y/size.x,contours:all.map(loop=>loop.map(v=>[+(Math.max(0,Math.min(1,(v.x-box.min.x)/size.x))).toFixed(7),+(Math.max(0,Math.min(1,(v.y-box.min.y)/size.y))).toFixed(7)]))};
}
function makeShape(contours){const shapes=contours.map(loop=>new THREE.Shape(loop.map(p=>new THREE.Vector2(...p))));shapes[0].holes=shapes.slice(1).map(s=>new THREE.Path(s.getPoints()));return shapes[0];}
function subdividedShape(contours,width,height){
 const base=new THREE.ShapeGeometry(makeShape(contours),16),g=base.toNonIndexed(),a=g.attributes.position,points=[];
 function tri(a,b,c,depth=0){const lengths=[Math.hypot((a.x-b.x)*width,(a.y-b.y)*height),Math.hypot((b.x-c.x)*width,(b.y-c.y)*height),Math.hypot((c.x-a.x)*width,(c.y-a.y)*height)];
  if(Math.max(...lengths)<=.004||depth>=8){points.push(a.x,a.y,b.x,b.y,c.x,c.y);return;}
  const ab=a.clone().lerp(b,.5),bc=b.clone().lerp(c,.5),ca=c.clone().lerp(a,.5);tri(a,ab,ca,depth+1);tri(ab,b,bc,depth+1);tri(ca,bc,c,depth+1);tri(ab,bc,ca,depth+1);
 }
 for(let i=0;i<a.count;i+=3)tri(...[i,i+1,i+2].map(j=>new THREE.Vector2(a.getX(j),a.getY(j))));base.dispose();g.dispose();return points;
}
function leatherTexture(){
 const size=256,data=new Uint8Array(size*size*4);let seed=802713;
 const rand=()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296;};
 for(let i=0;i<size*size;i++){const v=194+rand()*42;data.set([v,v,v,255],i*4);}
 const t=new THREE.DataTexture(data,size,size,THREE.RGBAFormat);t.colorSpace=THREE.NoColorSpace;t.wrapS=t.wrapT=THREE.RepeatWrapping;t.magFilter=THREE.LinearFilter;t.minFilter=THREE.LinearMipmapLinearFilter;t.generateMipmaps=true;t.needsUpdate=true;return t;
}
function patchMaterial(texture){
 const m=new THREE.MeshStandardMaterial({color:'#a46f42',roughness:.88,side:THREE.DoubleSide});
 const u={pArt:{value:null},pHas:{value:0},pCoverage:{value:0},pMap:{value:new THREE.Matrix3()},pDepth:{value:.65},pGrain:{value:texture},pRepeat:{value:new THREE.Vector2(5,3)}};
 m.userData.patchUniforms=u;m.onBeforeCompile=sh=>{
  Object.assign(sh.uniforms,u);sh.vertexShader='varying vec2 pUv;\n'+sh.vertexShader.replace('#include <begin_vertex>','#include <begin_vertex>\npUv=uv;');
  sh.fragmentShader='varying vec2 pUv;uniform sampler2D pArt,pGrain;uniform mat3 pMap;uniform vec2 pRepeat;uniform float pHas,pCoverage,pDepth;float pMask(vec2 q){if(pHas<.5||min(q.x,q.y)<0.0||max(q.x,q.y)>1.0)return 0.0;vec4 a=texture2D(pArt,q);return pCoverage>.5?a.r:a.a;}\n'+sh.fragmentShader;
  sh.fragmentShader=sh.fragmentShader.replace('#include <map_fragment>',`#include <map_fragment>
   float engraving=pMask((pMap*vec3(pUv,1.0)).xy);
   float grain=texture2D(pGrain,pUv*pRepeat).r;
   diffuseColor.rgb*=mix(.94,1.04,grain);
   diffuseColor.rgb*=1.0-engraving*(.4+.46*pDepth);`);
  sh.fragmentShader=sh.fragmentShader.replace('#include <normal_fragment_maps>',`#include <normal_fragment_maps>
   vec3 dp1=dFdx(vViewPosition),dp2=dFdy(vViewPosition);
   vec3 r1=cross(dp2,normal),r2=cross(normal,dp1);
   float det=dot(dp1,r1);
   if(abs(det)>.0000000001){float relief=(grain-.5)*.0009-engraving*.00012*pDepth;vec3 grad=sign(det)*(dFdx(relief)*r1+dFdy(relief)*r2);normal=normalize(abs(det)*normal-grad);}`);
 };
 m.customProgramCacheKey=()=> 'orb-leather-92';return m;
}
export function createLeatherPatches(){
 const cache=new Map(),grain=leatherTexture();let parent=null;
 const dispose=entry=>{entry.group.removeFromParent();entry.group.traverse(m=>{if(m.isMesh){m.geometry.dispose();m.material.dispose();}});};
 const clear=()=>{for(const entry of cache.values())dispose(entry);cache.clear();parent=null;};
 function build(layer,q,root,order){
  const p=layer.patch,contours=patchContours(p),matrix=patchMatrix(p,q),sample=root.userData.hatSampler,group=new THREE.Group();group.name='Leather · '+layer.name;group.userData.orbPatch=true;
  let outside=false;const offset=(p.thickness/1000+.0002+order*.00005)*HAT_SCALE;
  function point(u,v,top=true){const hit=sample(q,[matrix[4]+matrix[0]*u,matrix[5]+matrix[3]*v]);if(!hit)throw new Error('Patch surface unavailable.');outside ||= !hit.inside;return {p:hit.point.addScaledVector(hit.normal,top?offset:.0001*HAT_SCALE),n:hit.normal};}
  const coords=subdividedShape(contours,p.width/1000,p.height/1000),positions=[],normals=[],uv=[];
  for(let i=0;i<coords.length;i+=2){const u=coords[i],v=coords[i+1],s=point(u,v);positions.push(...s.p.toArray());normals.push(...s.n.toArray());uv.push(u,v);}
  for(let i=0;i<positions.length;i+=9){const a=new THREE.Vector3().fromArray(positions,i),b=new THREE.Vector3().fromArray(positions,i+3),c=new THREE.Vector3().fromArray(positions,i+6),n=new THREE.Vector3().fromArray(normals,i);if(b.sub(a).cross(c.sub(a)).dot(n)<0){for(const [data,stride,offset] of [[positions,3,i],[normals,3,i],[uv,2,i/3*2]])for(let k=0;k<stride;k++){const j=offset+stride+k,t=data[j];data[j]=data[j+stride];data[j+stride]=t;}}}
  const geo=new THREE.BufferGeometry();geo.setAttribute('position',new THREE.Float32BufferAttribute(positions,3));geo.setAttribute('normal',new THREE.Float32BufferAttribute(normals,3));geo.setAttribute('uv',new THREE.Float32BufferAttribute(uv,2));
  const material=patchMaterial(grain),face=new THREE.Mesh(geo,material);face.userData.orbPatch=true;face.castShadow=face.receiveShadow=true;group.add(face);
  const sides=[];
  for(const loop of contours){for(let i=0;i<loop.length;i++){const a=loop[i],b=loop[(i+1)%loop.length],steps=Math.max(1,Math.ceil(Math.hypot((a[0]-b[0])*p.width,(a[1]-b[1])*p.height)/3));for(let j=0;j<steps;j++){const v=[j/steps,(j+1)/steps].map(t=>[a[0]+(b[0]-a[0])*t,a[1]+(b[1]-a[1])*t]),at=point(...v[0]).p,bt=point(...v[1]).p,ab=point(...v[0],false).p,bb=point(...v[1],false).p;for(const vert of [at,ab,bt,bt,ab,bb])sides.push(...vert.toArray());}}}
  const edgeGeo=new THREE.BufferGeometry();edgeGeo.setAttribute('position',new THREE.Float32BufferAttribute(sides,3));edgeGeo.computeVertexNormals();const edge=new THREE.Mesh(edgeGeo,new THREE.MeshStandardMaterial({color:p.color,roughness:.98,side:THREE.DoubleSide}));edge.userData.orbPatch=true;edge.castShadow=edge.receiveShadow=true;group.add(edge);
  if(p.stitch){const gs=[];
   for(const loop of contours){
    const clockwise=THREE.ShapeUtils.isClockWise(loop.map(v=>new THREE.Vector2(...v))),hole=loop!==contours[0],direction=(clockwise?-1:1)*(hole?-1:1),edges=[];let perimeter=0;
    for(let i=0;i<loop.length;i++){const a=loop[i],b=loop[(i+1)%loop.length],dx=(b[0]-a[0])*p.width,dy=(b[1]-a[1])*p.height,len=Math.hypot(dx,dy);if(len<.00001)continue;edges.push({a,b,dx,dy,len,start:perimeter});perimeter+=len;}
    const along=distance=>{const d=distance%perimeter,e=edges.find(e=>d<e.start+e.len)||edges.at(-1),t=(d-e.start)/e.len;return point(e.a[0]+(e.b[0]-e.a[0])*t-e.dy/e.len*direction*1.5/p.width,e.a[1]+(e.b[1]-e.a[1])*t+e.dx/e.len*direction*1.5/p.height).p;};
    const count=Math.max(1,Math.round(perimeter/3.1)),step=perimeter/count;
    for(let i=0;i<count;i++){const pts=Array.from({length:5},(_,k)=>along(i*step+k/4*step*.58));gs.push(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts),4,.00014*HAT_SCALE,4,false));}
   }
   if(gs.length){const merged=mergeGeometries(gs),stitches=new THREE.Mesh(merged,new THREE.MeshStandardMaterial({color:'#D6BD95',roughness:1}));stitches.userData.orbPatch=true;group.add(stitches);gs.forEach(g=>g.dispose());}
  }
  root.add(group);return {group,material,edgeMaterial:edge.material,key:'',outside,order};
 }
 function update(root,layers,profiles,source){
  let changed=false;
  if(root!==parent){clear();parent=root;}
  const live=new Set();if(!root?.userData.hat)return;
  for(const [index,layer] of layers.entries()){
   if(layer.decoration!=='leather'||!layer.patch||!profiles[layer.slot])continue;
   live.add(layer.id);const q=profiles[layer.slot],p=layer.patch,key=JSON.stringify([layer.slot,p.shape,p.outline,p.width,p.height,p.x,p.y,p.corner,p.thickness,p.stitch,layers.length-index]);let entry=cache.get(layer.id);
   if(!entry||entry.key!==key){if(entry)dispose(entry);entry=build(layer,q,root,layers.length-index);entry.key=key;cache.set(layer.id,entry);changed=true;}
   entry.group.visible=layer.visible;const image=source(layer),u=entry.material.userData.patchUniforms;
   entry.material.color.set(p.color);entry.edgeMaterial.color.set(p.color).multiplyScalar(.55);u.pDepth.value=p.depth/100;u.pRepeat.value.set(p.width/13,p.height/13);u.pHas.value=image?1:0;
   if(image){u.pArt.value=image.texture;u.pCoverage.value=image.coverageOnly?1:0;const m=quadTransform(layer,q,image,HAT_META[layer.slot],{offset:placementOffsets(layer,q)}),art=new THREE.Matrix3().set(m[0],m[2],m[4],m[1],m[3],m[5],0,0,1),pM=patchMatrix(p,q);u.pMap.value.copy(art).invert().multiply(new THREE.Matrix3().set(pM[0],pM[2],pM[4],pM[1],pM[3],pM[5],0,0,1));}
   layer.patchOutside=entry.outside;
  }
  for(const [id,e] of cache)if(!live.has(id)){dispose(e);cache.delete(id);changed=true;}
  return changed;
 }
 return {update,clear};
}
export function installPatchControls(api){
 const host=$('hatDecoration');host.innerHTML=`<label class="hat-guide-toggle"><input id="hatPlacementGuide" type="checkbox">Suggested area <span id="hatAreaSize"></span></label><div class="patch-modes" role="group" aria-label="Decoration"><button type="button" data-decoration="print">Print</button><button type="button" data-decoration="leather">Leather patch</button></div><div class="patch-controls" hidden>
 <div class="patch-shape-row"><select id="patchShape" aria-label="Patch shape"><option value="rounded">Rectangle</option><option value="oval">Oval</option><option value="shield">Shield</option><option value="custom">Custom SVG</option></select><button id="patchLibrary" type="button">Library SVG</button><button id="patchUpload" type="button">Upload SVG</button></div><input id="patchShapeFile" type="file" accept=".svg,image/svg+xml" hidden>
 <p id="patchOutlineName"></p><div class="patch-grid">
 ${[['width','Width (mm)',2,400,.5],['height','Height (mm)',2,400,.5],['x','Patch horizontal (mm)',-300,300,.5],['y','Patch vertical (mm)',-300,300,.5],['thickness','Thickness (mm)',.2,5,.1],['corner','Corners (mm)',0,50,.5]].map(([key,label,min,max,step])=>`<label>${label}<input type="number" data-patch="${key}" min="${min}" max="${max}" step="${step}"></label>`).join('')}
 <label>Leather color<input id="patchColor" type="color" value="#a46f42" data-patch="color"></label><label>Engraving depth<input type="range" min="0" max="100" step="1" data-patch="depth"></label></div>
 <label class="patch-stitch"><input type="checkbox" data-patch="stitch">Stitched edge</label><p>Artwork scale and position below adjust the engraving independently. Solid settings control its mask.</p><p id="patchNotice" class="patch-message" role="status"></p></div>`;
 $('hatPlacementGuide').onchange=e=>api.guide(e.target.checked);
 let editing=null;
 function sync(){const layer=api.getLayer(),hat=api.isHat();host.hidden=!hat||!layer;if(!hat||!layer)return;$('hatAreaSize').textContent=HAT_META[layer.slot].area.map(n=>Math.round(n*1000)).join(' × ')+' mm';const leather=layer.decoration==='leather';host.querySelector('.patch-controls').hidden=!leather;for(const b of host.querySelectorAll('[data-decoration]'))b.setAttribute('aria-pressed',String(b.dataset.decoration===(layer.decoration||'print')));if(!leather)return;
  const p=layer.patch;for(const input of host.querySelectorAll('[data-patch]')){const key=input.dataset.patch;if(input.type==='checkbox')input.checked=!!p[key];else input.value=p[key];input.disabled=key==='corner'&&p.shape!=='rounded';}
  $('patchShape').value=p.shape;$('patchOutlineName').textContent=p.shape==='custom'?p.outline?.name||'Custom SVG':'';$('patchNotice').textContent=layer.patchOutside?'Patch extends beyond this panel. Check its edges in the preview.':'';
 }
 function change(){api.changed();}
 for(const b of host.querySelectorAll('[data-decoration]'))b.onclick=()=>{const l=api.getLayer();if(!l)return;api.before();l.decoration=b.dataset.decoration;if(l.decoration==='leather'){l.patch ||= defaultPatch(l);if(l.mode==='original'){l.mode='ink';l.solidMaskSource='auto';}}change();api.sync();sync();};
 $('patchShape').onchange=e=>{const l=api.getLayer();if(!l?.patch)return;if(e.target.value==='custom'&&!l.patch.outline){$('patchShapeFile').click();sync();return;}api.before();l.patch.shape=e.target.value;if(l.patch.shape==='custom')l.patch.height=+(l.patch.width*l.patch.outline.aspect).toFixed(1);change();sync();};
 for(const input of host.querySelectorAll('[data-patch]')){input.addEventListener('input',()=>{const l=api.getLayer();if(!l?.patch)return;const key=input.dataset.patch,v=input.type==='checkbox'?input.checked:input.type==='color'?input.value:Number(input.value);if(typeof v==='number'&&(!Number.isFinite(v)||v<Number(input.min)||v>Number(input.max)))return;if(editing!==input){api.before();editing=input;}l.patch[key]=v;change();});for(const event of ['change','blur'])input.addEventListener(event,()=>editing=null);}
 async function useShape(entry){const blob=entry.originalFile;if(!blob||!(/svg/.test(blob.type)||/\.svg$/i.test(entry.sourceName)))throw new Error('Choose an SVG for the leather boundary.');const outline=parsePatchSVG(await blob.text(),entry.sourceName);const l=api.getLayer();if(!l)return;api.before();l.decoration='leather';l.patch ||= defaultPatch(l);Object.assign(l.patch,{shape:'custom',outline,height:Math.max(2,Math.min(400,+(l.patch.width*outline.aspect).toFixed(1)))});change();api.sync();sync();api.status('Custom patch outline added.');}
 $('patchUpload').onclick=()=>{$('patchShapeFile').value='';$('patchShapeFile').click();};$('patchLibrary').onclick=api.library;
 $('patchShapeFile').onchange=async()=>{const file=$('patchShapeFile').files[0];if(!file)return;try{parsePatchSVG(await file.text(),file.name);const e=await api.decode(file);await useShape(await api.register(e));}catch(e){api.status(e.message);$('patchNotice').textContent=e.message;}finally{$('patchShapeFile').value='';}};
 return {sync,useShape};
}
