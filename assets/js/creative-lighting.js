export const CREATIVE_DEFAULTS={runwayActivity:'standard',runwayFlash:100,runwayPaused:false,runwayTime:0,runwayPower:100,afterglowSpeed:100,afterglowFade:4,afterglowPaused:false,afterglowTime:4,afterglowPower:100,projectorPattern:'caustics',projectorScale:100,projectorSpeed:35,projectorPaused:false,projectorTime:0,projectorPower:100,projectorAngle:0,projectorWarp:40,projectorSymmetry:6,projectorColorMode:'solid',projectorGradient:'linear',projectorColorCount:2,projectorColor1:'#e4f1ff',projectorColor2:'#ff5088',projectorColor3:'#ffc35c',projectorColor4:'#5ef3d3',projectorColorAngle:0,projectorColorSpeed:30};
export const PROJECTOR_PATTERNS=['caustics','stripes','interference','ripples','liquid','cellular','kaleidoscope','shards','geometry'];
export const PROJECTOR_FRAGMENT=`varying vec2 v;
uniform float time,scale,pattern,angle,warp,symmetry;
uniform float colorMode,colorCount,colorRadial,colorAngle,colorTime;
uniform vec3 color1,color2,color3,color4;
vec2 hash2(vec2 p){return fract(sin(vec2(dot(p,vec2(127.1,311.7)),dot(p,vec2(269.5,183.3))))*43758.5453);}
vec3 palette(float f){
 float k=clamp(f,0.,1.)*(colorCount-1.);
 if(k<1.)return mix(color1,color2,k);
 if(k<2.)return mix(color2,color3,k-1.);
 return mix(color3,color4,k-2.);
}
void main(){
 vec2 raw=(v-.5)/max(.0001,scale);
 vec2 p=mat2(cos(angle),-sin(angle),sin(angle),cos(angle))*raw;
 float t=time,n=0.,meanValue=.25;
 float footprint=max(length(dFdx(p)),length(dFdy(p)));
 float resolved=1.-smoothstep(.025,.14,footprint);
 if(pattern<.5){
  meanValue=.15;float wave=sin(p.x*17.+t*.4+sin(p.y*11.-t*.25))+sin(p.y*19.-t*.33+sin(p.x*13.+t*.22));
  float width=max(fwidth(wave),.015);n=.04+.96*pow(max(0.,1.-max(0.,abs(wave)-width*.25)*1.5),3.);
 }else if(pattern<1.5){meanValue=.36;n=.5+.5*sin(p.x*32.+t*.7);
 }else if(pattern<2.5){
  vec2 q=p+warp*.07*vec2(sin(p.y*6.+t*.2),sin(p.x*5.-t*.17));
  float a=sin(q.x*26.+q.y*8.+t*.32),b=sin(q.x*23.-q.y*9.-t*.27);
  n=pow(.5+.5*a*b,2.);meanValue=.30;
 }else if(pattern<3.5){
  vec2 q=p+warp*.05*vec2(sin(p.y*9.+t*.3),cos(p.x*7.-t*.23));
  float f=sin(length(q)*48.-t*1.2);n=smoothstep(.3-max(fwidth(f),.015),.3+max(fwidth(f),.015),f);meanValue=.4;
 }else if(pattern<4.5){
  vec2 q=p+warp*.32*vec2(sin(p.y*5.+t*.22)+sin(p.x*4.-t*.3),cos(p.x*6.-t*.18));
  float f=sin(q.x*14.+q.y*4.+t*.25+sin(q.y*8.-t*.32));n=.5+.5*f;n=n*n;meanValue=.375;
 }else if(pattern<5.5){
  vec2 q=p*7.,cell=floor(q),f=fract(q);float first=10.,second=10.;
  for(int y=-1;y<=1;y++)for(int x=-1;x<=1;x++){
   vec2 g=vec2(float(x),float(y)),h=hash2(cell+g);
   vec2 site=.5+.36*sin(6.283185*h+t*.25*(.2+warp));float d=length(g+site-f);
   if(d<first){second=first;first=d;}else second=min(second,d);
  }
  float edge=second-first,aa=max(fwidth(edge),.008);n=1.-smoothstep(.05-aa,.05+aa,edge);meanValue=.18;
 }else if(pattern<6.5){
  float sector=6.283185/max(2.,symmetry),a=atan(p.y,p.x)+t*.12;
  a=abs(mod(a+sector*.5,sector)-sector*.5);vec2 q=length(p)*vec2(cos(a),sin(a));
  q+=warp*.08*vec2(sin(q.y*12.-t*.2),sin(q.x*9.+t*.3));
  float f=sin(q.x*27.-t*.5)*cos(q.y*35.+t*.3),aa=max(fwidth(f),.008);
  n=smoothstep(.05-aa,.05+aa,f);meanValue=.45;
 }else if(pattern<7.5){
  vec2 q=p*6.;q.y+=t*.18;vec2 c=floor(q),f=fract(q);vec2 h=hash2(c);
  float cut=f.x+(h.x>.5?f.y:1.-f.y)-(.45+warp*.65),aa=max(fwidth(cut),.006);
  float triangle=1.-smoothstep(-aa,aa,cut);
  float slit=1.-smoothstep(.04,.04+aa,abs(f.x-f.y));
  n=max(triangle*(.35+.65*sin(t*.4+h.y*6.28)*sin(t*.4+h.y*6.28)),slit*.7);meanValue=.25;
 }else{
  // Legacy Geometry remains available when reopening an older project.
  float a=p.x*cos(t*.12)-p.y*sin(t*.12),b=p.x*sin(t*.12)+p.y*cos(t*.12),f=sin(a*19.+t*.3)*cos(b*15.-t*.2),aa=max(fwidth(f),.002);
  n=mix(.025,1.,smoothstep(.25-aa,.25+aa,f));meanValue=.31;
 }
 float ink=mix(meanValue,pow(clamp(n,0.,1.),2.2),resolved);
 vec3 tint=color1;
 if(colorMode>.5){
  vec2 d=vec2(cos(colorAngle),sin(colorAngle));
  float f=colorRadial>.5?length(v-.5)*1.414214:dot(v-.5,d)*.707107+.5;
  if(colorMode>1.5)f=.5+.5*sin(f*6.283185-colorTime);
  tint=palette(f);
 }
 gl_FragColor=vec4(tint*ink,1.);
}
`;
const PROJECTOR_FIELDS=Object.keys(CREATIVE_DEFAULTS).filter(k=>k.startsWith('projector')&&!['projectorTime','projectorPaused','projectorPower'].includes(k));
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
 const projector=new THREE.SpotLight('#ffffff',0,8,.38,.35,1),charger=new THREE.SpotLight('#fff5dd',0,8,.35,.55,1);
 for(const l of [projector,charger,stage]){l.castShadow=true;const size=Math.min(renderer.capabilities.maxTextureSize,mobile||l===charger?1024:2048);l.shadow.mapSize.set(size,size);l.shadow.camera.near=.1;l.shadow.bias=-.0001;l.shadow.normalBias=.0015;rig.add(l,l.target);}
 projector.position.set(-.3,.65,2);projector.target.position.set(0,.02,0);charger.target.position.set(0,.02,0);
 const patternScene=new THREE.Scene(),patternCamera=new THREE.OrthographicCamera(-1,1,1,-1,0,1);
 const patternUniforms={time:{value:0},scale:{value:1},pattern:{value:0},angle:{value:0},warp:{value:.4},symmetry:{value:6},colorMode:{value:0},colorCount:{value:2},colorRadial:{value:0},colorAngle:{value:0},colorTime:{value:0},...Object.fromEntries([1,2,3,4].map(i=>['color'+i,{value:new THREE.Color(CREATIVE_DEFAULTS['projectorColor'+i])}]))};
 const patternMaterial=new THREE.ShaderMaterial({uniforms:patternUniforms,depthTest:false,depthWrite:false,toneMapped:false,extensions:{derivatives:true},
 vertexShader:'varying vec2 v;void main(){v=uv;gl_Position=vec4(position.xy,0.0,1.0);}',
 fragmentShader:PROJECTOR_FRAGMENT});
 patternScene.add(new THREE.Mesh(new THREE.PlaneGeometry(2,2),patternMaterial));
 const target=new THREE.WebGLRenderTarget(512,512,{depthBuffer:false,stencilBuffer:false,minFilter:THREE.LinearMipmapLinearFilter,magFilter:THREE.LinearFilter,generateMipmaps:true});projector.map=target.texture;
 let lastPattern='',lastFrame=-1;
 const viewport=new THREE.Vector4(),scissor=new THREE.Vector4();
 function renderPattern(size,t,pattern,scale,state){
  size=Math.min(size,renderer.capabilities.maxTextureSize);if(target.width!==size)target.setSize(size,size);
  patternUniforms.time.value=t;patternUniforms.scale.value=scale;patternUniforms.pattern.value=PROJECTOR_PATTERNS.indexOf(pattern);
  patternUniforms.angle.value=state.projectorAngle*Math.PI/180;patternUniforms.warp.value=state.projectorWarp/100;patternUniforms.symmetry.value=state.projectorSymmetry;
  patternUniforms.colorMode.value=['solid','gradient','flow'].indexOf(state.projectorColorMode);patternUniforms.colorCount.value=state.projectorColorCount;patternUniforms.colorRadial.value=state.projectorGradient==='radial'?1:0;patternUniforms.colorAngle.value=state.projectorColorAngle*Math.PI/180;patternUniforms.colorTime.value=state.projectorTime*state.projectorColorSpeed/100;
  for(let i=1;i<=4;i++)patternUniforms['color'+i].value.set(state['projectorColor'+i]);
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
   projector.intensity=8*gain;
   const moving=state.projectorSpeed>0||(state.projectorColorMode==='flow'&&state.projectorColorSpeed>0);
   const frame=moving?Math.floor(time*30):0;
   const key=PROJECTOR_FIELDS.map(k=>state[k]).join('/');
   if(frame!==lastFrame||key!==lastPattern){
    renderPattern(state.projectorScale<60?1024:512,time*state.projectorSpeed/100,state.projectorPattern,state.projectorScale/100,state);lastFrame=frame;lastPattern=key;
   }
  }
 }};
}
