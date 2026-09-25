// Low-resolution UV-space light history, shared by every artwork layer on a mesh.
// No CPU readback and no extra shadow rendering. Only meshes using glow allocate maps.
export const GLOW_HISTORY_FRAGMENT=`
varying vec2 v;uniform sampler2D previous,exposure;uniform float dt,fade,quantize,sequence;
void main(){
 vec4 old=texture2D(previous,v),lit=texture2D(exposure,v);
 if(lit.a<.5){gl_FragColor=vec4(0.);return;}
 float light=lit.r;
 float chargeRate=smoothstep(.035,.65,light)*.65;
 float decay=1./max(.5,fade);
 float equilibrium=chargeRate/(chargeRate+decay);
 float charge=equilibrium+(old.r-equilibrium)*exp(-(chargeRate+decay)*dt);
 float dark=1.-smoothstep(.025,.16,light);
 // Accumulate sustained darkness, then reveal gently. Passing folds do not flash.
 float age=clamp(old.g+dt*(dark>.65?1./1.2:-4.),0.,1.);
 float goal=dark*smoothstep(.35,1.,age);
 float reveal=mix(old.b,goal,1.-exp(-dt/(goal>old.b?1.0:.18)));
 vec3 result=vec3(charge,age,reveal);
 if(quantize>.5){float noise=fract(sin(dot(gl_FragCoord.xy+sequence,vec2(12.9898,78.233)))*43758.5453);result=floor(result*255.+noise)/255.;}
 gl_FragColor=vec4(result,1.);
}`;
export function createGlowHistory(THREE,renderer,scene,camera,{mapFor,materialFor}){
 const entries=new Map(),period=.1,size=128;
 let pending=0,age=0;
 const black=new THREE.DataTexture(new Uint8Array(4),1,1);black.needsUpdate=true;
 const blank=()=>({previous:{value:black},current:{value:black},blend:{value:0},enabled:{value:0}});
 const postScene=new THREE.Scene(),postCamera=new THREE.OrthographicCamera(-1,1,1,-1,0,1);
 const uniforms={quantize:{value:0},sequence:{value:0},previous:{value:black},exposure:{value:black},dt:{value:period},fade:{value:18}};
 const postMaterial=new THREE.ShaderMaterial({uniforms,vertexShader:'varying vec2 v;void main(){v=uv;gl_Position=vec4(position.xy,0.,1.);}',fragmentShader:GLOW_HISTORY_FRAGMENT,depthTest:false,depthWrite:false,blending:THREE.NoBlending});
 const quad=new THREE.Mesh(new THREE.PlaneGeometry(2,2),postMaterial);postScene.add(quad);
 const type=renderer.capabilities.isWebGL2&&renderer.extensions.has('EXT_color_buffer_float')?THREE.HalfFloatType:THREE.UnsignedByteType;
 uniforms.quantize.value=type===THREE.UnsignedByteType?1:0;
 const target=()=>new THREE.WebGLRenderTarget(size,size,{type,depthBuffer:false,stencilBuffer:false,minFilter:THREE.LinearFilter,magFilter:THREE.LinearFilter});
 const viewport=new THREE.Vector4(),scissor=new THREE.Vector4(),clearColor=new THREE.Color();
 function release(e){e.light.dispose();e.a.dispose();e.b.dispose();for(const m of e.materials)m.dispose();e.map.glow.enabled.value=0;e.map.glow.previous.value=black;e.map.glow.current.value=black;}
 return {blank,entries,advance(dt){pending+=Math.max(0,dt);age+=Math.max(0,dt);for(const e of entries.values())e.map.glow.blend.value=Math.min(1,age/period);},reset(){for(const e of entries.values())release(e);entries.clear();pending=0;age=0;},update(root,state){
  if(!root)return;
  const active=[];root.traverse(mesh=>{if(!mesh.isMesh||!mesh.visible)return;const map=mapFor(mesh);if(map.hasGlow&&map.target)active.push({mesh,map});});
  for(const [mesh,e] of entries)if(!active.some(a=>a.mesh===mesh&&a.map.layoutKey===e.key&&a.mesh.geometry===e.geometry)){release(e);entries.delete(mesh);}
  if(!active.length){pending=0;return;}
  if(pending<period&&active.every(a=>entries.has(a.mesh)))return;
  const dt=Math.min(.2,pending);pending=0;age=0;uniforms.sequence.value=(uniforms.sequence.value+1)%1000;
  const saved={target:renderer.getRenderTarget(),face:renderer.getActiveCubeFace(),mip:renderer.getActiveMipmapLevel(),scissor:renderer.getScissorTest(),alpha:renderer.getClearAlpha(),auto:renderer.autoClear,shadow:renderer.shadowMap.needsUpdate,background:scene.background};
  renderer.getViewport(viewport);renderer.getScissor(scissor);renderer.getClearColor(clearColor);
  const objects=[];scene.traverse(o=>{if(o.isMesh||o.isLine||o.isPoints||o.isSprite){objects.push([o,o.visible]);o.visible=false;}});
  try{
   renderer.shadowMap.needsUpdate=false;renderer.autoClear=true;scene.background=null;renderer.setScissorTest(false);renderer.setClearColor(0,0);
   for(const {mesh,map} of active){
    let e=entries.get(mesh);
    if(!e){const original=Array.isArray(mesh.material)?mesh.material:[mesh.material];e={map,key:map.layoutKey,geometry:mesh.geometry,light:target(),a:target(),b:target(),materials:original.map(materialFor)};entries.set(mesh,e);for(const t of [e.a,e.b]){renderer.setRenderTarget(t);renderer.clear();}map.glow.enabled.value=1;}
    const material=mesh.material,culling=mesh.frustumCulled;
    mesh.material=Array.isArray(material)?e.materials:e.materials[0];mesh.visible=true;mesh.frustumCulled=false;
    try{renderer.setRenderTarget(e.light);renderer.render(scene,camera);}finally{mesh.material=material;mesh.visible=false;mesh.frustumCulled=culling;}
    uniforms.previous.value=e.a.texture;uniforms.exposure.value=e.light.texture;uniforms.dt.value=dt;uniforms.fade.value=state.light==='afterglow'?state.afterglowFade:18;
    renderer.setRenderTarget(e.b);renderer.render(postScene,postCamera);
    map.glow.previous.value=e.a.texture;map.glow.current.value=e.b.texture;map.glow.blend.value=0;
    [e.a,e.b]=[e.b,e.a];
   }
  }finally{
   for(const [o,visible] of objects)o.visible=visible;
   scene.background=saved.background;renderer.shadowMap.needsUpdate=saved.shadow;renderer.autoClear=saved.auto;renderer.setClearColor(clearColor,saved.alpha);
   renderer.setRenderTarget(saved.target,saved.face,saved.mip);renderer.setViewport(viewport);renderer.setScissor(scissor);renderer.setScissorTest(saved.scissor);
  }
 }};
}
