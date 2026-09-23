export const CREATIVE_DEFAULTS={runwayActivity:'standard',runwayFlash:100,runwayPaused:false,runwayTime:0,runwayPower:100,afterglowSpeed:100,afterglowFade:4,afterglowPaused:false,afterglowTime:4,afterglowPower:100,projectorPattern:'caustics',projectorScale:100,projectorSpeed:35,projectorPaused:false,projectorTime:0,projectorPower:100};
export const isCreative=id=>['runway','afterglow','projector'].includes(id);
export function runwaySample(time,activity='standard'){
 const events=activity==='gentle'?[1.2,6.8,13.1]:activity==='active'?[.5,.68,.96,2.8,3.04,5.2,5.39,5.72,8.1,8.32,10.6,10.84,11.1,14.3,14.49,14.8,17.2,17.41,18.6]:[1.2,1.44,4.9,8.1,8.37,12.6,15.8,16.02];
 const t=((time%20)+20)%20,result=[0,0,0];
 events.forEach((start,i)=>{const d=(t-start+20)%20;if(d<.48){const pulse=Math.sin(Math.PI*Math.min(1,d/.065))*Math.exp(-d*7)+Math.exp(-Math.pow((d-.10)/.07,2))*.65;result[(i*7+Math.floor(i/3))%3]+=pulse;}});
 return result.map(v=>v*(activity==='active'?1.25:1));
}
export function projectorValue(x,y,t,pattern,scale){
 const u=(x-.5)/Math.max(.0001,scale),v=(y-.5)/Math.max(.0001,scale);
 if(pattern==='stripes')return .5+.5*Math.sin(u*32+t*.7);
 if(pattern==='geometry'){const a=u*Math.cos(t*.12)-v*Math.sin(t*.12),b=u*Math.sin(t*.12)+v*Math.cos(t*.12);return Math.sin(a*19+t*.3)*Math.cos(b*15-t*.2)>.25?1:.025;}
 const wave=Math.sin(u*17+t*.4+Math.sin(v*11-t*.25))+Math.sin(v*19-t*.33+Math.sin(u*13+t*.22));
 return .04+.96*Math.pow(Math.max(0,1-Math.abs(wave)*1.5),3);
}
export function createCreativeLighting(THREE,scene,uniforms,renderer,{mobile=false}={}){
 const rig=new THREE.Group();scene.add(rig);rig.visible=false;
 const flashes=['#f5f8ff','#fff2df','#edf2ff'].map((color,i)=>{const l=new THREE.DirectionalLight(color,0);l.position.set(...[[-1.5,.5,1.6],[1.7,.25,.8],[-.4,.8,-1.5]][i]);rig.add(l,l.target);return l;});
 const stage=new THREE.SpotLight('#fff0df',0,8,.40,.75,1);stage.position.set(-.35,1.65,1.15);stage.target.position.set(0,.04,0);
 const projector=new THREE.SpotLight('#e4f1ff',0,8,.38,.35,1),charger=new THREE.SpotLight('#fff5dd',0,8,.35,.55,1);
 for(const l of [projector,charger,stage]){l.castShadow=true;const size=Math.min(renderer.capabilities.maxTextureSize,mobile||l===charger?1024:2048);l.shadow.mapSize.set(size,size);l.shadow.camera.near=.1;l.shadow.bias=-.0001;l.shadow.normalBias=.0015;rig.add(l,l.target);}
 projector.position.set(-.3,.65,2);projector.target.position.set(0,.02,0);charger.target.position.set(0,.02,0);
 const patternScene=new THREE.Scene(),patternCamera=new THREE.OrthographicCamera(-1,1,1,-1,0,1);
 const patternUniforms={time:{value:0},scale:{value:1},pattern:{value:0}};
 const patternMaterial=new THREE.ShaderMaterial({uniforms:patternUniforms,depthTest:false,depthWrite:false,toneMapped:false,extensions:{derivatives:true},
 vertexShader:'varying vec2 v;void main(){v=uv;gl_Position=vec4(position.xy,0.0,1.0);}',
 fragmentShader:`varying vec2 v;uniform float time,scale,pattern;
 void main(){vec2 p=(v-.5)/max(.0001,scale);float t=time,n;
 // Fade frequencies before the projection map undersamples them. Mipmaps
 // handle subsequent minification on the garment, including angled surfaces.
 float footprint=max(length(dFdx(p)),length(dFdy(p)));
 float resolved=1.-smoothstep(.025,.14,footprint);
 float meanValue;
 if(pattern<.5){meanValue=.15;float wave=sin(p.x*17.+t*.4+sin(p.y*11.-t*.25))+sin(p.y*19.-t*.33+sin(p.x*13.+t*.22));float width=max(fwidth(wave),.015);n=.04+.96*pow(max(0.,1.-max(0.,abs(wave)-width*.25)*1.5),3.);}
 else if(pattern<1.5){meanValue=.36;n=.5+.5*sin(p.x*32.+t*.7);}
 else{meanValue=.31;float a=p.x*cos(t*.12)-p.y*sin(t*.12),b=p.x*sin(t*.12)+p.y*cos(t*.12),f=sin(a*19.+t*.3)*cos(b*15.-t*.2);float aa=max(fwidth(f),.002);n=mix(.025,1.,smoothstep(.25-aa,.25+aa,f));}
 gl_FragColor=vec4(vec3(mix(meanValue,pow(clamp(n,0.,1.),2.2),resolved)),1.);}`});
 patternScene.add(new THREE.Mesh(new THREE.PlaneGeometry(2,2),patternMaterial));
 const target=new THREE.WebGLRenderTarget(512,512,{depthBuffer:false,stencilBuffer:false,minFilter:THREE.LinearMipmapLinearFilter,magFilter:THREE.LinearFilter,generateMipmaps:true});projector.map=target.texture;
 let lastPattern='',lastFrame=-1;
 const viewport=new THREE.Vector4(),scissor=new THREE.Vector4();
 function renderPattern(size,t,pattern,scale){
  size=Math.min(size,renderer.capabilities.maxTextureSize);if(target.width!==size)target.setSize(size,size);
  patternUniforms.time.value=t;patternUniforms.scale.value=scale;patternUniforms.pattern.value=['caustics','stripes','geometry'].indexOf(pattern);
  const oldTarget=renderer.getRenderTarget(),oldScissor=renderer.getScissorTest();renderer.getViewport(viewport);renderer.getScissor(scissor);
  try{renderer.setRenderTarget(target);renderer.setViewport(0,0,size,size);renderer.setScissorTest(false);renderer.render(patternScene,patternCamera);}
  finally{renderer.setRenderTarget(oldTarget);renderer.setViewport(viewport);renderer.setScissor(scissor);renderer.setScissorTest(oldScissor);}
 }
 return {rig,projector,charger,stage,flashes,target,patternMaterial,update(dt,state){
  const mode=state.light;rig.visible=isCreative(mode);for(const l of flashes)l.intensity=0;projector.visible=mode==='projector';charger.visible=mode==='afterglow'||mode==='runway';stage.visible=mode==='runway';
  uniforms.uAfterglow.value=mode==='afterglow'?1:0;
  if(!rig.visible)return;
  const paused=state[mode+'Paused'],delta=Math.max(0,Math.min(.05,dt));
  if(!paused)state[mode+'Time']+=delta;
  const time=state[mode+'Time'],gain=state.lightPower/100;
  if(mode==='runway'){
   const pace=state.runwayActivity==='active'?1.65:state.runwayActivity==='gentle'?.65:1;
   const phase=time*pace*.42;
   stage.angle=.23;stage.penumbra=.8;stage.position.set(Math.sin(phase)*.75,1.5,1.1);
   stage.target.position.set(Math.sin(phase)*.48,.04+Math.sin(phase*.63)*.12,0);
   stage.intensity=(3.4+1.2*Math.sin(phase-.5))*gain;
   // Reuse the charge spotlight as a second pool, not an additional light.
   // A travelling pool crosses the front, then the back on its next pass. Fade out at each end
   // before resetting its path, so the loop never produces a visible jump.
   const travel=time*pace+2.1,pass=(travel%6)/6,x=-3.4+6.8*pass,side=Math.floor(travel/6)%2?-1:1;
   const envelope=Math.pow(Math.sin(Math.PI*pass),2);
   charger.angle=.48;charger.penumbra=.85;charger.decay=2;
   charger.position.set(x,.18+Math.sin(pass*Math.PI)*.22,side*1.15);
   charger.target.position.set(0,-.04,0);
   charger.intensity=5.5*envelope*gain;
   const sample=runwaySample(time,state.runwayActivity);flashes.forEach((l,i)=>l.intensity=sample[i]*5*gain*state.runwayFlash/100);
  }
  if(mode==='afterglow'){
   charger.angle=.35;charger.penumbra=.55;charger.decay=1;charger.target.position.set(0,.02,0);
   const phase=time*state.afterglowSpeed/100/12*Math.PI*2;
   charger.position.set(Math.sin(phase)*1.7,.35,Math.cos(phase)*1.7);charger.intensity=4*gain;
   uniforms.uAfterPhase.value=phase;uniforms.uAfterFade.value=state.afterglowFade;uniforms.uAfterSpeed.value=state.afterglowSpeed/100;uniforms.uAfterPower.value=gain;
  }
  if(mode==='projector'){
   projector.intensity=8*gain;const t=time*state.projectorSpeed/100,frame=state.projectorSpeed===0?0:Math.floor(time*30),key=state.projectorPattern+'/'+state.projectorScale+'/'+state.projectorSpeed;
   if(frame!==lastFrame||key!==lastPattern){
    renderPattern(state.projectorScale<60?1024:512,t,state.projectorPattern,state.projectorScale/100);lastFrame=frame;lastPattern=key;
   }
  }
 }};
}
