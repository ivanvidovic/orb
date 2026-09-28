// Blend HDR scene targets on the GPU; no WebGL-to-Canvas2D copies.
export function createPresentCompositor(THREE,renderer){
 let targets=null,scene=null,camera=null,material=null,geometry=null,width=0,height=0;
 const viewport=new THREE.Vector4(),scissor=new THREE.Vector4();
 const supported=renderer.capabilities.isWebGL2&&renderer.extensions.has('EXT_color_buffer_float');
 function resize(){
  const size=renderer.getSize(new THREE.Vector2()),scale=renderer.getPixelRatio();
  const w=Math.max(1,Math.floor(size.x*scale)),h=Math.max(1,Math.floor(size.y*scale));
  if(w===width&&h===height)return;
  width=w;height=h;for(const target of targets)target.setSize(w,h);
 }
 function begin(){
  if(!supported)return false;
  if(targets)return true;
  targets=[0,1].map(()=>new THREE.WebGLRenderTarget(1,1,{type:THREE.HalfFloatType,depthBuffer:true,stencilBuffer:false,samples:Math.min(2,renderer.capabilities.maxSamples||0)}));
  material=new THREE.RawShaderMaterial({
   depthTest:false,depthWrite:false,blending:THREE.NoBlending,toneMapped:false,
   uniforms:{fromMap:{value:targets[0].texture},toMap:{value:targets[1].texture},mixValue:{value:0},fromExposure:{value:1},toExposure:{value:1},toneMappingExposure:{value:1}},
   vertexShader:'precision highp float;attribute vec3 position;attribute vec2 uv;varying vec2 vUv;void main(){vUv=uv;gl_Position=vec4(position.xy,0.0,1.0);}',
   fragmentShader:`precision highp float;
    uniform sampler2D fromMap,toMap;
    uniform float mixValue,fromExposure,toExposure;
    varying vec2 vUv;
    #include <tonemapping_pars_fragment>
    #include <colorspace_pars_fragment>
    vec4 displayColor(vec4 pixel,float exposure){
      float alpha=clamp(pixel.a,0.0,1.0);
      vec3 straight=max(pixel.rgb/max(alpha,0.00001),vec3(0.0));
      vec3 color=LinearTosRGB(vec4(ACESFilmicToneMapping(straight*exposure),1.0)).rgb;
      return vec4(color*alpha,alpha);
    }
    void main(){
      vec4 a=displayColor(texture2D(fromMap,vUv),fromExposure);
      vec4 b=displayColor(texture2D(toMap,vUv),toExposure);
      gl_FragColor=mix(a,b,mixValue);
    }`
  });
  geometry=new THREE.PlaneGeometry(2,2);scene=new THREE.Scene();camera=new THREE.Camera();
  const quad=new THREE.Mesh(geometry,material);quad.frustumCulled=false;scene.add(quad);
  resize();for(const target of targets)renderer.initRenderTarget(target);
  renderer.compile(scene,camera);
  return true;
 }
 function render(phase,prepare,renderScene,rect){
  resize();
  const oldTarget=renderer.getRenderTarget(),test=renderer.getScissorTest();
  renderer.getViewport(viewport);renderer.getScissor(scissor);
  const renderView=(index,id)=>{
   // Projector updates use their own target, so prepare before binding ours.
   renderer.setRenderTarget(oldTarget);prepare(id);
   const exposure=renderer.toneMappingExposure,target=targets[index];
   target.viewport.set(rect.left/rect.W*width,(rect.H-rect.top-rect.height)/rect.H*height,rect.width/rect.W*width,rect.height/rect.H*height);
   target.scissorTest=false;renderer.setRenderTarget(target);renderScene();return exposure;
  };
  try{
   material.uniforms.fromExposure.value=renderView(0,phase.from);
   const fading=phase.mix>0&&phase.from!==phase.to;
   material.uniforms.toExposure.value=fading?renderView(1,phase.to):material.uniforms.fromExposure.value;
   material.uniforms.toMap.value=targets[fading?1:0].texture;
   material.uniforms.mixValue.value=fading?phase.mix:0;
   renderer.setRenderTarget(oldTarget);renderer.setScissorTest(false);renderer.setViewport(0,0,rect.W,rect.H);
   renderer.render(scene,camera);
  }finally{
   renderer.setRenderTarget(oldTarget);renderer.setViewport(viewport);renderer.setScissor(scissor);renderer.setScissorTest(test);
  }
 }
 function dispose(){
  if(!targets)return;for(const target of targets)target.dispose();material.dispose();geometry.dispose();
  targets=scene=camera=material=geometry=null;width=height=0;
 }
 return {begin,render,dispose};
}
