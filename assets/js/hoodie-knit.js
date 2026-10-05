// v0.9.18: surface-UV knit, fixed physical yarn scale; no camera input.
let ready,normal,detail;
export function loadHoodieKnit(THREE){
 return ready ||= (async()=>{
  const loader=new THREE.TextureLoader();
  [normal,detail]=await Promise.all(['normal','detail'].map(kind=>loader.loadAsync(new URL('../textures/hoodie-jersey-'+kind+'-v18.png',import.meta.url).href)));
  for(const t of [normal,detail]){t.wrapS=t.wrapT=THREE.RepeatWrapping;t.colorSpace=THREE.NoColorSpace;t.anisotropy=8;}
 })().catch(e=>{ready=null;throw e;});
}
export function configureHoodieKnit(mat,id){
 if(!id?.endsWith('-hoodie')||!mat.map||!mat.normalMap)return;
 // Median native UV-to-surface metric, measured separately for both models.
 mat.userData.orbKnit={metresPerUV:id==='womens-hoodie'?1.50:1.896,female:id==='womens-hoodie'?1:0};
}
export function patchHoodieKnit(sh,mat,THREE){
 const k=mat.userData.orbKnit;if(!k)return;
 Object.assign(sh.uniforms,{uKnitNormal:{value:normal},uKnitDetail:{value:detail},uKnitMetric:{value:k.metresPerUV},uKnitFemale:{value:k.female}});
 sh.fragmentShader=`uniform sampler2D uKnitNormal;uniform sampler2D uKnitDetail;uniform float uKnitMetric;uniform float uKnitFemale;
 float knitMask(vec2 uv){
  // Atlas regions for body, sleeves, hood and pocket. Rib/edge panels excluded.
  float male=1.0-smoothstep(.6888,.6915,uv.y);
  float female=max(1.0-smoothstep(.8128,.8158,uv.y),(1.0-smoothstep(.2147,.217,uv.x))*(1.0-smoothstep(.9325,.935,uv.y)));
  return mix(male,female,uKnitFemale);
 }
 vec2 knitUv(vec2 uv){return uv*uKnitMetric/vec2(.016,.012);}
 `+sh.fragmentShader;
 // Multiplication is before the print compositing block, so artwork colors stay intact.
 sh.fragmentShader=sh.fragmentShader.replace('#include <map_fragment>',`#include <map_fragment>
 diffuseColor.rgb*=1.0+knitMask(vMapUv)*(texture2D(uKnitDetail,knitUv(vMapUv)).r-.5)*.7;`);
 const chunk=THREE.ShaderChunk.normal_fragment_maps.replace('mapN.xy *= normalScale;',`mapN.xy *= normalScale;
 float km=knitMask(vNormalMapUv);
 vec3 kn=texture2D(uKnitNormal,knitUv(vNormalMapUv)).xyz*2.0-1.0;
 // Retain construction ridges, reduce old fuzzy micro-relief on the main cloth.
 float construction=smoothstep(.04,.16,length(mapN.xy));
 mapN.xy*=mix(1.0,mix(.2,1.0,construction),km);
 mapN=normalize(vec3(mapN.xy+kn.xy*km,mapN.z*mix(1.0,max(kn.z,.7),km)));`);
 sh.fragmentShader=sh.fragmentShader.replace('#include <normal_fragment_maps>',chunk);
 sh.fragmentShader=sh.fragmentShader.replace('#include <roughnessmap_fragment>',`#include <roughnessmap_fragment>
 roughnessFactor=clamp(roughnessFactor+knitMask(vMapUv)*(texture2D(uKnitDetail,knitUv(vMapUv)).g-.5)*.3,.05,1.0);`);
}
