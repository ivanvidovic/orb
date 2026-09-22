import {CREATIVE_DEFAULTS,isCreative,createCreativeLighting} from './creative-lighting.js?v=73';
import {SLEEVE_CAMERA_PIVOTS,SLEEVE_CAMERA_CLEARANCE} from './sleeve-camera.js?v=71';
import {applyPrintTexture,hasPrintTexture,capturePrintTone,pixelateArtwork} from './print-texture.js?v=70';
import {hasDirectory} from './folder-import.js?v=58';
import {decodeArtworkImage} from './artwork-decode.js?v=45';
import {createCityTraffic} from './city-night.js?v=43';
import {PLACEMENT_SPACE,placementOffsets,migratePlacement} from './placement-space.js?v=41';
import {applySolidMask} from './solid-mask.js?v=70';
import {installWorkspace} from './workspace.js?v=73';
import {installExports} from './presentation-export.js?v=73';
import {SETTING_FIELDS,LAYER_FIELDS,pick} from './design-format.js?v=73';
import {renderPlacementDiagram} from './placement-diagrams.js?v=40';
import {installColorPicker} from './color-picker.js?v=36';
import {installSliderControls,RESET_ICON} from './controls.js?v=44';
import {installColorActions} from './color-actions.js?v=34';
let colorPicker=null,colorActions=null,workspace=null;
let renderSuspended=false,designLocked=false,historyRestoring=false,customModelFile=null,customFlipped=false;
const modelHistoryIds=new WeakMap();let nextModelHistoryId=1;
function modelHistoryId(file){if(!file)return null;if(!modelHistoryIds.has(file))modelHistoryIds.set(file,nextModelHistoryId++);return modelHistoryIds.get(file);}

const BRAND=window.BRAND;
document.title=BRAND.title;
document.getElementById('helpTitle').textContent=BRAND.title;
// Inline SVG strokes inherit the theme; there is no logo background or image filter.
const mark=document.getElementById('mark');
mark.setAttribute('aria-label',BRAND.name);
if(BRAND.wordmark.startsWith('data:image/svg+xml')){
  const comma=BRAND.wordmark.indexOf(',');
  const svgText=BRAND.wordmark.slice(0,comma).includes(';base64')
    ?atob(BRAND.wordmark.slice(comma+1)):decodeURIComponent(BRAND.wordmark.slice(comma+1));
  const source=new DOMParser().parseFromString(svgText,'image/svg+xml').documentElement;
  mark.setAttribute('viewBox',source.getAttribute('viewBox'));
  mark.append(...Array.from(source.children));
  mark.querySelectorAll('[stroke]').forEach(path=>path.setAttribute('stroke','currentColor'));
}else{
  // Client reskins can still supply a raster or external SVG URL.
  const image=document.createElementNS('http://www.w3.org/2000/svg','image');
  mark.setAttribute('viewBox','0 0 2070 1000');
  image.setAttribute('href',BRAND.wordmark);image.setAttribute('width','2070');image.setAttribute('height','1000');
  mark.append(image);
}
const bootMsg = document.getElementById('bootMsg');

let THREE, GLTFLoader;
try {
  THREE = await import('three');
  ({ GLTFLoader } = await import('three/addons/loaders/GLTFLoader.js'));
} catch (e) {
  bootMsg.textContent = 'The 3D library did not load. Check your connection and reload.';
  throw e;
}

const REDUCED = matchMedia('(prefers-reduced-motion: reduce)').matches;
const clamp = (v,a,b)=>v<a?a:v>b?b:v;
const lerp  = (a,b,t)=>a+(b-a)*t;
const smooth= t=>t*t*(3-2*t);

const Y_SH=0.672;
const GARMENTS = [
  { name:'Chalk',        hex:'#F3F1EC', dark:false },
  { name:'Ecru',         hex:'#E1DCD2', dark:false },
  { name:'Greige',       hex:'#ADA79D', dark:false },
  { name:'Graphite',     hex:'#60615E', dark:true  },
  { name:'Washed Black', hex:'#252628', dark:true  },
];

/* Print placement in metres on the garment: x across the chest (+x is the
   wearer's left), y up from the hem. On the supplied GLB these dimensions are
   converted into its native UV atlas. */
// Each placement is registered against the garment's authored UV atlas.
const ART_META={"chest": {"label": "Left chest", "side": "Front", "view": "front", "w": 0.095, "scale": 70, "code": "A"}, "rightchest": {"label": "Right chest", "side": "Front", "view": "front", "w": 0.095, "scale": 70, "code": "B"}, "front": {"label": "Full front", "side": "Front", "view": "front", "w": 0.3, "scale": 100, "code": "C"}, "back": {"label": "Full back", "side": "Back", "view": "back", "w": 0.3, "scale": 100, "code": "D"}, "lowerback": {"label": "Lower back", "side": "Back", "view": "back", "w": 0.22, "scale": 85, "code": "E"}, "leftshoulder": {"label": "Left sleeve", "side": "Sleeve", "view": "left", "w": 0.08, "scale": 85, "code": "F"}, "rightshoulder": {"label": "Right sleeve", "side": "Sleeve", "view": "right", "w": 0.08, "scale": 85, "code": "G"}};
Object.assign(ART_META,{
  pocket:{label:'Hoodie pocket',side:'Front',view:'front',w:.14,scale:100,code:'H',hoodie:true},
  hoodleft:{label:'Left hood · outside',side:'Hood',view:'left',w:.09,scale:100,code:'I',hoodie:true},
  hoodright:{label:'Right hood · outside',side:'Hood',view:'right',w:.09,scale:100,code:'J',hoodie:true},
  hoodleftinside:{label:'Left hood · inside',side:'Inside',view:'insideleft',w:.05,scale:100,code:'K',hoodie:true},
  hoodrightinside:{label:'Right hood · inside',side:'Inside',view:'insideright',w:.05,scale:100,code:'L',hoodie:true},
  necktag:{label:'Inside neck tag',side:'Inside',view:'neck',w:.045,scale:100,code:'M'}
});
Object.assign(ART_META,{
  backneck:{label:'Back neck',side:'Back',view:'back',w:.065,scale:100,code:'N',detail:true},
  leftblade:{label:'Left shoulder blade',side:'Back',view:'back',w:.095,scale:100,code:'O',detail:true},
  rightblade:{label:'Right shoulder blade',side:'Back',view:'back',w:.095,scale:100,code:'P',detail:true},
  leftwrist:{label:'Left wrist',side:'Sleeve',view:'left',w:.05,scale:100,code:'Q',hoodie:true,detail:true},
  rightwrist:{label:'Right wrist',side:'Sleeve',view:'right',w:.05,scale:100,code:'R',hoodie:true,detail:true},
  lefthem:{label:'Left front hem',side:'Front',view:'front',w:.065,scale:100,code:'S',detail:true},
  righthem:{label:'Right front hem',side:'Front',view:'front',w:.065,scale:100,code:'T',detail:true},
  centerchest:{label:'Center chest',side:'Front',view:'front',w:.12,scale:100,code:'U',detail:true}
});
ART_META.lowerback.detail=true;
const STANDARD_PLACEMENTS=['chest','rightchest','front','back','lowerback','leftshoulder','rightshoulder'];
const ART_KEYS=Object.keys(ART_META);
let UV_PROFILES={}, modelKind='catalog';
const ART_DEFAULTS=Object.fromEntries(ART_KEYS.map(k=>[k,{x:0,y:0,scale:ART_META[k].scale,rot:0}]));

/* =============================== renderer =============================== */

const MOBILE = Math.min(innerWidth,innerHeight)<760 || navigator.maxTouchPoints>0;
const canvas=document.getElementById('gl'), stage=document.getElementById('stage');
const patternCanvas=document.getElementById('bgPattern');
const patternCtx=patternCanvas.getContext('2d');
let renderer;
try{renderer=new THREE.WebGLRenderer({canvas,antialias:true,alpha:true,preserveDrawingBuffer:true});}
catch(error){
  bootMsg.textContent='3D preview needs WebGL. Enable hardware acceleration or open this file in a WebGL-enabled browser.';
  document.body.classList.add('ready');
  document.querySelectorAll('header button,header input,#panel button,#panel input,#panel select').forEach(el=>el.disabled=true);
  throw error;
}
renderer.setPixelRatio(Math.min(2, devicePixelRatio||1));
renderer.outputColorSpace=THREE.SRGBColorSpace;
renderer.toneMapping=THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure=1.0;
renderer.shadowMap.enabled=true;
renderer.shadowMap.type=THREE.PCFSoftShadowMap;
renderer.shadowMap.autoUpdate=false;

const scene=new THREE.Scene();
scene.background=null;
const camera=new THREE.PerspectiveCamera(34,1,0.003,40);

// Small HDR environments provide broad reflections as well as direct lights.
const NIGHT_DEFAULTS={green:'#ffd6a0',magenta:'#a5b9ed'};
const environmentTargets=new WeakMap();
function makeEnvironment(kind,colors=NIGHT_DEFAULTS){
  const W=256,H=128,data=new Float32Array(W*H*4);
  const green=new THREE.Color(colors.green).toArray(),magenta=new THREE.Color(colors.magenta).toArray();
  const boxes=kind==='softbox'?[[-.8,.55,1.0,.8,.55,[1,1,1]],[.8,.55,1.0,.8,.55,[1,1,1]],[2.35,.55,1.0,.8,.55,[1,1,1]],[-2.35,.55,1.0,.8,.55,[1,1,1]]]
    :kind==='studio'?[[-.8,.65,.45,.5,2.8,[1,1,1]],[2.25,.3,.22,.65,1.8,[1,1,1]],[.9,1.2,.8,.22,1.2,[1,1,1]]]
    :kind==='day'?[[-.8,.85,.16,.16,5,[1,.91,.75]]]
    :kind==='uv'?[[-.8,.65,.5,.5,.16,[.32,.12,1]]]
    :[[-.9,.4,.22,.6,.55,green],[1.1,.25,.2,.55,.4,magenta],[2.8,.4,.35,.3,.35,magenta]];
  for(let y=0;y<H;y++)for(let x=0;x<W;x++){
    const az=x/W*Math.PI*2-Math.PI,el=Math.PI/2-y/H*Math.PI,sky=Math.max(0,Math.sin(el));
    const base=kind==='softbox'?[.16+.06*sky,.16+.06*sky,.16+.06*sky]
      :kind==='studio'?[.08+.12*sky,.08+.12*sky,.08+.12*sky]
      :kind==='day'?[.14+.31*sky,.15+.43*sky,.17+.65*sky]:kind==='uv'?[.001,.001,.004]:[.006+.008*sky,.008+.01*sky,.012+.015*sky];
    for(const [a,e,w,h,power,color] of boxes){
      const distance=Math.atan2(Math.sin(az-a),Math.cos(az-a));
      const value=power*Math.exp(-Math.pow(distance/w,6)-Math.pow((el-e)/h,6));
      for(let c=0;c<3;c++)base[c]+=value*color[c];
    }
    const i=(y*W+x)*4;data[i]=base[0];data[i+1]=base[1];data[i+2]=base[2];data[i+3]=1;
  }
  const t=new THREE.DataTexture(data,W,H,THREE.RGBAFormat,THREE.FloatType);
  t.mapping=THREE.EquirectangularReflectionMapping;t.needsUpdate=true;
  const pm=new THREE.PMREMGenerator(renderer),target=pm.fromEquirectangular(t),env=target.texture;
  environmentTargets.set(env,target);pm.dispose();t.dispose();return env;
}
const environments={softbox:makeEnvironment('softbox'),studio:makeEnvironment('studio'),day:makeEnvironment('day'),night:makeEnvironment('night'),uv:makeEnvironment('uv')};
scene.environment=environments.studio;
const lightRig=new THREE.Group();scene.add(lightRig);
const cityTraffic=createCityTraffic(THREE,scene);
function updateCityTraffic(dt=0){cityTraffic.update(dt,{enabled:state.light==='night',mode:state.nightTraffic,paused:state.nightPaused,power:state.lightPower});}
const hemi=new THREE.HemisphereLight(),key=new THREE.DirectionalLight(),fil=new THREE.DirectionalLight(),rim=new THREE.DirectionalLight();
lightRig.add(hemi,key,fil,rim,key.target,fil.target,rim.target);
const lightReference=new THREE.Quaternion(),lightInverse=new THREE.Quaternion();
const lightEnvironmentRotation={value:new THREE.Matrix3()},lightEnvironmentPower={value:1};
const lightRotationMatrix=new THREE.Matrix4();
const effectUniforms={uBlackLight:{value:0},uGlowSceneLevel:{value:0},uAfterglow:{value:0},uAfterPhase:{value:0},uAfterFade:{value:4},uAfterSpeed:{value:1},uAfterPower:{value:1}};
const creativeLighting=createCreativeLighting(THREE,scene,effectUniforms);
function updateCreativeLighting(dt=0){creativeLighting.update(dt,state);if(state.selfShadows&&isCreative(state.light)&&performance.now()-lastShadowTime>1000/30)shadowDirty=true;}
let lightReferenceReady=false,shadowDirty=true,lastShadowTime=-Infinity,lastShadowSignature='';
key.castShadow=true;
key.shadow.mapSize.set(MOBILE?1024:2048,MOBILE?1024:2048);
Object.assign(key.shadow.camera,{left:-.72,right:.72,top:.68,bottom:-.68,near:.1,far:6});
key.shadow.camera.updateProjectionMatrix();
key.shadow.bias=-.00008;key.shadow.normalBias=.0015;
function updateShadowMap(){
  const c=camera.quaternion,g=garment,p=presentGarment;
  const sig=[state.selfShadows,state.light,state.lightLocked,c.x,c.y,c.z,c.w,g.position.x,g.position.z,g.rotation.y,p.visible,p.position.x,p.position.z,p.rotation.y,activeGarmentId].join('/');
  const moving=Math.abs(uni.uWind.value)>.00001||Math.abs(uni.uTwist.value)>.00001;
  const now=performance.now();
  // Reuse the depth map when still; moving cloth refreshes at up to 30 Hz.
  if(state.selfShadows&&(shadowDirty||sig!==lastShadowSignature||moving&&now-lastShadowTime>1000/30)){
    const extent=presentGarment.visible?1.15:.72;
    if(key.shadow.camera.right!==extent){key.shadow.camera.left=-extent;key.shadow.camera.right=extent;key.shadow.camera.updateProjectionMatrix();}
    renderer.shadowMap.needsUpdate=true;lastShadowTime=now;shadowDirty=false;lastShadowSignature=sig;
  }
}

const LIGHT_PRESETS={
  runway:{label:'Runway',description:'Irregular camera flashes over dim fashion-show lighting. Pause to hold a moment.',exposure:1,hemi:.035,hemiSky:'#bfcce3',hemiGround:'#25252d',key:.20,keyColor:'#fff5e9',keyPos:[-1,2,1],fill:.06,fillColor:'#e0e9ff',fillPos:[1,.5,1],rim:.3,rimColor:'#ffffff',rimPos:[0,1,-2]},
  afterglow:{label:'Afterglow',description:'A circling light charges Glow in the dark artwork, leaving a fading trail. Enable Glow on a layer.',exposure:1,hemi:.008,hemiSky:'#a2acc3',hemiGround:'#161820',key:.025,keyColor:'#c5d4ee',keyPos:[-1,2,1],fill:.008,fillColor:'#ced8f0',fillPos:[1,.5,1],rim:.065,rimColor:'#9aaada',rimPos:[0,1,-2]},
  projector:{label:'Projector',description:'Moving caustics, stripes or geometric light projected onto fabric. Self-shadows block projection behind folds.',exposure:1,hemi:.018,hemiSky:'#c2cede',hemiGround:'#20252d',key:.075,keyColor:'#c4d2e8',keyPos:[-1,2,1],fill:.02,fillColor:'#c5d1ed',fillPos:[1,.5,1],rim:.16,rimColor:'#acbfdf',rimPos:[0,1,-2]},
  softbox:{label:'Softbox',description:'Even neutral light with gentle highlights and filled shadows for reviewing artwork.',
    exposure:.98,hemi:.42,hemiSky:'#ffffff',hemiGround:'#dedede',
    key:1.25,keyColor:'#ffffff',keyPos:[-1.65,1.85,1.35],
    fill:.42,fillColor:'#ffffff',fillPos:[1.65,1.85,1.35],
    rim:.60,rimColor:'#ffffff',rimPos:[0,1.6,-1.8]},
  studio:{label:'Studio',description:'Soft neutral studio light for judging fabric and print.',
    exposure:.98,hemi:.32,hemiSky:'#ffffff',hemiGround:'#c2bdb6',
    key:2.05,keyColor:'#fff5e9',keyPos:[-1.65,1.85,1.35],
    fill:.48,fillColor:'#eef3fb',fillPos:[1.55,.45,1.0],
    rim:.85,rimColor:'#ffffff',rimPos:[.45,1.1,-1.8]},
  day:{label:'Outdoor day',description:'Warm daylight, cool sky fill and broad outdoor reflections.',
    exposure:.96,hemi:.65,hemiSky:'#cfddff',hemiGround:'#b3a389',
    key:2.25,keyColor:'#fff1d7',keyPos:[1.5,2.4,1.3],
    fill:.30,fillColor:'#c2d8ff',fillPos:[-1.5,1.2,1.0],
    rim:.62,rimColor:'#e0eaff',rimPos:[-.7,1.5,-1.8]},
  night:{label:'City night',description:'Dim streetlight and passing traffic. Lights stay fixed in the scene.',
    exposure:1.0,hemi:.025,hemiSky:'#a5b9ed',hemiGround:'#252a38',
    key:.4125,keyColor:NIGHT_DEFAULTS.green,keyPos:[-1.7,2.4,1.4],
    fill:.12,fillColor:NIGHT_DEFAULTS.magenta,fillPos:[1.5,.6,.95],
    rim:.2875,rimColor:NIGHT_DEFAULTS.magenta,rimPos:[.8,1.1,-1.6]},
  uv:{label:'Black light',description:'Black light with subtle fabric highlights and a gentle glow on pale fabric. Enter higher intensity values to extend the slider range.',
    exposure:1,hemi:.035,hemiSky:'#77718f',hemiGround:'#252030',
    key:.18,keyColor:'#824bff',keyPos:[-1.65,1.85,1.35],
    fill:.07,fillColor:'#c1c3d2',fillPos:[1.55,.45,1],
    rim:.18,rimColor:'#6633ef',rimPos:[.45,1.1,-1.8]}
};
const UV_BACKDROP={bg:'#000000',gridColor:'#101010'};
let regularBackdrop=null;
function syncLightingBackdrop(){
  if(['uv','runway','afterglow','projector'].includes(state.light)){
    if(regularBackdrop)return;
    regularBackdrop={bg:state.bg,gridColor:state.gridColor,gridColorCustom:state.gridColorCustom};
    Object.assign(state,UV_BACKDROP,{gridColorCustom:false});
  }else{
    if(!regularBackdrop)return;
    Object.assign(state,regularBackdrop);regularBackdrop=null;
  }
  colorPicker?.close();
  document.getElementById('bgCustom').value=state.bg;
  document.getElementById('bgColorChip').style.background=state.bg;
  document.getElementById('gridColor').value=state.gridColor;
  applyBackground();
}
function applyLightingPreset(){
  syncLightingBackdrop();
  syncFabricColors();
  const p=LIGHT_PRESETS[state.light]||LIGHT_PRESETS.studio,power=state.lightPower/100*(state.light==='uv'?8:1);
  renderer.toneMappingExposure=p.exposure;scene.environment=environments[state.light]||environments.studio;
  lightEnvironmentPower.value=power*(isCreative(state.light)?.025:state.light==='softbox'?.55:state.light==='studio'?.55:state.light==='day'?.65:state.light==='night'?.1125:.45);
  effectUniforms.uBlackLight.value=state.light==='uv'?power:0;
  effectUniforms.uGlowSceneLevel.value=power*(.16*p.key+.12*p.fill+.08*p.rim+.75*p.hemi)+.20*lightEnvironmentPower.value;
  document.getElementById('nightControls').hidden=state.light!=='night';
  document.getElementById('nightTraffic').value=state.nightTraffic;
  document.getElementById('nightPaused').checked=state.nightPaused;
  document.getElementById('nightPaused').disabled=state.nightTraffic==='off';
  for(const mode of ['runway','afterglow','projector'])document.getElementById(mode+'Controls').hidden=state.light!==mode;
  for(const id of Object.keys(CREATIVE_DEFAULTS)){const input=document.getElementById(id);if(!input)continue;if(input.type==='checkbox')input.checked=state[id];else{input.value=state[id];const number=document.getElementById(id+'Value');if(number)number.value=input.value;}}
  const fixed=state.light==='night'||isCreative(state.light),lock=document.getElementById('lightLock');lock.disabled=fixed;lock.checked=fixed||!state.lightLocked;
  updateCityTraffic();updateCreativeLighting();
  shadowDirty=true;
  hemi.color.set(p.hemiSky);hemi.groundColor.set(p.hemiGround);hemi.intensity=p.hemi*power;
  key.color.set(p.keyColor);key.intensity=p.key*power;key.position.set(...p.keyPos);
  fil.color.set(p.fillColor);fil.intensity=p.fill*power;fil.position.set(...p.fillPos);
  rim.color.set(p.rimColor);rim.intensity=p.rim*power;rim.position.set(...p.rimPos);
  document.getElementById('lightDescription').textContent=p.label+' · '+p.description;
}
function updateLightLock(){
  if(!lightReferenceReady){lightReference.copy(camera.quaternion);lightReferenceReady=true;}
  if(state.light==='night'||isCreative(state.light))lightRig.quaternion.identity();
  else if(state.lightLocked){
    lightRig.quaternion.copy(camera.quaternion).multiply(lightInverse.copy(lightReference).invert());
  }
  lightRotationMatrix.makeRotationFromQuaternion(lightInverse.copy(lightRig.quaternion).invert());
  lightEnvironmentRotation.value.setFromMatrix4(lightRotationMatrix);

}

// soft studio pools
let shirtShadow=null;
let presentShadow=null;
{
  const S=256,c=document.createElement('canvas'); c.width=c.height=S;
  const x=c.getContext('2d'), g=x.createRadialGradient(S/2,S/2,0,S/2,S/2,S/2);
  g.addColorStop(0,'rgba(0,0,0,.42)'); g.addColorStop(.55,'rgba(0,0,0,.13)');
  g.addColorStop(1,'rgba(0,0,0,0)');
  x.fillStyle=g; x.fillRect(0,0,S,S);
  const t=new THREE.CanvasTexture(c); t.colorSpace=THREE.SRGBColorSpace;
  const geom=new THREE.PlaneGeometry(0.86,0.40);

  shirtShadow=new THREE.Mesh(
    geom,
    new THREE.MeshBasicMaterial({map:t,transparent:true,depthWrite:false,opacity:1})
  );
  shirtShadow.rotation.x=-Math.PI/2;
  shirtShadow.position.y=-0.455;
  scene.add(shirtShadow);

  presentShadow=new THREE.Mesh(
    geom,
    new THREE.MeshBasicMaterial({map:t,transparent:true,depthWrite:false,opacity:0})
  );
  presentShadow.rotation.x=-Math.PI/2;
  presentShadow.position.y=-0.455;
  presentShadow.visible=false;
  scene.add(presentShadow);
}

/* ============================ fabric material ============================ */

const uni = {
  uTime:{value:0}, uWind:{value:0.011}, uTwist:{value:0},
  uTwistFlowPower:{value:1.0}, uSleeveBoost:{value:0.20}, uSleeveArc:{value:0.65},
  uDir:{value:new THREE.Vector3(0.85,0,0.53).normalize()},

  uArtRough:{value:0.5},
  uDotGrid:{value:0},
};

const VERT_HEAD=`
  uniform float uTime; uniform float uWind; uniform float uTwist; uniform float uFlowHalfWidth;
  uniform float uTwistFlowPower; uniform float uSleeveBoost; uniform float uSleeveArc; uniform vec3 uDir;
  attribute float aFlow; attribute vec3 aMotionAnchor; attribute vec2 aArtworkUv; varying vec2 vArtworkUv;
  vec3 gDisp;

  float kMotionFlow(vec3 p){
    float hn=clamp((p.y+.024)/.696,0.0,1.0);
    float f=pow(clamp(1.0-hn/.86,0.0,1.0),1.35);
    float rad=abs(p.x)/max(uFlowHalfWidth,.0001);
    return clamp(max(f,.8*pow(max(0.0,(rad-.70)/.30),1.2)*smoothstep(.26,.58,hn)),0.0,1.0);
  }
  vec3 kBreeze(vec3 p, float flow){
    if (flow < 0.001) return vec3(0.0);
    float t = uTime;
    float w1 = sin(p.y*6.4  - t*2.05 + p.x*3.1);
    float w2 = sin(p.y*12.7 + t*3.25 + p.z*5.3 + 1.7);
    float w3 = sin(p.x*8.6  + p.z*6.9 - t*1.35);
    float a = uWind*flow;
    vec3 o = uDir*((w1*0.62 + w2*0.24)*a);
    o.y += w3*0.13*a;
    o += normalize(vec3(p.x,0.0,p.z)+vec3(1e-4))*((w2*0.30 + w3*0.22)*a);
    return o;
  }

  // Rotational lag around the garment's vertical axis.
  // The torso uses a broad twist; sleeve vertices can instead arc around a
  // local shoulder pivot so the cuff follows a curved path and preserves volume.
  vec3 kInertia(vec3 p, float flow){
    if (flow < 0.001 || abs(uTwist) < 0.00001) return vec3(0.0);

    float f = flow * flow * (3.0 - 2.0 * flow);
    f = pow(max(f, 0.0001), uTwistFlowPower);

    // Restrict the sleeve treatment to wide, upper vertices.
    float sleeveX = smoothstep(0.16, 0.31, abs(p.x));
    float sleeveY = smoothstep(0.20, 0.42, p.y);
    float sleeve = sleeveX * sleeveY;

    float torsoA = uTwist * f;
    float globalA = torsoA * (1.0 + sleeve * uSleeveBoost);

    // Standard garment-wide twist around center.
    float cg = cos(globalA), sg = sin(globalA);
    vec3 qGlobal = p;
    qGlobal.x = cg*p.x + sg*p.z;
    qGlobal.z = -sg*p.x + cg*p.z;

    // Sleeve-specific rigid arc around an approximate shoulder root.
    // The local rotation preserves the sleeve's radius/volume instead of
    // pushing all cuff vertices straight ahead on the global axis.
    float side = p.x < 0.0 ? -1.0 : 1.0;
    vec3 pivot = vec3(side*0.145, 0.48, 0.0);
    vec3 local = p - pivot;

    // Arc increases the sleeve's local swing as well as how strongly we blend
    // from global twist to shoulder-pivot motion.
    float localA = torsoA * (1.0 + sleeve*(uSleeveBoost + uSleeveArc*0.90));
    float cl = cos(localA), sl = sin(localA);
    vec3 localRot = local;
    localRot.x = cl*local.x + sl*local.z;
    localRot.z = -sl*local.x + cl*local.z;
    vec3 qSleeve = pivot + localRot;

    float arcBlend = sleeve * uSleeveArc;
    vec3 q = mix(qGlobal, qSleeve, arcBlend);
    return q-p;
  }

  vec3 kFabricDisp(vec3 p, float flow){
    return kBreeze(p, flow) + kInertia(p, flow);
  }
`;

const FRAG_HEAD=`
uniform float uArtRough,uHasArtwork;
uniform sampler2D uArtwork,uArtworkEffects,uSpillGlow,uSpillUV;
uniform float uHasEffects,uBlackLight,uFabricReactive,uGlowSceneLevel,uAfterglow,uAfterPhase,uAfterFade,uAfterSpeed,uAfterPower;
varying vec3 vChargePosition;
float kIlluminance=0.0,kUVExposure=0.0,kUVVisibility=1.0,kHardVisibility=1.0;
vec3 kFabricColor=vec3(0.0),kArtColor=vec3(0.0),kEffectNormal=vec3(0.0);
vec2 kArtEffects=vec2(0.0);
varying vec2 vArtworkUv;
float kArtworkMask=0.0;`;
const FRAG_PRINT=`{
kArtworkMask=0.0;kFabricColor=diffuseColor.rgb;
if(gl_FrontFacing&&uHasArtwork>0.5&&vArtworkUv.x>=0.0&&vArtworkUv.y>=0.0){
  vec4 art=texture2D(uArtwork,vArtworkUv);
  diffuseColor.rgb=diffuseColor.rgb*(1.0-art.a)+art.rgb;
  kArtworkMask=art.a;kArtColor=art.rgb/max(art.a,.0001);
  if(uHasEffects>.5){
    vec4 effects=texture2D(uArtworkEffects,vArtworkUv);
    // The low-resolution map stores premultiplied effect strength. Restore
    // strength, then apply the full-resolution print coverage exactly once.
    kArtEffects=effects.rg/max(effects.a,.0001)*4.0*art.a;
  }
}
if(!gl_FrontFacing)diffuseColor.rgb*=0.60;
}`;

// This is an appearance preview: emission brightens the surface, without
// adding costly per-layer lights or bloom that would blur the print edges.
const FRAG_EMISSION=`
// Macro normals drive the response; weave normals still shade the material.
float kAmbient=dot(irradiance+iblIrradiance,vec3(.2126,.7152,.0722));
float kVisible=max(0.0,kIlluminance+kAmbient);
// No flat on/off plateau: a long, faint tail preserves a gentle transition,
// while strong visible glow is reserved for the deepest darkness.
float kDark=exp(-kVisible/.055)*(1.0-smoothstep(.18,.45,kVisible))/(1.0+4.0*uGlowSceneLevel*uGlowSceneLevel);
// Scattered room UV keeps the fluorescence alive in directional UV shadows.
// Weak shape fill barely suppresses it; strong ordinary light reduces contrast.
// UV strength is calibrated to half the previous output at a 100% slider.
float kUV=1.25*(1.0-exp(-1.8*(.14*uBlackLight+.86*kUVExposure)))/(1.0+4.0*kVisible*kVisible+2.0*uGlowSceneLevel*uGlowSceneLevel);
// Stylized periodic charging around the garment, retained independently of camera angle.
if(uAfterglow>.5){
 float surfacePhase=atan(vChargePosition.x,vChargePosition.z);
 float elapsed=mod(uAfterPhase-surfacePhase+6.2831853,6.2831853)*12.0/(6.2831853*max(.05,uAfterSpeed));
 float charge=exp(-elapsed/max(.25,uAfterFade))*uAfterPower;
 kDark*=charge;
}
float kGlow=kArtEffects.r*kDark+kArtEffects.g*kUV;
totalEmissiveRadiance+=kArtColor*kGlow;
// Preserve v27's actual black-light reflections and shadowing. Fabric color
// controls the UV-only pale-fabric lift and a small existing-reflection gain.
float kFabricLuma=dot(kFabricColor,vec3(.2126,.7152,.0722));
float kFabricLight=smoothstep(.015,.55,kFabricLuma);
float kFabricUVGain=clamp(uBlackLight*100.0,0.0,1.0)*uFabricReactive*(1.0-kArtworkMask);
// Pale cloth is slightly lighter. Dark cloth receives no diffuse lift.
reflectedLight.directDiffuse*=1.0+.16*kFabricLight*kFabricUVGain;
reflectedLight.indirectDiffuse*=1.0+.12*kFabricLight*kFabricUVGain;
// Keep the original rough material response: only its amplitude changes.
// No added highlight lobe, altered roughness, or dark-fabric diffuse lift.
float kUVReflection=1.0+mix(.18,.14,kFabricLight)*kFabricUVGain;
reflectedLight.directSpecular*=kUVReflection;
reflectedLight.indirectSpecular*=kUVReflection;
// Very small neutral fluorescence on pale fabric, proportional to actual UV
// exposure. No ambient emission floor; shadowed folds retain their depth.
totalEmissiveRadiance+=.008*kFabricColor*kFabricLight*kUVExposure*uFabricReactive*(1.0-kArtworkMask)*(gl_FrontFacing?1.0:.6);

if(gl_FrontFacing&&uHasEffects>.5&&vArtworkUv.x>=0.0&&vArtworkUv.y>=0.0){
  // A short-range surface bounce approximation. Cached colors retain the
  // separate glow/UV strengths; current lighting gates their visible spill.
  vec3 bounce=4.0*(texture2D(uSpillGlow,vArtworkUv).rgb*kDark+texture2D(uSpillUV,vArtworkUv).rgb*kUV);
  totalEmissiveRadiance+=bounce*.20*sqrt(clamp(kFabricColor,0.0,1.0)+vec3(.01))*(1.0-kArtworkMask);
}
`;
function makeFabricDepthMaterial(){
  const depth=new THREE.MeshDepthMaterial({depthPacking:THREE.RGBADepthPacking,side:THREE.DoubleSide});
  depth.onBeforeCompile=sh=>{
    Object.assign(sh.uniforms,uni);
    sh.vertexShader=VERT_HEAD+sh.vertexShader;
    sh.vertexShader=sh.vertexShader.replace('#include <begin_vertex>',
      '#include <begin_vertex>\n transformed += kFabricDisp(aMotionAnchor,aFlow);');
  };
  depth.customProgramCacheKey=()=> 'orb-motion-depth-16';
  return depth;
}
function patchFabricMaterial(mat){
  mat.userData.orbFabric=true;
  mat.onBeforeCompile=sh=>{
    Object.assign(sh.uniforms, uni);
    sh.uniforms.uFlowHalfWidth={value:mat.userData.orbFlowHalfWidth||.3};
    const artwork=getArtworkMap(mat.userData.orbMeshId||1);
    sh.uniforms.uArtwork=artwork.map;sh.uniforms.uHasArtwork=artwork.has;
    sh.uniforms.uArtworkEffects=artwork.effects;sh.uniforms.uHasEffects=artwork.hasEffects;
    sh.uniforms.uSpillGlow=artwork.spillGlow;sh.uniforms.uSpillUV=artwork.spillUV;
    Object.assign(sh.uniforms,effectUniforms);
    sh.uniforms.uFabricReactive={value:mat.userData.orbTintable?1:0};
    sh.uniforms.uLightEnvRotation=lightEnvironmentRotation;sh.uniforms.uLightEnvPower=lightEnvironmentPower;
    const environmentChunk=THREE.ShaderChunk.envmap_physical_pars_fragment
      .replace('inverseTransformDirection( normal, viewMatrix );','uLightEnvRotation * inverseTransformDirection( normal, viewMatrix );')
      .replace('inverseTransformDirection( reflectVec, viewMatrix );','uLightEnvRotation * inverseTransformDirection( reflectVec, viewMatrix );')
      .replaceAll('* envMapIntensity','* envMapIntensity * uLightEnvPower');
    let lightingChunk=THREE.ShaderChunk.lights_fragment_begin;
    // The existing shadow-casting key is first in Three's directional-light
    // list. Reuse its actual shadow sample for UV; no extra light or map pass.
    const dirStart=lightingChunk.indexOf('#if ( NUM_DIR_LIGHTS > 0 )');
    const dirEnd=lightingChunk.indexOf('#if ( NUM_RECT_AREA_LIGHTS > 0 )',dirStart);
    let directional=lightingChunk.slice(dirStart,dirEnd)
      .replace('getDirectionalLightInfo( directionalLight, directLight );','getDirectionalLightInfo( directionalLight, directLight );\n kUVVisibility=1.0;')
      .replace('directLight.color *= ( directLight.visible && receiveShadow ) ? getShadow(', 'kUVVisibility = ( directLight.visible && receiveShadow ) ? getShadow(')
      .replace('\n\t\tRE_Direct( directLight,',`\n        directLight.color *= kUVVisibility;
        // Broader shadow filtering is only used by the emission response.
        // The visible cloth and artwork keep the normal shadow definition.
        #if defined(USE_SHADOWMAP) && (UNROLLED_LOOP_INDEX < NUM_DIR_LIGHT_SHADOWS)
        if((uHasEffects>.5||(uBlackLight>0.0&&uFabricReactive>.5))&&receiveShadow){
          kHardVisibility=kUVVisibility;
          kUVVisibility=.25*(
            getShadow(directionalShadowMap[i],directionalLightShadow.shadowMapSize,directionalLightShadow.shadowBias,directionalLightShadow.shadowRadius,vDirectionalShadowCoord[i]+vec4(vec2(2.0,0.0)/directionalLightShadow.shadowMapSize*vDirectionalShadowCoord[i].w,0.0,0.0))+
            getShadow(directionalShadowMap[i],directionalLightShadow.shadowMapSize,directionalLightShadow.shadowBias,directionalLightShadow.shadowRadius,vDirectionalShadowCoord[i]+vec4(vec2(-2.0,0.0)/directionalLightShadow.shadowMapSize*vDirectionalShadowCoord[i].w,0.0,0.0))+
            getShadow(directionalShadowMap[i],directionalLightShadow.shadowMapSize,directionalLightShadow.shadowBias,directionalLightShadow.shadowRadius,vDirectionalShadowCoord[i]+vec4(vec2(0.0,2.0)/directionalLightShadow.shadowMapSize*vDirectionalShadowCoord[i].w,0.0,0.0))+
            getShadow(directionalShadowMap[i],directionalLightShadow.shadowMapSize,directionalLightShadow.shadowBias,directionalLightShadow.shadowRadius,vDirectionalShadowCoord[i]+vec4(vec2(0.0,-2.0)/directionalLightShadow.shadowMapSize*vDirectionalShadowCoord[i].w,0.0,0.0)));
          kIlluminance+=dot(directionalLight.color,vec3(.2126,.7152,.0722))*(kUVVisibility-kHardVisibility)*max(dot(kEffectNormal,directLight.direction),0.0);
        }
        #endif
        #if UNROLLED_LOOP_INDEX == 0
          kUVExposure += uBlackLight*kUVVisibility*max(dot(kEffectNormal,directLight.direction),0.0);
        #endif
        RE_Direct( directLight,`);
    lightingChunk=lightingChunk.slice(0,dirStart)+directional+lightingChunk.slice(dirEnd);
    lightingChunk=lightingChunk.replaceAll('RE_Direct( directLight,','kIlluminance += dot(directLight.color,vec3(.2126,.7152,.0722))*max(dot(kEffectNormal,directLight.direction),0.0); RE_Direct( directLight,');
    sh.fragmentShader=sh.fragmentShader.replace('#include <lights_fragment_begin>',lightingChunk);
    sh.fragmentShader='uniform mat3 uLightEnvRotation; uniform float uLightEnvPower;\n'+sh.fragmentShader.replace('#include <envmap_physical_pars_fragment>',environmentChunk);
    sh.vertexShader = VERT_HEAD + sh.vertexShader;
    sh.vertexShader = sh.vertexShader.replace('#include <beginnormal_vertex>',
      `#include <beginnormal_vertex>
       vArtworkUv = aArtworkUv;
       gDisp = kFabricDisp(aMotionAnchor, aFlow);
       if (aFlow > 0.001) {
         vec3 T1 = normalize(cross(objectNormal, vec3(0.0,1.0,0.0)) + vec3(1e-5));
         vec3 T2 = normalize(cross(objectNormal, T1));
         float e = 0.001;
         vec3 p0 = position + gDisp;
         vec3 pa = position + T1*e + kFabricDisp(aMotionAnchor + T1*e, kMotionFlow(aMotionAnchor + T1*e));
         vec3 pb = position + T2*e + kFabricDisp(aMotionAnchor + T2*e, kMotionFlow(aMotionAnchor + T2*e));
         vec3 nn = normalize(cross(pa-p0, pb-p0));
         objectNormal = dot(nn, objectNormal) < 0.0 ? -nn : nn;
         #ifdef USE_TANGENT
           vec3 pt = position + objectTangent*e;
           objectTangent = normalize(pt + kFabricDisp(aMotionAnchor + objectTangent*e, kMotionFlow(aMotionAnchor + objectTangent*e)) - p0);
           objectTangent = normalize(objectTangent - objectNormal*dot(objectTangent,objectNormal));
         #endif
       }`);
    sh.vertexShader='varying vec3 vChargePosition;\n'+sh.vertexShader;
    sh.vertexShader = sh.vertexShader.replace('#include <begin_vertex>',
      '#include <begin_vertex>\n transformed += gDisp; vChargePosition=transformed;');
    sh.fragmentShader = FRAG_HEAD + '\n' + sh.fragmentShader;
    sh.fragmentShader=sh.fragmentShader.replace('#include <normal_fragment_maps>','kEffectNormal=normal;\n#include <normal_fragment_maps>');
    sh.fragmentShader = sh.fragmentShader.replace('#include <map_fragment>',
      '#include <map_fragment>\n' + FRAG_PRINT);
    sh.fragmentShader=sh.fragmentShader.replace('#include <aomap_fragment>','#include <aomap_fragment>\n'+FRAG_EMISSION);
    sh.fragmentShader = sh.fragmentShader.replace('#include <roughnessmap_fragment>',
      '#include <roughnessmap_fragment>\n roughnessFactor = mix(roughnessFactor, clamp(uArtRough, 0.02, 1.0), clamp(kArtworkMask, 0.0, 1.0));');
  };
  mat.customProgramCacheKey=()=> 'orb-native-panel-stack-v73-afterglow';
  mat.needsUpdate=true;
  return mat;
}

/* ============================== garment root ============================== */

const garment=new THREE.Group();
garment.position.y=-0.350;
scene.add(garment);

// Presentation uses a lightweight clone of the CURRENT garment.
// Geometry is shared; only lightweight material copies are used so the clone
// can fade independently as it crosses the real viewport edge.
const presentGarment=new THREE.Group();
presentGarment.position.y=-0.350;
presentGarment.visible=false;
scene.add(presentGarment);

let presentMix=0;
let presentSpin=0;
let presentCloneActive=false;
let presentCloneMaterials=[];
const PRESENT_OFFSET=0.40;

function clonePresentMaterial(src){
  const m=src.clone();

  // Material.clone() does not reliably preserve custom shader callbacks across
  // Three.js revisions, so explicitly carry them over.
  m.onBeforeCompile=src.onBeforeCompile;
  m.customProgramCacheKey=src.customProgramCacheKey;
  m.userData={...src.userData};

  // Only the presentation copy fades. Geometry remains shared with the
  // original shirt, so this is still a lightweight clone.
  m.transparent=true;
  m.opacity=0;
  m.needsUpdate=true;
  return m;
}
function setPresentCloneOpacity(v){
  const a=clamp(v,0,1);
  presentCloneMaterials.forEach(m=>{ m.opacity=a; });
}
function rebuildPresentClone(show=false){
  presentGarment.clear();
  presentCloneMaterials=[];
  presentCloneActive=false;
  if(!current) return;

  // Share the current geometry, but use lightweight material copies so the
  // incoming shirt can fade at the viewport edge without affecting the
  // original shirt.
  const depthById=new Map();current.traverse(o=>{if(o.isMesh)depthById.set(o.userData.orbMeshId,o.customDepthMaterial);});
  const clone=current.clone(true);
  clone.traverse(o=>{
    if(!o.isMesh) return;
    o.frustumCulled=false;
    o.customDepthMaterial=depthById.get(o.userData.orbMeshId);

    if(Array.isArray(o.material)){
      o.material=o.material.map(src=>{
        const m=clonePresentMaterial(src);
        presentCloneMaterials.push(m);
        return m;
      });
    }else if(o.material){
      const m=clonePresentMaterial(o.material);
      presentCloneMaterials.push(m);
      o.material=m;
    }
  });

  presentGarment.add(clone);
  presentGarment.visible=show;
  setPresentCloneOpacity(show?1:0);
  presentCloneActive=true;
}

// Connected native UV panels, including duplicate vertices at normal splits.
// This labels the existing mesh; it does not change positions, UVs, or normals.
function ensurePrintIslands(geometry){
  if(geometry.getAttribute('aPrintIsland'))return;
  const position=geometry.getAttribute('position'),uv=geometry.getAttribute('uv');
  if(!position||!uv)return;
  const count=position.count,parent=new Uint32Array(count),rank=new Uint8Array(count);
  for(let i=0;i<count;i++)parent[i]=i;
  const find=i=>{while(parent[i]!==i){parent[i]=parent[parent[i]];i=parent[i];}return i;};
  const join=(a,b)=>{
    a=find(a);b=find(b);if(a===b)return;
    if(rank[a]<rank[b]){const t=a;a=b;b=t;}
    parent[b]=a;if(rank[a]===rank[b])rank[a]++;
  };
  const vertices=new Map(),q=n=>Math.round(n*1e6);
  for(let i=0;i<count;i++){
    const key=[q(position.getX(i)),q(position.getY(i)),q(position.getZ(i)),q(uv.getX(i)),q(uv.getY(i))].join(',');
    const other=vertices.get(key);
    if(other===undefined)vertices.set(key,i);else join(i,other);
  }
  const index=geometry.index,triCount=index?index.count:count;
  for(let i=0;i<triCount;i+=3){
    const a=index?index.getX(i):i,b=index?index.getX(i+1):i+1,c=index?index.getX(i+2):i+2;
    join(a,b);join(b,c);
  }
  const ids=new Map(),panels=new Float32Array(count);
  for(let i=0;i<count;i++){
    const root=find(i);
    if(!ids.has(root))ids.set(root,ids.size+1);
    panels[i]=ids.get(root);
  }
  geometry.setAttribute('aPrintIsland',new THREE.BufferAttribute(panels,1));
}
let current=null, isCustom=false;
function setGarment(obj, custom){
  shadowDirty=true;
  resetArtworkMaps();
  artLayers.forEach(layer=>layer.anchor=null);
  // Remove the old presentation clone before disposing any geometry it shares.
  presentCloneMaterials.forEach(m=>m.dispose?.());
  presentCloneMaterials=[];
  presentGarment.clear();
  presentGarment.visible=false;
  presentCloneActive=false;

  if (current){
    if(!current.userData.catalogCached)disposeModel(current);
    garment.remove(current);
  }

  current=obj;
  isCustom=!!custom;
  garment.add(obj);

  // Prepare the opposite-side shirt now, while the user is not transitioning.
  rebuildPresentClone(false);
}

/* --------------------------- importing a model --------------------------- */

const TARGET_H=0.74, HEM_Y=-0.024;

function makeFlow(geo,garmentHalfWidth){
  const p=geo.getAttribute('aMotionAnchor')||geo.attributes.position, n=p.count;
  const fl=new Float32Array(n);
  const yMin=HEM_Y, yMax=Y_SH;
  const halfW=Math.max(garmentHalfWidth,1e-4);
  for(let i=0;i<n;i++){
    const hn=clamp((p.getY(i)-yMin)/(yMax-yMin),0,1);
    let f=Math.pow(clamp(1-hn/0.86,0,1),1.35);
    const rad=Math.abs(p.getX(i))/halfW;               // sleeve cuffs flutter too
    // A height cutoff here ripped long sleeves across hn=.42 during twist.
    // Blend the sleeve influence continuously across the same region.
    const sleeveBlend=THREE.MathUtils.smoothstep(hn,0.26,0.58);
    const sleeveFlow=0.8*Math.pow(Math.max(0,(rad-0.70)/0.30),1.2);
    f=Math.max(f,sleeveFlow*sleeveBlend);
    fl[i]=clamp(f,0,1);
  }
  geo.setAttribute('aFlow', new THREE.BufferAttribute(fl,1));
}

function adopt(root){
  root.traverse(o=>{if(o.isMesh&&o.geometry&&!o.geometry.attributes.uv)throw new Error('This model has no native UV map. Export it with UV coordinates before importing.');});
  root.updateMatrixWorld(true);
  const box=new THREE.Box3().setFromObject(root);
  const size=box.getSize(new THREE.Vector3());
  if (size.z > size.y*1.35){                        // Z-up export
    root.rotation.x=-Math.PI/2;
    root.updateMatrixWorld(true);
    box.setFromObject(root); box.getSize(size);
  }
  const s=TARGET_H/Math.max(1e-6,size.y);
  root.scale.multiplyScalar(s);
  root.updateMatrixWorld(true);
  box.setFromObject(root);
  const c=box.getCenter(new THREE.Vector3());
  root.position.x-=c.x; root.position.z-=c.z; root.position.y-=(box.min.y-HEM_Y);
  root.updateMatrixWorld(true);

  const out=new THREE.Group();
  let tris=0;
  root.traverse(o=>{
    if(!o.isMesh || !o.geometry) return;
    const g=o.geometry.clone();
    for(const a of ['skinIndex','skinWeight'])
      if (g.attributes[a]) g.deleteAttribute(a);
    g.morphAttributes={};
    g.applyMatrix4(o.matrixWorld);
    if(!g.attributes.normal) g.computeVertexNormals();
    g.setAttribute('aMotionAnchor',g.attributes.position);
    makeFlow(g,size.x*s/2);
    ensurePrintIslands(g);
    tris += (g.index ? g.index.count : g.attributes.position.count)/3;

    // Keep the GLB material, including its original normal map and UV mapping.
    // Only add our colour/ink shader on top of it.
    const meshId=out.children.length+1;
    const sources=Array.isArray(o.material)?o.material:[o.material];
    const materials=sources.map(source=>{
      const material=source&&(source.isMeshStandardMaterial||source.isMeshPhysicalMaterial)
        ?source.clone():new THREE.MeshStandardMaterial({color:currentGarment().hex,roughness:0.96});
      material.side=THREE.DoubleSide;
      material.userData.orbMeshId=meshId;material.userData.orbFlowHalfWidth=size.x*s/2;
      // Keep every authored map and material group. Garment tint remains user-controlled.
      material.userData.orbBaseColor=material.color.toArray();
      material.userData.orbTintable=material.metalness<0.5;
      if(material.userData.orbTintable)material.color.multiply(renderedFabricColor(currentGarment().hex));
      for(const value of Object.values(material))if(value?.isTexture)value.anisotropy=Math.min(8,renderer.capabilities.getMaxAnisotropy());
      return patchFabricMaterial(material);
    });
    const mesh=new THREE.Mesh(g,Array.isArray(o.material)?materials:materials[0]);
    mesh.castShadow=true;mesh.receiveShadow=true;
    mesh.customDepthMaterial=makeFabricDepthMaterial();
    mesh.name=o.name;
    mesh.userData.orbMeshId=meshId;
    out.add(mesh);
  });
  if (out.children.length===0) throw new Error('no meshes');

  const b2=new THREE.Box3().setFromObject(out), sz=b2.getSize(new THREE.Vector3());
  out.userData.halfWidth=sz.x/2;
  return { group:out, tris:Math.round(tris), size:sz };
}

// Stable asset IDs and authored filenames are separate from the names shown in the Studio.
const GARMENT_CATALOG=[
  {id:'mens-tee',label:"Men's T-Shirt",file:'orb-tee-men-03.glb',type:'tee',distance:1.55},
  {id:'womens-tee',label:"Women's T-Shirt",file:'orb-tee-women-03.glb',type:'tee',distance:1.60},
  {id:'mens-hoodie',label:"Men's Hoodie",file:'orb-hoodie-men-basic-01.glb',type:'hoodie',distance:1.51},
  {id:'womens-hoodie',label:"Women's Hoodie",file:'orb-hoodie-women-02.glb',type:'hoodie',distance:1.59},
];
const gltfLoader=new GLTFLoader();
// Draco remains available for user uploads. The four supplied GLBs are uncompressed.
try{
  const {DRACOLoader}=await import('three/addons/loaders/DRACOLoader.js');
  const decoder=new DRACOLoader();
  decoder.setDecoderPath(new URL('../vendor/draco/',import.meta.url).href);
  gltfLoader.setDRACOLoader(decoder);
}catch(error){console.warn('Optional Draco decoder unavailable',error);}
let modelLoading=false,selectedCatalogId='mens-tee',activeGarmentId=null;
const garmentSelect=document.getElementById('garmentSelect');
const modelStatus=document.getElementById('modelStatus');
const modelRetry=document.getElementById('modelRetry');
let retryModel=null;
function modelBusy(value){
  modelLoading=value;
  garmentSelect.disabled=value;
  syncGarmentButtons();
  for(const id of ['btnModel','btnShipped','btnFlip'])document.getElementById(id).disabled=value;
  stage.setAttribute('aria-busy',String(value));
}
function syncGarmentButtons(){
  for(const button of document.querySelectorAll('[data-garment]')){
    button.disabled=modelLoading;
    button.setAttribute('aria-pressed',String(button.dataset.garment===activeGarmentId));
  }
}
document.getElementById('garmentButtons').addEventListener('click',event=>{
  const button=event.target.closest('[data-garment]');
  if(button&&!button.disabled)loadCatalog(button.dataset.garment);
});

// Fetch once, share in-flight requests, and retain prepared models for revisits.
// Touch devices keep two decoded garments; remaining files stay ready in memory.
const catalogBytes=new Map(),catalogReady=new Map(),catalogPreparing=new Map();
const readyLimit=MOBILE?2:4;
async function getCatalogBytes(item){
  if(catalogBytes.has(item.id))return catalogBytes.get(item.id);
  const task=(async()=>{
    const stem=item.file.replace(/\.glb$/,'');
    const urls=['../garments/'+item.file,'../calibration/'+stem+'.json','../calibration/'+stem+'.bin'];
    return Promise.all(urls.map(async (path,index)=>{
      const url=new URL(path,import.meta.url);url.searchParams.set('v',index===0&&item.id==='womens-tee'?'35':'18');
      const response=await fetch(url);
      if(!response.ok)throw new Error('Garment asset could not load.');
      if(index===0&&window.ORBStartup?.active){
        const reader=response.body?.getReader(),total=Number(response.headers.get('Content-Length'));
        if(reader){
          const chunks=[];let loaded=0;
          try{for(;;){const {done,value}=await reader.read();if(done)break;chunks.push(value);loaded+=value.byteLength;
            if(total>0)window.ORBStartup.progress(.06+.74*Math.min(1,loaded/total),'Loading garment');
          }}finally{reader.releaseLock();}
          const bytes=new Uint8Array(loaded);let offset=0;for(const chunk of chunks){bytes.set(chunk,offset);offset+=chunk.byteLength;}
          return bytes.buffer;
        }
      }
      return index===1?response.json():response.arrayBuffer();
    }));
  })();
  catalogBytes.set(item.id,task);
  try{return await task;}catch(error){catalogBytes.delete(item.id);throw error;}
}
function trimCatalogCache(){
  for(const [id,res] of catalogReady){
    if(catalogReady.size<=readyLimit)break;
    if(res.group===current)continue;
    catalogReady.delete(id);res.group.userData.catalogCached=false;disposeModel(res.group);
  }
}
let placementCalibrationPromise=null;
function getPlacementCalibration(){
  if(!placementCalibrationPromise)placementCalibrationPromise=fetch(new URL('../calibration/placements-63.json',import.meta.url)).then(response=>{
    if(!response.ok)throw new Error('Placement calibration could not load.');return response.json();
  }).catch(error=>{placementCalibrationPromise=null;throw error;});
  return placementCalibrationPromise;
}
async function prepareCatalog(item){
  if(catalogReady.has(item.id)){
    const res=catalogReady.get(item.id);catalogReady.delete(item.id);catalogReady.set(item.id,res);return res;
  }
  if(catalogPreparing.has(item.id))return catalogPreparing.get(item.id);
  const task=(async()=>{
    let imported=null,res=null;
    try{
      const [bytes,meta,data]=await getCatalogBytes(item);
      if(window.ORBStartup?.active){
        window.ORBStartup.preparing();
        await new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve)));
      }
      const gltf=await gltfLoader.parseAsync(bytes,new URL('../garments/',import.meta.url).href);
      imported=gltf.scene;res=adopt(imported);
      await applyCalibration(res.group,item,[meta,data]);
      const extra=(await getPlacementCalibration())[item.id];
      if(!extra?.necktag)throw new Error('Additional garment placements are missing.');
      res.profiles={...calibratePlacements(res.group,item.type),...extra};
      if(item.type==='hoodie')res.group.traverse(mesh=>{
        if(!mesh.isMesh)return;
        for(const mat of Array.isArray(mesh.material)?mesh.material:[mesh.material]){
          if(mat.normalMap&&mat.metalness<.5){
            // The authored fleece roughness averages .93; .86 brings it near cotton's .80.
            mat.roughness*=.86;
          }
        }
      });
      disposeImported(imported);imported=null;
      res.group.userData.catalogCached=true;catalogReady.set(item.id,res);return res;
    }catch(error){
      if(imported){if(res)disposeImported(imported);else disposeModel(imported);}
      if(res)disposeModel(res.group);
      throw error;
    }finally{catalogPreparing.delete(item.id);}
  })();
  catalogPreparing.set(item.id,task);return task;
}
const idleSlot=()=>new Promise(resolve=>{
  if(window.requestIdleCallback)requestIdleCallback(resolve,{timeout:2500});else setTimeout(resolve,200);
});
let backgroundCatalogStarted=false;
async function preloadCatalog(){
  if(backgroundCatalogStarted)return; backgroundCatalogStarted=true;
  for(const item of GARMENT_CATALOG){
    await idleSlot();
    try{
      await getCatalogBytes(item);
      // Avoid retaining four large decoded texture sets on iPad and phones.
      if(!MOBILE){await idleSlot();await prepareCatalog(item);}
    }catch(error){/* Foreground selection exposes a retry; background failure is nonblocking. */}
  }
}

function disposeImported(root){
  // adopt() cloned geometry and material objects; its textures remain shared.
  root.traverse(o=>{if(o.isMesh){o.geometry.dispose();for(const m of Array.isArray(o.material)?o.material:[o.material])m.dispose();}});
}
function disposeModel(root){
  const textures=new Set();
  root.traverse(o=>{if(!o.isMesh)return;o.customDepthMaterial?.dispose();o.geometry.dispose();for(const m of Array.isArray(o.material)?o.material:[o.material]){for(const v of Object.values(m))if(v?.isTexture)textures.add(v);m.dispose();}});
  for(const t of textures)t.dispose();
}

async function applyCalibration(group,item,cached){
  const [meta,data]=cached|| (await getCatalogBytes(item)).slice(1);
  const meshes=[];group.traverse(o=>{if(o.isMesh)meshes.push(o);});
  for(const mesh of meshes){
    const g=mesh.geometry,part=meta.parts.find(p=>p.vertices===g.attributes.position.count&&p.indices===(g.index?.count||g.attributes.position.count));
    if(!part)throw new Error('Garment calibration does not match this model.');
    if(part.printUV)g.setAttribute('orbPrintUv',new THREE.BufferAttribute(new Float32Array(data,part.printUV.offset,part.printUV.count),2));
    if(part.motionAnchor)g.setAttribute('aMotionAnchor',new THREE.BufferAttribute(new Float32Array(data,part.motionAnchor.offset,part.motionAnchor.count),3));
    makeFlow(g,group.userData.halfWidth);
  }
}

function calibratePlacements(group,kind){
  // Pick the main cloth surface, excluding thread, cords, hardware and neck rib.
  const meshes=[];
  group.traverse(m=>{if(m.isMesh)meshes.push(m);});
  const candidates=meshes.filter(m=>(Array.isArray(m.material)?m.material:[m.material]).some(mat=>mat.map&&mat.normalMap));
  const body=(candidates.length?candidates:meshes).sort((a,b)=>(b.geometry.index?.count||b.geometry.attributes.position.count)-(a.geometry.index?.count||a.geometry.attributes.position.count))[0];
  group.updateMatrixWorld(true);
  const hoodie=kind==='hoodie',ray=new THREE.Raycaster(),profiles={};
  const targets={
    chest:[.10,hoodie?.455:.565,1],rightchest:[-.10,hoodie?.455:.565,1],
    front:[0,hoodie?.395:.44,1],back:[0,hoodie?.385:.445,-1],
    lowerback:[0,hoodie?.13:.15,-1]
  };
  function anchorFromRay(origin,direction){
    ray.set(new THREE.Vector3(...origin),new THREE.Vector3(...direction).normalize());
    const hits=ray.intersectObject(body,false);
    for(const hit of hits){
      // Only register outward-facing cloth with a non-collapsed native UV basis.
      if(hit.face.normal.dot(ray.ray.direction)>-.12)continue;
      try{return nativeAnchor(hit);}catch(error){/* try the next usable surface */}
    }
    return null;
  }
  for(const [slot,[x,y,side]] of Object.entries(targets)){
    // Small fallback offsets keep the anchor on cloth if the center falls on a seam.
    for(const dx of [0,.015,-.015,.03,-.03]){
      const anchor=anchorFromRay([x+dx,y,side*2],[0,0,-side]);
      if(anchor){profiles[slot]=anchor;break;}
    }
  }
  for(const [slot,sign] of [['leftshoulder',1],['rightshoulder',-1]]){
    const levels=hoodie?[.47,.45,.49,.43]:[.55,.53,.57,.51];
    for(const y of levels){
      const anchor=anchorFromRay([sign*2,y,.025],[-sign,0,0]);
      if(anchor){profiles[slot]=anchor;break;}
    }
  }
  if(hoodie)for(const slot of ['front','back','lowerback'])if(profiles[slot])profiles[slot].printScale=.78;
  const missing=STANDARD_PLACEMENTS.filter(k=>!profiles[k]);
  if(missing.length)throw new Error('Could not calibrate garment placements: '+missing.join(', '));
  return profiles;
}
async function loadCatalog(id){
  if(modelLoading)return false;
  if(id===activeGarmentId)return true;
  const item=GARMENT_CATALOG.find(g=>g.id===id);if(!item)return false;
  const initialLoad=!current;
  cancelAnchorPick();
  modelBusy(true);modelRetry.hidden=true;retryModel=()=>loadCatalog(id);
  modelStatus.textContent='Loading '+item.label+'…';
  bootMsg.textContent='Loading '+item.label+'…';
  document.getElementById('boot').classList.toggle('gone',!!current);
  try{
    const res=await prepareCatalog(item);
    if(current)recordArtUndo();
    UV_PROFILES=res.profiles;modelKind='catalog';
    setGarment(res.group,false);trimCatalogCache();
    selectedCatalogId=id;activeGarmentId=id;customModelFile=null;customFlipped=false;
    for(const layer of artLayers)migratePlacement(layer,layerProfile(layer));

    garmentSelect.querySelector('option[value="custom"]')?.remove();
    garmentSelect.value=id;
    document.getElementById('modelName').textContent=item.label;
    document.getElementById('rowFit').hidden=true;
    document.getElementById('modelName').dataset.garmentId=id;
    document.getElementById('modelName').dataset.triangles=res.tris;
    garment.rotation.y=0;
    requestArtworkRender();syncArtworkUi();applyLook();if(initialLoad)setView('angle');else if(state.view==='neck'||state.view?.startsWith('placement:'))setView(state.view);
    if(inspectionFocus?.slot&&SLEEVE_CAMERA_PIVOTS[id]?.[inspectionFocus.slot]){
      inspectionFocus.point.fromArray(cameraPlacementPoint(inspectionFocus.slot));inspectionFocus.point.y-=.350;updateInspectionFocus();
    }
    modelStatus.textContent='';artStatus('');workspace?.notify();
    return true;
  }catch(error){
    console.error('Garment load failed',error);
    garmentSelect.value=activeGarmentId||selectedCatalogId;
    modelStatus.textContent='Could not load '+item.label+'. Check your connection and retry.';
    bootMsg.textContent=current?'':modelStatus.textContent;
    modelRetry.hidden=false;
    return false;
  }finally{
    modelBusy(false);
    if(current)document.getElementById('boot').classList.add('gone');
  }
}
garmentSelect.addEventListener('change',()=>loadCatalog(garmentSelect.value));
modelRetry.addEventListener('click',()=>retryModel?.());
async function loadModel(file){
  if(modelLoading){artStatus('A model is already loading.');return;}
  if(!/\.glb$/i.test(file.name)){artStatus('Choose a GLB with embedded textures.');return;}
  modelBusy(true);modelRetry.hidden=true;
  const initialLoad=!current;
  const url=URL.createObjectURL(file);
  bootMsg.textContent='Reading custom garment…';
  document.getElementById('boot').classList.toggle('gone',!!current);
  let imported=null,res=null,committed=false;
  try{
    const gltf=await gltfLoader.loadAsync(url);imported=gltf.scene;
    res=adopt(imported);disposeImported(imported);imported=null;
    if(current)recordArtUndo();
    cancelAnchorPick();UV_PROFILES={};modelKind='custom';
    setGarment(res.group,true);committed=true;activeGarmentId='custom';customModelFile=file;customFlipped=false;trimCatalogCache();
    if(!garmentSelect.querySelector('option[value="custom"]'))garmentSelect.add(new Option('Custom garment','custom'));
    garmentSelect.value='custom';
    requestArtworkRender();syncArtworkUi();applyLook();artStatus('');
    garment.rotation.y=0;
    document.getElementById('modelName').textContent='Custom garment';
    document.getElementById('modelName').dataset.garmentId='custom';
    document.getElementById('fitNote').textContent=`H 74cm · W ${Math.round(res.size.x*100)}cm`;
    document.getElementById('rowFit').hidden=false;
    modelStatus.textContent='';if(initialLoad)setView('front');else if(state.view==='neck'||state.view?.startsWith('placement:'))setView('detail');return true;
  }catch(error){
    console.error(error);
    if(imported){if(res)disposeImported(imported);else disposeModel(imported);}
    if(res&&!committed)disposeModel(res.group);
    modelStatus.textContent='That file could not open. Choose a GLB with embedded textures and UVs.';
    bootMsg.textContent=modelStatus.textContent;return false;
  }finally{
    URL.revokeObjectURL(url);modelBusy(false);
    if(current)document.getElementById('boot').classList.add('gone');
  }
}

/* ================================= state ================================= */

const THEMES={
  light:{bg:BRAND.light.wash||BRAND.light.paper},
  dark:{bg:BRAND.dark.paper},
};
const systemColorScheme=matchMedia('(prefers-color-scheme: dark)');
const state={ ...CREATIVE_DEFAULTS,runwayPaused:REDUCED,afterglowPaused:REDUCED,projectorPaused:REDUCED,themeMode:'system', theme:'light', blank:0, garmentCustom:'#D8D8D8', artGlossiness:50, matchFabricToTheme:false, bg:THEMES.light.bg, dotGrid:true, gridType:'square', gridColor:BRAND.light.grid, gridColorCustom:false, gridStroke:0.5, gridScale:35, gridCharSize:45, light:'studio', lightPower:100, blackLightPower:100, regularLightPower:100, nightLightPower:100, nightTraffic:'subtle', nightPaused:REDUCED, lightLocked:true, nightGreen:NIGHT_DEFAULTS.green, nightMagenta:NIGHT_DEFAULTS.magenta, selfShadows:true, wind:1, view:'angle',
  inertia:{enabled:true,strength:15,ramp:100,settle:0.5,elasticity:60,overshoot:70,release:70,sensitivity:50,bias:25,sleeve:100,arc:100},
  focus:new THREE.Vector3(0,.02,0),focusTarget:new THREE.Vector3(0,.02,0),az:0.62, el:1.30, r:1.55, taz:0.62, tel:1.30, tr:1.55, present:false };
const WIND_LEVELS=[0,0.011,0.024];

function currentGarment(){
  return state.blank==='custom'
    ? { name:'Custom', hex:state.garmentCustom, dark:(new THREE.Color(state.garmentCustom).r*0.299 + new THREE.Color(state.garmentCustom).g*0.587 + new THREE.Color(state.garmentCustom).b*0.114) < 0.48 }
    : GARMENTS[state.blank];
}
function inkHex(entry,mode=entry?.mode){
  if(mode==='tint')return entry?.tintCustom||'#FFFFFF';
  if(entry?.inkCustom)return entry.inkCustom;
  const color=new THREE.Color(currentGarment().hex);
  const luminance=color.r*.2126+color.g*.7152+color.b*.0722;
  // Pick the more legible ink on the actual garment, including custom colors.
  return luminance<.2?'#FFFFFF':'#181818';
}
function applyTheme(resetStage=true){
  state.theme=state.themeMode==='system'?(systemColorScheme.matches?'dark':'light'):state.themeMode;
  document.body.dataset.theme=state.theme;
  document.documentElement.dataset.theme=state.theme;
  document.documentElement.style.colorScheme=state.theme;
  const palette=BRAND[state.theme];
  for(const [property,value] of Object.entries({paper:palette.paper,wash:palette.wash||palette.paper,ink:palette.ink,accent:palette.accent}))document.body.style.setProperty('--'+property,value);
  if(state.light!=='uv'&&!state.gridColorCustom){state.gridColor=palette.grid;document.getElementById('gridColor').value=state.gridColor;}
  document.querySelectorAll('[data-theme-mode]').forEach(button=>{
    button.setAttribute('aria-pressed',String(button.dataset.themeMode===state.themeMode));
  });
  if(resetStage&&state.light!=='uv'){
    state.bg=THEMES[state.theme].bg;
    document.getElementById('bgCustom').value=state.bg;
    document.getElementById('bgColorChip').style.background=state.bg;
  }
  applyBackground();
}
function mod(n,m){ return ((n % m) + m) % m; }
function patternNumberLabel(rel){
  if(rel===0) return '';
  if(rel<0) return String(mod((-rel-1),5)+1);
  return String(5 - mod(rel-1,5));
}
function patternLetterLabel(index){
  const letters=['A','B','C','D'];
  return letters[mod(index,4)];
}
function drawPatternMark(x,y,kind,val,size,patternCtxOverride=null){
  const patternCtx=patternCtxOverride||document.getElementById('bgPattern').getContext('2d');
  const accent=state.gridColor;
  patternCtx.save();
  patternCtx.translate(x,y);
  patternCtx.strokeStyle=accent;
  patternCtx.fillStyle=accent;
  patternCtx.lineWidth=Math.max(1, size*0.08);
  if(kind==='plus'){
    const arm=size*0.52;
    patternCtx.beginPath();
    patternCtx.moveTo(-arm,0); patternCtx.lineTo(arm,0);
    patternCtx.moveTo(0,-arm); patternCtx.lineTo(0,arm);
    patternCtx.stroke();
  }else if(kind==='target'){
    const arm=size*0.52, rad=size*0.42;
    patternCtx.beginPath();
    patternCtx.moveTo(-arm,0); patternCtx.lineTo(arm,0);
    patternCtx.moveTo(0,-arm); patternCtx.lineTo(0,arm);
    patternCtx.stroke();
    patternCtx.beginPath();
    patternCtx.arc(0,0,rad,0,Math.PI*2);
    patternCtx.stroke();
  }else if(kind==='dot'){
    patternCtx.beginPath();
    patternCtx.arc(0,0,Math.max(1,size*0.08),0,Math.PI*2);
    patternCtx.fill();
  }else if(kind==='text'){
    patternCtx.font=`500 ${Math.max(3,size)}px Rubik, sans-serif`;
    patternCtx.textAlign='center';
    patternCtx.textBaseline='middle';
    patternCtx.fillText(val,0,0);
  }
  patternCtx.restore();
}
function drawPatternBackground(target=null){
  const patternCanvas=target||document.getElementById('bgPattern'),patternCtx=patternCanvas.getContext('2d');
  const w=target?target.width:window.innerWidth||1,h=target?target.height:window.innerHeight||1;
  const dpr=target?1:Math.min(2, window.devicePixelRatio||1);
  if(patternCanvas.width!==Math.round(w*dpr) || patternCanvas.height!==Math.round(h*dpr)){
    patternCanvas.width=Math.round(w*dpr);
    patternCanvas.height=Math.round(h*dpr);
  }
  patternCtx.setTransform(dpr,0,0,dpr,0,0);
  patternCtx.clearRect(0,0,w,h);
  patternCtx.fillStyle=state.bg;
  patternCtx.fillRect(0,0,w,h);
  if(!state.dotGrid) return;

  const mobileGridFactor = target?Math.max(w,h)/1600:w <= 820 ? 0.72 : 1;
  const spacing=128*(state.gridScale/100)*mobileGridFactor;
  const charSize=13*(state.gridCharSize/100)*(target?Math.max(w,h)/1600:1);
  const markSize=Math.max(3, charSize*0.95);
  const cx=w*0.5, cy=h*0.5;
  if(state.gridType==='square'){
    patternCtx.strokeStyle=state.gridColor;patternCtx.lineWidth=state.gridStroke;
    const offset=(Math.round(state.gridStroke*dpr)%2)*0.5;
    const snap=v=>(Math.round(v*dpr)+offset)/dpr;
    patternCtx.beginPath();
    for(let x=mod(cx,spacing);x<w;x+=spacing){patternCtx.moveTo(snap(x),0);patternCtx.lineTo(snap(x),h);}
    for(let y=mod(cy,spacing);y<h;y+=spacing){patternCtx.moveTo(0,snap(y));patternCtx.lineTo(w,snap(y));}
    patternCtx.stroke();return;
  }
  const colCount=Math.ceil(w/spacing)+3;
  const rowCount=Math.ceil(h/spacing)+3;

  for(let row=-rowCount; row<=rowCount; row++){
    const y=cy + row*spacing;
    for(let col=-colCount; col<=colCount; col++){
      const x=cx + col*spacing;
      const evenCol = mod(col,2)===0;
      const evenRow = mod(row,2)===0;
      const isMajor = col!==0 && row!==0 && mod(col,5)===0 && mod(row,5)===0;

      let kind='dot', value='';
      if(row===0 && evenCol){
        kind='text';
        value=patternLetterLabel(Math.floor(col/2));
      }else if(col===0 && evenRow && row!==0){
        kind='text';
        value=patternLetterLabel(Math.floor(-row/2));
      }else if(evenCol && row!==0){
        kind='text';
        value=patternNumberLabel(row);
      }else if(isMajor){
        kind='target';
      }else if(!evenCol){
        kind='plus';
      }

      drawPatternMark(x,y,kind,value, kind==='text' ? charSize : markSize,patternCtx);
    }
  }
}
function applyBackground(){
  document.body.style.background=getComputedStyle(document.body).getPropertyValue('--paper').trim() || state.bg;
  stage.style.background='transparent';
  renderer.setClearColor(0x000000,0);
  drawPatternBackground();
}
// UV tint changes the rendered cloth only. Stored colors and artwork stay intact.
function renderedFabricColor(hex){
  const color=new THREE.Color(hex);
  if(state.light!=='uv')return color;
  const hi=Math.max(color.r,color.g,color.b),lo=Math.min(color.r,color.g,color.b);
  const saturation=hi>0?(hi-lo)/hi:0;
  const white=THREE.MathUtils.smoothstep(lo,.55,.85)*(1-THREE.MathUtils.smoothstep(saturation,.08,.30));
  return color.lerp(new THREE.Color('#A4B2FF'),white);
}
function syncFabricColors(){
  const color=renderedFabricColor(currentGarment().hex);
  const sync=root=>{
    if(!root)return;
    root.traverse(o=>{
      if(!o.isMesh)return;
      const mats=Array.isArray(o.material)?o.material:[o.material];
      mats.forEach(m=>{if(m?.userData.orbTintable&&m.color)m.color.fromArray(m.userData.orbBaseColor).multiply(color);});
    });
  };
  sync(current);
  if(presentCloneActive)sync(presentGarment);
}
function applyLook(){
  const g=currentGarment();
  syncFabricColors();
  // Only unfixed Single ink layers follow the garment. Repaint their panels
  // when the contrasting ink changes, not on every garment-color input event.
  for(const layer of artLayers){
    if(layer.mode!=='ink'||layer.inkCustom)continue;
    const q=layerProfile(layer);if(!q)continue;
    const color=artworkMaps.get(q.mesh||1)?.quads.get(layer.id)?.material.uniforms.uInkColor.value;
    if(!color||color.getHexString().toUpperCase()!==inkHex(layer).slice(1).toUpperCase())requestArtworkRender(layer);
  }
  syncInkUi();
  document.getElementById('blankName').textContent=g.name;
}
applyTheme(true);
applyLightingPreset();


// Movement controls use a shared proportional placement reference.
const ART_INPUT_META={
  x:{min:-100,max:100,step:1},
  y:{min:-100,max:100,step:1},
  scale:{min:25,max:200,step:1},
  rot:{min:-180,max:180,step:1},
};
function artDefault(slot,prop){
  const entry=artEntry();
  if(prop==='scale'&&entry?.slot===slot){
    if(hasFullSleeve(entry)&&entry.sleevePreset==='full')return 100;
    if(entry.defaultSlot===slot)return entry.defaultScale??ART_DEFAULTS[slot].scale;
  }
  return ART_DEFAULTS[slot][prop];
}

let activeArtSlot='back';
const artControlElements=Object.fromEntries(['x','y','scale','rot'].map(prop=>[prop,{
  range:document.querySelector(`[data-art-range][data-prop="${prop}"]`),
  num:document.querySelector(`[data-art-num][data-prop="${prop}"]`)
}]));
function artControlPair(slot,prop){return artControlElements[prop];}

function artScaleMax(entry){
  // Retain an enlarged sleeve value when switching to a short-sleeved garment.
  return ART_META[entry?.slot]?.side==='Sleeve'&&entry?.sleevePreset==='full'?600:200;
}
function artInputBounds(entry,prop){
  const meta=ART_INPUT_META[prop],value=entry?.placement?.[prop];
  const current=value===undefined?0:prop==='scale'?value*100:(prop==='x'||prop==='y')?value/.0018:value;
  return {min:Math.min(meta.min,Math.floor(current)),max:Math.max(prop==='scale'?artScaleMax(entry):meta.max,Math.ceil(current))};
}
function normalizeArtValue(slotForNormalize,prop,raw,entry=artEntry()){
  const meta=ART_INPUT_META[prop],{min,max}=artInputBounds(entry,prop);
  let v=Number(raw);
  if(!Number.isFinite(v)) v=artDefault(slotForNormalize, prop);
  v=Math.round(v/meta.step)*meta.step;
  v=clamp(v, min, max);
  if(prop!=='scale' && Math.abs(v)<meta.step) v=0;
  return v;
}

function applyArtValue(id,prop,raw){
  const entry=artEntry(id);if(!entry)return;
  const v=normalizeArtValue(entry.slot,prop,raw,entry),A=entry.placement;
  if(prop==='x'||prop==='y')A[prop]=v*.0018;
  else if(prop==='scale')A.scale=v/100;
  else A.rot=v;
  if(id===activeArtId){const pair=artControlPair(entry.slot,prop);pair.range.value=String(v);pair.num.value=String(v);}
  requestArtworkRender(entry);
}

/* =============================== controls =============================== */

// Capture an artwork anchor from the selected triangle's native UVs.
// Local right/down distances remain in garment units; the texture is never projected.
let anchorPickId=null;
const printRay=new THREE.Raycaster();
function nativeAnchor(hit){
  const mesh=hit.object,g=mesh.geometry,p=g.attributes.position,uv=g.attributes.uv;
  if(!uv||!hit.face||!hit.uv)throw new Error('This surface needs native UV coordinates.');
  const {a,b,c}=hit.face;
  const chart=g.getAttribute('orbPrintUv');
  if(chart){
    const local=mesh.worldToLocal(hit.point.clone());
    const tri=new THREE.Triangle(...[a,b,c].map(i=>new THREE.Vector3().fromBufferAttribute(p,i)));
    const weights=tri.getBarycoord(local,new THREE.Vector3());
    const origin=[0,0];[a,b,c].forEach((index,k)=>{origin[0]+=chart.getX(index)*weights.getComponent(k);origin[1]+=chart.getY(index)*weights.getComponent(k);});
    return {origin,basis:[1,0,0,1],point:local.toArray(),normal:tri.getNormal(new THREE.Vector3()).toArray(),mesh:mesh.userData.orbMeshId,island:g.getAttribute('aPrintIsland').getX(a)};
  }

  const pa=new THREE.Vector3().fromBufferAttribute(p,a);
  const e1=new THREE.Vector3().fromBufferAttribute(p,b).sub(pa);
  const e2=new THREE.Vector3().fromBufferAttribute(p,c).sub(pa);
  const n=new THREE.Vector3().crossVectors(e1,e2).normalize();
  const up=new THREE.Vector3(0,1,0).addScaledVector(n,-n.y).normalize();
  if(up.lengthSq()<0.01)up.set(0,0,-1);
  const right=new THREE.Vector3().crossVectors(up,n).normalize(),down=up.negate();
  const x1=e1.dot(right),y1=e1.dot(down),x2=e2.dot(right),y2=e2.dot(down);
  const det=x1*y2-x2*y1;
  if(Math.abs(det)<1e-12)throw new Error('Choose a flatter point on the garment.');
  const u1=uv.getX(b)-uv.getX(a),u2=uv.getX(c)-uv.getX(a);
  const v1=uv.getY(b)-uv.getY(a),v2=uv.getY(c)-uv.getY(a);
  const basis=[(u1*y2-u2*y1)/det,(u2*x1-u1*x2)/det,(v1*y2-v2*y1)/det,(v2*x1-v1*x2)/det];
  if(Math.abs(basis[0]*basis[3]-basis[1]*basis[2])<1e-8)throw new Error('This surface has collapsed UVs. Choose another point.');
  return {origin:hit.uv.toArray(),basis,point:mesh.worldToLocal(hit.point.clone()).toArray(),normal:n.toArray(),mesh:mesh.userData.orbMeshId,island:g.getAttribute('aPrintIsland').getX(a)};
}
function cancelAnchorPick(){
  anchorPickId=null;canvas.style.cursor='';document.getElementById('positionHint').hidden=true;
}
function beginAnchorPick(id){
  const entry=artEntry(id);if(!current||!entry)return;
  if(state.present)exitPresent();
  selectArtwork(id);anchorPickId=id;canvas.style.cursor='crosshair';
  document.getElementById('positionHintText').textContent=`Tap the garment to position ${entry.name}`;
  document.getElementById('positionHint').hidden=false;
}

function pickNativePosition(e){
  const bounds=stage.getBoundingClientRect();
  printRay.setFromCamera(new THREE.Vector2((e.clientX-bounds.left)/bounds.width*2-1,1-(e.clientY-bounds.top)/bounds.height*2),camera);
  current.updateMatrixWorld(true);
  const hits=printRay.intersectObject(current,true),hit=hits.find(h=>h.object.geometry.attributes.uv);
  if(!hit){artStatus('Tap the garment surface to choose a position.');return;}
  try{
    const entry=artEntry(anchorPickId);if(!entry){cancelAnchorPick();return;}
    const anchor=nativeAnchor(hit);anchor.printScale=layerProfile(entry)?.printScale||1;recordArtUndo();entry.anchor=anchor;
    entry.placement.x=0;entry.placement.y=0;
    requestArtworkRender();cancelAnchorPick();syncArtworkUi();
    artStatus('');
  }catch(error){artStatus(error.message);}
}

let dragging=false,lastX=0,lastY=0,pinch=0;
let orbitInputVelocity=0;
let lastOrbitInputTime=performance.now();

canvas.addEventListener('pointerdown',e=>{
  if(anchorPickId){e.preventDefault();pickNativePosition(e);return;}
  dragging=true; lastX=e.clientX; lastY=e.clientY;
  orbitInputVelocity=0;
  inertiaInput=0;
  inertiaVelocity=0;
  inertiaReleaseKick=0;
  inertiaLoadTarget=inertiaTwist;
  inertiaLastMotionVelocity=0;
  lastOrbitInputTime=performance.now();
  canvas.setPointerCapture(e.pointerId); canvas.classList.add('drag');
  if(state.present) exitPresent();
});
canvas.addEventListener('pointermove',e=>{
  if(!dragging) return;
  const now=performance.now();
  const dx=e.clientX-lastX;
  const sampleDt=Math.max(0.008,Math.min(0.08,(now-lastOrbitInputTime)/1000));
  const dAz=-dx*0.008;
  state.taz+=dAz;
  state.tel=clamp(state.tel-(e.clientY-lastY)*0.006,0.55,2.05);

  // Raw manual orbit speed in radians/second. A short low-pass happens
  // in the animation loop before this becomes fabric motion.
  orbitInputVelocity=clamp(dAz/sampleDt,-6.0,6.0);
  if(Math.abs(orbitInputVelocity)>0.03) inertiaLastMotionVelocity=orbitInputVelocity;
  lastOrbitInputTime=now;
  lastX=e.clientX; lastY=e.clientY; setView(null);
});
function endOrbitDrag(){
  if(dragging){
    // The shirt has been "loaded" in the lag direction while held.
    // On release, inject momentum toward neutral so it catches up, crosses
    // through, then oscillates with the Overshoot / Settle controls.
    const releaseAmt=state.inertia.release/100;
    const loadKick=-inertiaTwist * (4.0 + 4.0*releaseAmt) * releaseAmt;
    const speedKick=-inertiaLastMotionVelocity * 0.010 * releaseAmt;
    inertiaReleaseKick=loadKick + speedKick;
    inertiaLoadTarget=0;
  }
  dragging=false;
  orbitInputVelocity=0;
  canvas.classList.remove('drag');
}
addEventListener('pointerup',endOrbitDrag);
addEventListener('pointercancel',endOrbitDrag);
canvas.addEventListener('wheel',e=>{
  e.preventDefault();
  if(state.present && isMobilePresent()) return;
  zoomGarment(e.deltaY*.0012);
},{passive:false});
canvas.addEventListener('touchmove',e=>{
  if(e.touches.length!==2) return;
  e.preventDefault();

  // Mobile Present is a fixed presentation view. No pinch zoom is allowed;
  // touching the shield exits back to the normal interactive view instead.
  if(state.present && isMobilePresent()){
    pinch=0;
    return;
  }

  const d=Math.hypot(e.touches[0].clientX-e.touches[1].clientX,
                     e.touches[0].clientY-e.touches[1].clientY);
  if(pinch)zoomGarment((pinch-d)*.004);
  pinch=d;
},{passive:false});
canvas.addEventListener('touchend',()=>{pinch=0;});

canvas.tabIndex=0;
canvas.setAttribute('aria-label','Garment preview. Arrow keys rotate.');
canvas.addEventListener('keydown',e=>{
  const k={ArrowLeft:[-0.14,0],ArrowRight:[0.14,0],ArrowUp:[0,0.10],ArrowDown:[0,-0.10]}[e.key];
  if(!k) return; e.preventDefault();
  state.taz+=k[0]; state.tel=clamp(state.tel-k[1],0.55,2.05); setView(null);
});

let inspectionFocus=null;
const garmentCenter=new THREE.Vector3(0,.02,0);
function zoomGarment(delta){
  state.tr=clamp(state.tr+delta,inspectionFocus?(SLEEVE_CAMERA_CLEARANCE[activeGarmentId]?.[inspectionFocus.slot]??.08):.38,2.6);
  updateInspectionFocus();
}
function updateInspectionFocus(){
  if(!inspectionFocus)return;
  const end=(GARMENT_CATALOG.find(g=>g.id===activeGarmentId)?.distance||1.55)*.88;
  const t=clamp((state.tr-inspectionFocus.distance)/(end-inspectionFocus.distance),0,1);
  state.focusTarget.lerpVectors(inspectionFocus.point,garmentCenter,t*t*(3-2*t));
  if(t===1){state.focusTarget.copy(garmentCenter);inspectionFocus=null;}
}
function leaveInspection(){
  if(!inspectionFocus)return;
  inspectionFocus=null;state.focusTarget.copy(garmentCenter);
  state.tr=GARMENT_CATALOG.find(g=>g.id===activeGarmentId)?.distance||1.55;
}
const VIEWS={front:[0,1.45],angle:[.62,1.30],side:[Math.PI/2,1.45],backangle:[Math.PI-.62,1.30],back:[Math.PI,1.45],detail:[.45,1.35]};
function cameraPlacementPoint(slot){
  return SLEEVE_CAMERA_PIVOTS[activeGarmentId]?.[slot]||UV_PROFILES[slot]?.point;
}
function viewArtwork(slot){
  const meta=ART_META[slot],q=UV_PROFILES[slot];
  setView(meta.detail&&!isCustom?'placement:'+slot:meta.view);
  if(q&&!isCustom){
    state.focusTarget.fromArray(cameraPlacementPoint(slot));state.focusTarget.y-=.350;
    state.tr=meta.side==='Inside'?.48:.60;
    inspectionFocus={point:state.focusTarget.clone(),distance:state.tr,slot};
  }
}
function detailCamera(view){
  const slot=view==='neck'?'necktag':view?.startsWith('placement:')?view.slice(10):null;
  if(!slot||isCustom||!UV_PROFILES[slot])return null;
  const q=UV_PROFILES[slot],meta=ART_META[slot],wrist=slot.endsWith('wrist');
  const point=cameraPlacementPoint(slot);
  const az=wrist?Math.atan2(q.normal[0],q.normal[2]):meta.side==='Back'?Math.PI:0;
  return {point:[point[0],point[1]-.350,point[2]],angles:[az,slot==='necktag'?1.12:wrist?1.4:1.35],distance:slot==='necktag'?.48:wrist?.40:slot==='backneck'?.46:slot==='lowerback'?.80:.60};
}
function setView(v){
  const placement=v?.startsWith('placement:')?v.slice(10):null;
  if(placement&&(isCustom||!UV_PROFILES[placement]))v='detail';
  if(v==='neck'&&(isCustom||!UV_PROFILES.necktag))v='detail';
  state.view=v;syncCameraUi();
  if(!v) return;
  inspectionFocus=null;state.focusTarget.set(0,.02,0);
  state.tr=GARMENT_CATALOG.find(g=>g.id===activeGarmentId)?.distance||1.55;
  if(v.startsWith('placement:')){
    const shot=detailCamera(v),[az,el]=shot.angles;
    state.focusTarget.fromArray(shot.point);
    state.taz=az+Math.round((state.taz-az)/(Math.PI*2))*Math.PI*2;
    state.tel=el;state.tr=shot.distance;
    inspectionFocus={point:state.focusTarget.clone(),distance:state.tr,slot:placement};return;
  }
  const special={insideleft:[-.1,1.45],insideright:[.1,1.45],neck:[0,1.12]};
  const [az,el]=special[v]||(v==='left'?[Math.PI/2,1.3]:v==='right'?[-Math.PI/2,1.3]:VIEWS[v]);
  state.taz=az+Math.round((state.taz-az)/(Math.PI*2))*Math.PI*2;
  state.tel=el;
  if(!isCustom&&(v==='left'||v==='right')){
    const slot=v==='left'?'leftshoulder':'rightshoulder',point=cameraPlacementPoint(slot);
    if(point){state.focusTarget.fromArray(point);state.focusTarget.y-=.350;state.tr=.60;inspectionFocus={point:state.focusTarget.clone(),distance:state.tr,slot};}
  }
  if(v==='neck'){
    state.focusTarget.fromArray(UV_PROFILES.necktag.point);state.focusTarget.y-=.350;state.tr=.48;
    inspectionFocus={point:state.focusTarget.clone(),distance:state.tr};
  }
  if(v==='detail'){
    state.tr*=.67;state.focusTarget.set(0,.13,0);
    inspectionFocus={point:state.focusTarget.clone(),distance:state.tr};
  }
}

/* ================================== UI ================================== */

const sw=document.getElementById('swatches');
function useManualFabricColor(){
  state.matchFabricToTheme=false;
  document.getElementById('matchFabricToTheme').checked=false;
}
function syncGarmentSwatches(){
  for(const button of sw.querySelectorAll('button[data-blank]'))button.setAttribute('aria-checked',String(state.blank===Number(button.dataset.blank)));
  const custom=sw.querySelector('.custom');if(custom)custom.setAttribute('aria-checked',String(state.blank==='custom'));
}
function renderGarmentSwatches(){
  sw.innerHTML='';
  GARMENTS.forEach((g,i)=>{
    const b=document.createElement('button');
    b.className='sw'; b.type='button'; b.role='radio';b.dataset.blank=String(i);
    b.setAttribute('aria-checked',String(state.blank===i));
    b.setAttribute('aria-label',g.name);
    b.dataset.tip=`Set the shirt color to ${g.name}.`;
    b.innerHTML=`<i style="background:${g.hex}"></i>`;
    b.onclick=()=>{
      useManualFabricColor();
      state.blank=i;
      syncGarmentSwatches();
      applyLook();
    };
    sw.appendChild(b);
  });

  const custom=document.createElement('label');
  custom.className='sw custom';
  custom.role='radio';
  custom.setAttribute('aria-checked',String(state.blank==='custom'));
  custom.setAttribute('aria-label','Custom garment colour');
  custom.dataset.tip='Choose a custom garment color.';
  custom.innerHTML=`<i style="background:${state.garmentCustom}"></i><span class="pickerGlyph" aria-hidden="true"><svg viewBox="0 0 24 24"><path d="m19 3 2 2-8.5 8.5-3-3z"></path><path d="m8.8 11.2-4.3 4.3v4h4l4.3-4.3"></path></svg></span><input id="garmentCustom" type="color" value="${state.garmentCustom}" aria-label="Custom garment color">`;
  const picker=custom.querySelector('input');
  const activateCustom=()=>{
    useManualFabricColor();
    state.blank='custom';
    state.garmentCustom=picker.value;
    syncGarmentSwatches();
    applyLook();
  };
  picker.addEventListener('input',()=>{
    useManualFabricColor();
    state.blank='custom';
    state.garmentCustom=picker.value;
    syncGarmentSwatches();
    custom.querySelector('i').style.background=picker.value;
    applyLook();
  });
  picker.addEventListener('change',activateCustom);
  custom.addEventListener('click',activateCustom);
  sw.appendChild(custom);
  sw.insertAdjacentHTML('beforeend','<button type="button" class="color-sample" data-sample-target="garmentCustom" aria-label="Sample fabric color" title="Sample fabric color"></button><button type="button" class="slider-reset" data-reset-color="garmentCustom" aria-label="Reset fabric color" title="Reset fabric color"></button>');
}
renderGarmentSwatches();

/* ============================ utilitarian tooltips ============================ */
const uiTooltip=document.getElementById('uiTooltip');
let tooltipTimer=0;
let tooltipTarget=null;

function setTip(selector,text){
  document.querySelectorAll(selector).forEach(el=>{
    el.dataset.tip=text;
    // Prevent a second native tooltip from appearing on top of the custom one.
    if(el.hasAttribute('title')) el.removeAttribute('title');
  });
}
function setControlTip(id,text,alsoNumberId=null){
  setTip(`#${id}`,text);
  setTip(`label[for="${id}"]`,text);
  if(alsoNumberId) setTip(`#${alsoNumberId}`,text);
}

const staticTips=[
  ['#segView button[data-v="front"]','Camera 1: move to a straight front view.'],
  ['#segView button[data-v="angle"]','Camera 2: Front three-quarter. Show depth, chest artwork, and sleeve detail.'],
  ['#segView button[data-v="side"]','Camera 3: Side. Review sleeve patches and full-length sleeve graphics.'],
  ['#segView button[data-v="backangle"]','Camera 4: Back three-quarter. Show back artwork and garment shape.'],
  ['#segView button[data-v="back"]','Camera 5: Back. Check back artwork and alignment.'],
  ['#segView button[data-v="detail"]','Camera 6: Detail. Inspect chest fabric and print; zoom out to recenter.'],

  ['#segLight button[data-v="studio"]','Soft neutral studio lighting for evaluating fabric and print.'],
  ['#segLight button[data-v="softbox"]','Even neutral illumination with gentle highlights and filled shadows.'],
  ['#segLight button[data-v="day"]','Warm outdoor daylight with cool sky fill.'],
  ['#segLight button[data-v="night"]','Dim streetlight with passing headlights and occasional red brake lights.'],
  ['#segLight button[data-v="uv"]','Dark violet lighting for checking UV-reactive fabric and artwork.'],

  ['#segWind button[data-v="0"]','Wind 1: no continuous breeze deformation. Rotation inertia can still move the shirt.'],
  ['#segWind button[data-v="1"]','Wind 2: gentle continuous fabric movement.'],
  ['#segWind button[data-v="2"]','Wind 3: stronger continuous fabric movement.'],

  ['#btnPresent','Enter presentation mode. Desktop shows synchronized front and back shirts; mobile keeps one centered shirt. Click the preview or press Escape to return.'],
  ['#btnSave','Export the current garment preview as an image.'],
  ['#btnHelp','Open a quick guide to the garment preview controls.'],
  ['[data-theme-mode="light"]','Use light mode.'],
  ['[data-theme-mode="system"]','Follow your device’s light or dark appearance, including automatic changes.'],
  ['[data-theme-mode="dark"]','Use dark mode.'],


  ['#customInkChoice','Choose an ink color for this design only.'],
  ['#bgCustom','Choose the preview background color.'],
  ['#bgCustom + *','Choose the preview background color.'],
  ['.colorSingle','Choose the preview background color.'],

  ['#dotGrid','Show or hide the pattern-paper grid behind the shirt.'],
  ['#btnModel','Replace the current shirt geometry with a .glb or .gltf model.'],
  ['#btnFlip','Rotate the imported 3D model 180° if it loads facing the wrong direction.'],

  ['#inertiaEnabled','Enable or disable rotation-driven fabric inertia. The Wind control remains separate.'],
  ['#resetInertia','Restore all Fabric Motion controls to their default values.']
];
staticTips.forEach(([selector,tip])=>setTip(selector,tip));

setControlTip('art-x','Move the selected artwork left or right.');
setControlTip('art-y','Move the selected artwork up or down.');
setControlTip('art-scale','Resize the selected artwork while preserving its proportions.');
setControlTip('art-rot','Rotate the selected artwork in degrees.');

setControlTip('artGlossiness','Change only the artwork surface finish. Left is matte; right is glossy. The shirt material is not changed.');
setControlTip('gridScale','Change the spacing between pattern-paper grid intersections. Smaller values make a tighter grid.','gridScaleNum');
setControlTip('gridCharSize','Change the size of grid letters, numbers, and symbols without changing grid spacing.','gridCharSizeNum');

setControlTip('inertiaStrength','Maximum amount of lag that can load into the loosest fabric while you rotate. Higher values allow a larger stored twist before release.','inertiaStrengthNum');
setControlTip('inertiaRamp','How slowly the lag loads while you are actively rotating. Higher values keep the lower shirt and sleeves behind for longer before they build toward the maximum lag.','inertiaRampNum');
setControlTip('inertiaSettle','How long the release motion takes to fade after you let go. Higher values make the catch-up and pendulum settling last longer.','inertiaSettleNum');
setControlTip('inertiaElasticity','Spring stiffness after release. Higher values make the shirt catch up and reverse direction more quickly, creating tighter oscillations.','inertiaElasticityNum');
setControlTip('inertiaOvershoot','Controls damping only after release. Higher values let the shirt cross its rest position more times before the pendulum motion fades.','inertiaOvershootNum');
setControlTip('inertiaRelease','How strongly the loaded fabric is kicked toward neutral when you let go. Higher values create a stronger first catch-up and swing-through.','inertiaReleaseNum');
setControlTip('inertiaSensitivity','How easily manual rotation loads the lag effect. Higher values respond to slower and smaller cursor rotations.','inertiaSensitivityNum');
setControlTip('inertiaBias','Concentrates the loaded lag toward the lower torso and hem. Higher values keep the upper shirt more anchored while the bottom trails behind.','inertiaBiasNum');
setControlTip('inertiaSleeve','Adds extra trailing lag to the sleeves and cuffs relative to the torso. Sleeves now drag behind the apparent shirt rotation rather than leading it.','inertiaSleeveNum');
setControlTip('inertiaArc','Blends sleeve motion from the garment-wide twist to a local shoulder-pivot arc. Higher values make cuffs swing inward on a curved path and preserve more sleeve volume at the peak.','inertiaArcNum');

// Section headers and artwork transform disclosures.
document.querySelectorAll('.sectionFold>summary').forEach(summary=>{
  const name=summary.textContent.trim();
  summary.dataset.tip=`Show or hide the ${name} controls.`;
});
document.querySelectorAll('.adjustFold>summary').forEach(summary=>{
  summary.dataset.tip='Show or hide placement, scale, and rotation controls for this artwork.';
});

// Preview itself.

function tooltipSource(node){
  return node instanceof Element ? node.closest('[data-tip]') : null;
}
function positionTooltip(target){
  const r=target.getBoundingClientRect();
  const gap=8;
  const pad=8;
  const tw=uiTooltip.offsetWidth;
  const th=uiTooltip.offsetHeight;

  let left=r.left + r.width/2 - tw/2;
  left=Math.max(pad,Math.min(innerWidth-tw-pad,left));

  let top=r.bottom+gap;
  if(top+th+pad>innerHeight) top=r.top-th-gap;
  top=Math.max(pad,top);

  uiTooltip.style.left=`${Math.round(left)}px`;
  uiTooltip.style.top=`${Math.round(top)}px`;
}
function showTooltip(target,immediate=false){
  clearTimeout(tooltipTimer);
  tooltipTarget=target;
  const show=()=>{
    if(!tooltipTarget || !document.contains(tooltipTarget)) return;
    uiTooltip.textContent=tooltipTarget.dataset.tip || '';
    if(!uiTooltip.textContent) return;
    uiTooltip.setAttribute('aria-hidden','false');
    uiTooltip.classList.add('show');
    positionTooltip(tooltipTarget);
  };
  if(immediate) show();
  else tooltipTimer=setTimeout(show,360);
}
function hideTooltip(){
  clearTimeout(tooltipTimer);
  tooltipTarget=null;
  uiTooltip.classList.remove('show');
  uiTooltip.setAttribute('aria-hidden','true');
}
document.addEventListener('pointerover',e=>{
  const target=tooltipSource(e.target);
  if(!target || target===tooltipTarget) return;
  showTooltip(target,false);
});
document.addEventListener('pointerout',e=>{
  const target=tooltipSource(e.target);
  if(!target) return;
  const next=tooltipSource(e.relatedTarget);
  if(next===target) return;
  hideTooltip();
});
document.addEventListener('focusin',e=>{
  const target=tooltipSource(e.target);
  if(target) showTooltip(target,true);
});
document.addEventListener('focusout',e=>{
  if(tooltipSource(e.target)) hideTooltip();
});
document.addEventListener('pointerdown',()=>hideTooltip(),true);
addEventListener('scroll',hideTooltip,{passive:true});
addEventListener('resize',hideTooltip);

const helpDialog=document.getElementById('helpDialog');
const btnHelp=document.getElementById('btnHelp');
const helpClose=document.getElementById('helpClose');

btnHelp.addEventListener('click',()=>{
  hideTooltip();
  if(typeof helpDialog.showModal==='function') helpDialog.showModal();
  else helpDialog.setAttribute('open','');
});
helpClose.addEventListener('click',()=>helpDialog.close());
helpDialog.addEventListener('click',e=>{
  if(e.target===helpDialog) helpDialog.close();
});
helpDialog.addEventListener('cancel',()=>hideTooltip());

function segment(id,fn){
  const el=document.getElementById(id);
  el.querySelectorAll('button[data-v]').forEach(b=>b.onclick=()=>{
    el.querySelectorAll('button').forEach(x=>x.setAttribute('aria-pressed',String(x===b)));
    fn(b.dataset.v);
  });
}

function syncInkUi(){
  const entry=artEntry(),disabled=artLoading||!entry;
  for(const button of document.querySelectorAll('[data-art-mode]')){
    button.disabled=disabled;button.setAttribute('aria-pressed',String(entry?.mode===button.dataset.artMode));
    button.closest('.art-mode-option').classList.toggle('selected',entry?.mode===button.dataset.artMode);
  }
  for(const [mode,id] of [['tint','tintCustom'],['ink','inkCustom']]){
    const input=document.getElementById(id),swatch=document.querySelector(`[data-art-color="${mode}"]`);
    input.disabled=disabled;swatch.disabled=disabled;
    const color=inkHex(entry,mode);input.value=color;swatch.style.setProperty('--swatch',color);swatch.dataset.sampleColor=color;
  }
  document.getElementById('solidSettings').hidden=!entry||entry.mode!=='ink';
  for(const [id,key,fallback] of [['solidCutoff','solidCutoff',12],['solidSoftness','solidSoftness',65],['solidSpread','solidSpread',0],['solidEdgeSoftness','solidEdgeSoftness',0]]){
    const input=document.getElementById(id);input.value=entry?.[key]??fallback;input.disabled=disabled;
    const number=document.getElementById(id+'Value');if(number){number.value=input.value;number.disabled=disabled;}
  }
  document.getElementById('solidMaskSource').value=entry?.solidMaskSource||'brightness';
  document.getElementById('solidMaskSource').disabled=disabled;
  for(const [id,fallback] of [['printPattern','none'],['printSize',40],['printAngle',45],['printMarkSize',50],['printTone',100],['printErosion',0],['printPixelScale',35]]){
    const input=document.getElementById(id);input.value=entry?.[id]??fallback;input.disabled=disabled;
    const number=document.getElementById(id+'Value');if(number){number.value=input.value;number.disabled=disabled;}
  }
  for(const id of ['printSize','printAngle','printMarkSize','printTone','printErosion'])document.getElementById(id).parentElement.hidden=entry?.printPattern==='pixel'||(entry?.printPattern==='grain'&&['printSize','printAngle'].includes(id));
  document.getElementById('printPixelScale').parentElement.hidden=entry?.printPattern!=='pixel';
  document.querySelector('label[for=printMarkSize]').textContent=entry?.printPattern==='lines'?'Line width':entry?.printPattern==='grain'?'Grain size':'Dot size';
  document.getElementById('printTextureControls').hidden=!entry||!hasPrintTexture({...entry,printStrength:100});
  document.getElementById('solidInvert').checked=!!entry?.solidInvert;
  document.getElementById('solidInvert').disabled=disabled||entry?.solidMaskSource==='alpha';
  document.getElementById('artEyedropper').disabled=disabled||entry.mode==='original';
  document.getElementById('artColorReset').disabled=disabled||entry.mode==='original';
  document.getElementById('artAppearanceReset').disabled=disabled;
}
function setArtworkMode(mode,openPicker=false){
  const entry=artEntry();if(artLoading||!entry||!['original','tint','ink'].includes(mode))return;
  colorPicker?.close();
  if(entry.mode!==mode){recordArtUndo();entry.mode=mode;requestArtworkRender(entry);}
  syncArtworkUi();
  if(openPicker&&mode!=='original')colorPicker?.open(document.getElementById(mode==='tint'?'tintCustom':'inkCustom'),document.querySelector(`[data-art-color="${mode}"]`));
}
let inkEditingEntry=null;
function setCustomArtworkInk(value,mode){
  const entry=artEntry();
  if(artLoading||!entry||entry.mode!==mode||!/^#[0-9a-f]{6}$/i.test(value))return;
  const prop=mode==='tint'?'tintCustom':'inkCustom';
  if(entry[prop]?.toLowerCase()===value.toLowerCase())return;
  if(inkEditingEntry!==entry){recordArtUndo();inkEditingEntry=entry;}
  entry[prop]=value.toUpperCase();requestArtworkRender(entry);syncInkUi();
}
for(const [id,mode] of [['inkCustom','ink'],['tintCustom','tint']]){
  const input=document.getElementById(id);
  input.addEventListener('input',()=>setCustomArtworkInk(input.value,mode));
  input.addEventListener('change',()=>{setCustomArtworkInk(input.value,mode);inkEditingEntry=null;});
  input.addEventListener('blur',()=>{inkEditingEntry=null;syncInkUi();});
}
for(const button of document.querySelectorAll('[data-art-mode]'))button.onclick=()=>setArtworkMode(button.dataset.artMode);
for(const button of document.querySelectorAll('[data-art-color]'))button.onclick=()=>setArtworkMode(button.dataset.artColor,true);

segment('segWind',v=>{state.wind=+v;});
function syncLightPowerControl(){
  const range=document.getElementById('lightPower'),number=document.getElementById('lightPowerValue');
  range.dataset.expandRange='true';range.dataset.baseMax='200';
  range.max=String(Math.min(Number.MAX_VALUE,Math.max(200,Math.ceil(state.lightPower/100)*100+100)));
  range.value=state.lightPower;number.value=state.lightPower;
  number.removeAttribute('max');
}
segment('segLight',v=>{
  state.light=v;state.lightPower=v==='uv'?state.blackLightPower:v==='night'?state.nightLightPower:isCreative(v)?state[v+'Power']:state.regularLightPower;
  syncLightPowerControl();applyLightingPreset();
});
document.getElementById('lightPower').addEventListener('input',event=>{
  state.lightPower=Number(event.target.value);state[state.light==='uv'?'blackLightPower':state.light==='night'?'nightLightPower':isCreative(state.light)?state.light+'Power':'regularLightPower']=state.lightPower;document.getElementById('lightPowerValue').value=state.lightPower;applyLightingPreset();
});
document.getElementById('lightLock').addEventListener('change',event=>{
  state.lightLocked=!event.target.checked;
  // Resume following from the current rig pose, avoiding a jump on toggle.
  lightReference.copy(lightRig.quaternion).invert().multiply(camera.quaternion);
  updateLightLock();shadowDirty=true;
});
for(const id of Object.keys(CREATIVE_DEFAULTS)){const input=document.getElementById(id);if(!input)continue;input.addEventListener(input.type==='range'?'input':'change',()=>{state[id]=input.type==='checkbox'?input.checked:input.tagName==='SELECT'?input.value:Number(input.value);applyLightingPreset();workspace?.notify();});}
document.getElementById('nightTraffic').addEventListener('change',event=>{state.nightTraffic=event.target.value;applyLightingPreset();});
document.getElementById('nightPaused').addEventListener('change',event=>{state.nightPaused=event.target.checked;});
document.getElementById('selfShadows').addEventListener('change',e=>{
  state.selfShadows=e.target.checked;renderer.shadowMap.enabled=state.selfShadows;shadowDirty=true;
  scene.traverse(o=>{if(o.isMesh)for(const m of Array.isArray(o.material)?o.material:[o.material])m.needsUpdate=true;});
});
segment('segView',v=>setView(v));
const detailToggle=document.getElementById('detailCameraToggle'),detailMenu=document.getElementById('detailCameraMenu');
for(const [label,slots] of [['Front',['centerchest','lefthem','righthem']],['Back',['backneck','leftblade','rightblade','lowerback']],['Sleeves',['leftwrist','rightwrist']]]){
  const group=document.createElement('div');group.className='detail-camera-group';
  const heading=document.createElement('span');heading.textContent=label;group.append(heading);
  for(const slot of slots){const button=document.createElement('button');button.type='button';button.dataset.detailView='placement:'+slot;button.textContent=ART_META[slot].label;button.setAttribute('aria-pressed','false');group.append(button);}
  detailMenu.append(group);
}
function syncCameraUi(){
  document.querySelectorAll('#segView button[data-v]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.v===state.view)));
  const toggle=document.getElementById('detailCameraToggle');
  toggle.classList.toggle('camera-active',['detail','neck'].includes(state.view)||!!state.view?.startsWith('placement:'));
  toggle.title=state.view?.startsWith('placement:')?ART_META[state.view.slice(10)]?.label||'Detail camera views':'Detail camera views';
  toggle.textContent=state.view==='neck'?'Neck tag':'Detail';
  document.querySelectorAll('[data-detail-view]').forEach(b=>{
    b.setAttribute('aria-pressed',String(b.dataset.detailView===state.view));
    if(b.dataset.detailView.startsWith('placement:')){const slot=b.dataset.detailView.slice(10);b.hidden=!!ART_META[slot]?.hoodie&&!UV_PROFILES[slot];b.disabled=isCustom||!UV_PROFILES[slot];}
    if(b.dataset.detailView==='neck'){b.disabled=isCustom||!UV_PROFILES.necktag;b.title=b.disabled?'Neck tag view is available on the built-in garments':'';}
  });
  document.querySelectorAll('.detail-camera-group').forEach(g=>g.hidden=!Array.from(g.querySelectorAll('button')).some(b=>!b.hidden));
}
function closeDetailMenu(restore=false){detailMenu.hidden=true;detailToggle.setAttribute('aria-expanded','false');if(restore)detailToggle.focus();}
function positionDetailMenu(){
  if(detailMenu.hidden)return;const r=detailToggle.getBoundingClientRect();
  detailMenu.style.left=Math.max(8,Math.min(r.right-detailMenu.offsetWidth,innerWidth-detailMenu.offsetWidth-8))+'px';
  detailMenu.style.top=Math.max(8,Math.min(r.bottom+6,innerHeight-detailMenu.offsetHeight-8))+'px';
}
detailToggle.onclick=()=>{if(!detailMenu.hidden){closeDetailMenu();return;}syncCameraUi();detailMenu.hidden=false;detailToggle.setAttribute('aria-expanded','true');positionDetailMenu();detailMenu.querySelector('button[aria-pressed="true"]:not(:disabled),button:not(:disabled)').focus();};
for(const b of detailMenu.querySelectorAll('button'))b.onclick=()=>{setView(b.dataset.detailView);closeDetailMenu(true);};
document.addEventListener('pointerdown',e=>{if(!detailMenu.hidden&&!detailMenu.contains(e.target)&&!detailToggle.contains(e.target))closeDetailMenu();});
document.addEventListener('keydown',e=>{if(e.key==='Escape'&&!detailMenu.hidden){e.preventDefault();closeDetailMenu(true);}});
document.addEventListener('focusin',e=>{if(!detailMenu.hidden&&!detailMenu.contains(e.target)&&e.target!==detailToggle)closeDetailMenu();});
window.addEventListener('resize',positionDetailMenu);window.addEventListener('scroll',positionDetailMenu,true);
function syncFabricToTheme(){
  const next=GARMENTS.findIndex(g=>g.name===(state.theme==='dark'?'Washed Black':'Chalk'));
  if(next<0||state.blank===next)return;
  // This option changes fabric only. Preserve any still-automatic ink color
  // before changing the cloth underneath it.
  for(const layer of artLayers){
    if(layer.mode==='ink'&&!layer.inkCustom)layer.inkCustom=inkHex(layer);
  }
  state.blank=next;syncGarmentSwatches();applyLook();
}
function setColorMode(mode){
  if(!['light','system','dark'].includes(mode))return;
  state.themeMode=mode;applyTheme(true);
  if(state.matchFabricToTheme)syncFabricToTheme();
}
document.getElementById('matchFabricToTheme').addEventListener('change',event=>{
  state.matchFabricToTheme=event.target.checked;
  if(state.matchFabricToTheme)syncFabricToTheme();
});
document.querySelectorAll('[data-theme-mode]').forEach(button=>{
  button.addEventListener('click',()=>setColorMode(button.dataset.themeMode));
});
systemColorScheme.addEventListener('change',()=>{
  if(state.themeMode==='system')setColorMode('system');
});
document.getElementById('bgCustom').addEventListener('input',e=>{
  state.bg=e.target.value;
  document.getElementById('bgColorChip').style.background=e.target.value;
  applyBackground();
});
const artGlossiness=document.getElementById('artGlossiness');
const artGlossinessName=document.getElementById('artGlossinessName');
function setArtworkGlossiness(raw){
  const v=Math.max(0,Math.min(100,Math.round(Number(raw)||0)));
  state.artGlossiness=v;
  artGlossiness.value=String(v);
  artGlossinessName.value=String(v);
  uni.uArtRough.value=1-v/100;
}
artGlossiness.addEventListener('input',e=>setArtworkGlossiness(e.target.value));
setArtworkGlossiness(state.artGlossiness);

document.getElementById('resetArtGlossiness').addEventListener('click',()=>setArtworkGlossiness(50));

const INERTIA_DEFAULTS={enabled:true,strength:15,ramp:100,settle:0.5,elasticity:60,overshoot:70,release:70,sensitivity:50,bias:25,sleeve:100,arc:100};

function inertiaFlowPower(v){
  const t=clamp(v/100,0,1);
  return t<=0.5 ? lerp(0.55,1.0,t*2) : lerp(1.0,2.10,(t-0.5)*2);
}
function syncInertiaUniformShape(){
  uni.uTwistFlowPower.value=inertiaFlowPower(state.inertia.bias);
  uni.uSleeveBoost.value=(state.inertia.sleeve/100)*0.80;
  uni.uSleeveArc.value=state.inertia.arc/100;
}
const MOTION_APPLIERS={};
function bindMotionPair(key, rangeId, numId, min, max, step){
  const range=document.getElementById(rangeId);
  const num=document.getElementById(numId);

  function clean(raw){
    let v=Number(raw);
    if(!Number.isFinite(v)) v=state.inertia[key];
    v=clamp(v,min,max);
    if(step<1){
      const places=String(step).split('.')[1]?.length || 0;
      v=Number(v.toFixed(places));
    }else{
      v=Math.round(v/step)*step;
    }
    return v;
  }
  function apply(raw){
    const v=clean(raw);
    state.inertia[key]=v;
    range.value=String(v);
    num.value=String(v);
    syncInertiaUniformShape();
  }
  MOTION_APPLIERS[key]=apply;

  range.addEventListener('input',e=>apply(e.target.value));
  num.addEventListener('input',e=>apply(e.target.value));
  num.addEventListener('change',e=>apply(e.target.value));
  num.addEventListener('wheel',e=>{
    e.preventDefault();
    apply(state.inertia[key] + (e.deltaY<0 ? step : -step));
  },{passive:false});
  apply(state.inertia[key]);
}

bindMotionPair('strength','inertiaStrength','inertiaStrengthNum',0,15,0.25);
bindMotionPair('ramp','inertiaRamp','inertiaRampNum',15,300,5);
bindMotionPair('settle','inertiaSettle','inertiaSettleNum',0.20,2.50,0.05);
bindMotionPair('elasticity','inertiaElasticity','inertiaElasticityNum',10,100,1);
bindMotionPair('overshoot','inertiaOvershoot','inertiaOvershootNum',0,100,1);
bindMotionPair('release','inertiaRelease','inertiaReleaseNum',0,150,1);
bindMotionPair('sensitivity','inertiaSensitivity','inertiaSensitivityNum',0,100,1);
bindMotionPair('bias','inertiaBias','inertiaBiasNum',0,100,1);
bindMotionPair('sleeve','inertiaSleeve','inertiaSleeveNum',0,100,1);
bindMotionPair('arc','inertiaArc','inertiaArcNum',0,100,1);

document.querySelectorAll('[data-reset-motion]').forEach(btn=>{
  const key=btn.dataset.resetMotion;
  const defaultValue=INERTIA_DEFAULTS[key];
  btn.dataset.tip=`Reset this control to its default value (${defaultValue}).`;
  btn.addEventListener('click',()=>{
    const apply=MOTION_APPLIERS[key];
    if(apply) apply(defaultValue);
  });
});

const inertiaEnabled=document.getElementById('inertiaEnabled');
inertiaEnabled.addEventListener('change',e=>{
  state.inertia.enabled=e.target.checked;
  if(!state.inertia.enabled){
    inertiaInput=inertiaTwist=inertiaVelocity=inertiaReleaseKick=0;
    inertiaLoadTarget=0;
    inertiaLastMotionVelocity=0;
    uni.uTwist.value=0;
  }
});

document.getElementById('resetInertia').addEventListener('click',()=>{
  Object.assign(state.inertia,INERTIA_DEFAULTS);
  inertiaEnabled.checked=state.inertia.enabled;
  [
    ['strength','inertiaStrength','inertiaStrengthNum'],
    ['ramp','inertiaRamp','inertiaRampNum'],
    ['settle','inertiaSettle','inertiaSettleNum'],
    ['elasticity','inertiaElasticity','inertiaElasticityNum'],
    ['overshoot','inertiaOvershoot','inertiaOvershootNum'],
    ['release','inertiaRelease','inertiaReleaseNum'],
    ['sensitivity','inertiaSensitivity','inertiaSensitivityNum'],
    ['bias','inertiaBias','inertiaBiasNum'],
    ['sleeve','inertiaSleeve','inertiaSleeveNum'],
    ['arc','inertiaArc','inertiaArcNum']
  ].forEach(([key,r,n])=>{
    document.getElementById(r).value=String(state.inertia[key]);
    document.getElementById(n).value=String(state.inertia[key]);
  });
  syncInertiaUniformShape();
});
syncInertiaUniformShape();
document.getElementById('dotGrid').addEventListener('change',e=>{ state.dotGrid=e.target.checked; drawPatternBackground(); });
const gridScale=document.getElementById('gridScale');
const gridScaleNum=document.getElementById('gridScaleNum');
const gridCharSize=document.getElementById('gridCharSize');
const gridCharSizeNum=document.getElementById('gridCharSizeNum');
function applyGridScale(raw){
  const v=Math.max(30, Math.min(175, Math.round(Number(raw)||35)));
  state.gridScale=v;
  gridScale.value=String(v);
  gridScaleNum.value=String(v);
  drawPatternBackground();
}
function applyGridCharSize(raw){
  const v=Math.max(30, Math.min(160, Math.round(Number(raw)||45)));
  state.gridCharSize=v;
  gridCharSize.value=String(v);
  gridCharSizeNum.value=String(v);
  drawPatternBackground();
}
gridScale.addEventListener('input',e=>applyGridScale(e.target.value));
gridScaleNum.addEventListener('input',e=>applyGridScale(e.target.value));
gridCharSize.addEventListener('input',e=>applyGridCharSize(e.target.value));
gridCharSizeNum.addEventListener('input',e=>applyGridCharSize(e.target.value));

document.getElementById('resetGridScale').addEventListener('click',()=>applyGridScale(35));
document.getElementById('resetGridCharSize').addEventListener('click',()=>applyGridCharSize(45));
function syncGridStyle(){document.getElementById('gridCharacterRow').hidden=state.gridType!=='pattern';document.getElementById('gridStrokeRow').hidden=state.gridType!=='square';drawPatternBackground();}
document.getElementById('gridType').addEventListener('change',e=>{state.gridType=e.target.value;syncGridStyle();});
document.getElementById('gridColor').addEventListener('input',e=>{state.gridColor=e.target.value;state.gridColorCustom=true;drawPatternBackground();});
function applyGridStroke(value){const n=Number(value);if(!Number.isFinite(n))return;state.gridStroke=clamp(Math.round(n*4)/4,0.25,3);document.getElementById('gridStroke').value=state.gridStroke;document.getElementById('gridStrokeNum').value=state.gridStroke;drawPatternBackground();}
for(const id of ['gridStroke','gridStrokeNum'])document.getElementById(id).addEventListener('input',e=>applyGridStroke(e.target.value));
document.getElementById('resetGridStroke').addEventListener('click',()=>applyGridStroke(0.5));

// Artwork is composited on the GPU into isolated native-UV panels. Moving a
// graphic changes its quad matrix, never its image pixels or source texture.
const artworkMaps=new Map(),artworkSources=new Map(),artworkBoundsCache=new WeakMap();
const artworkDirtyPanels=new Set();
let artworkDirty=true,artworkDirtyAll=true;
const artworkClearColor=new THREE.Color();
const artworkQuad=new THREE.BufferGeometry();
artworkQuad.setAttribute('position',new THREE.Float32BufferAttribute([-.5,-.5,0,.5,-.5,0,.5,.5,0,-.5,.5,0],3));
artworkQuad.setAttribute('uv',new THREE.Float32BufferAttribute([0,0,1,0,1,1,0,1],2));
artworkQuad.setIndex([0,1,2,0,2,3]);
const ARTWORK_VERTEX=`varying vec2 vArtUv;
void main(){vArtUv=uv;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0);}`;
const ARTWORK_FRAGMENT=`uniform sampler2D uSource;uniform float uOriginal,uTint,uEffectsPass;uniform vec2 uEffects;
uniform vec3 uInkColor;varying vec2 vArtUv;
void main(){
  vec4 art=texture2D(uSource,vArtUv);
  vec3 color=uOriginal>.5?art.rgb:uInkColor;
  if(uTint>.5){
    // Transfer the chosen color's chroma, preserving source luminance and alpha.
    // Scale chroma into gamut rather than clipping away highlight/shadow detail.
    const vec3 weights=vec3(.2126,.7152,.0722);
    float lightness=dot(art.rgb,weights);
    vec3 chroma=uInkColor-vec3(dot(uInkColor,weights));
    float low=min(chroma.r,min(chroma.g,chroma.b));
    float high=max(chroma.r,max(chroma.g,chroma.b));
    float strength=1.0;
    if(low<-.00001)strength=min(strength,lightness/-low);
    if(high>.00001)strength=min(strength,(1.0-lightness)/high);
    color=vec3(lightness)+chroma*strength;
  }
  // Keep fractional coverage intact AFTER filtering. Thresholding it here
  // destroys antialiasing, soft edges, and fine details at small print sizes.
  gl_FragColor=vec4(uEffectsPass>.5?vec3(uEffects,0.0):color,art.a);
}`;
function requestArtworkRender(layer=null){
  artworkDirty=true;
  const q=layer&&layerProfile(layer);
  if(q)artworkDirtyPanels.add(`${q.mesh||1}:${q.island}`);
  else artworkDirtyAll=true;
}
function getArtworkMap(meshId){
  if(!artworkMaps.has(meshId))artworkMaps.set(meshId,{
    map:{value:null},has:{value:0},effects:{value:null},hasEffects:{value:0},effectTarget:null,target:null,layoutKey:'',geometry:null,
    spillGlow:{value:null},spillUV:{value:null},spillTargets:null,
    tiles:new Map(),scenes:new Map(),quads:new Map(),camera:new THREE.OrthographicCamera(0,1,1,0,-1,1)
  });
  return artworkMaps.get(meshId);
}
function resetArtworkMaps(){
  for(const map of artworkMaps.values()){
    map.target?.dispose();map.target=null;map.map.value=null;map.has.value=0;
    map.effectTarget?.dispose();map.effectTarget=null;map.effects.value=null;map.hasEffects.value=0;disposeArtworkSpill(map);
    for(const mesh of map.quads.values()){mesh.removeFromParent();mesh.material.dispose();}
    map.quads.clear();map.scenes.clear();map.tiles.clear();map.layoutKey='';map.geometry=null;
  }
  requestArtworkRender();
}
function artworkSourceKey(layer){
  return `${layer.solidMaskSource??'brightness'}/${layer.solidSpread??0}/${layer.solidEdgeSoftness??0}/${layer.printPixelScale??35}/${layer.printVersion??1}/${layer.printMarkSize??50}/${layer.printTone??100}/${layer.printErosion??0}/${layer.printPattern||'none'}/${layer.printSize??40}/${layer.printAngle??45}/${layer.printStrength??100}/${layer.fit?1:0}/${layer.mode==='ink'?`ink/${layer.solidCutoff??12}/${layer.solidSoftness??65}/${!!layer.solidInvert}`:'color'}`;
}
function artworkSource(layer){
  let cached=artworkSources.get(layer.source);
  if(!cached){cached={fitted:null,textures:new Map()};artworkSources.set(layer.source,cached);}
  const edgeMargin=layer.mode==='ink'?Math.ceil((Math.abs(layer.solidSpread??0)+3*(layer.solidEdgeSoftness??0))*Math.min(layer.source.width,layer.source.height)/1024):0;
  const source=layer.fit?(edgeMargin?fitVisibleArtwork(layer.source,edgeMargin):(cached.fitted||(cached.fitted=fitVisibleArtwork(layer.source)))):layer.source;
  const key=artworkSourceKey(layer);
  if(!cached.textures.has(key)){
    const pixelSource=layer.printPattern==='pixel'?pixelateArtwork(layer.source,layer):null;
    const renderSource=pixelSource?(layer.fit?fitVisibleArtwork(pixelSource,edgeMargin):pixelSource):source;
    let raster=layer.mode==='ink'?makeArtworkMask(renderSource,layer):renderSource;
    if(layer.mode!=='ink'&&hasPrintTexture(layer)&&layer.printPattern!=='pixel'){
      raster=document.createElement('canvas');raster.width=source.width;raster.height=source.height;
      const cx=raster.getContext('2d');cx.drawImage(source,0,0);const pixels=cx.getImageData(0,0,raster.width,raster.height);
      applyPrintTexture(pixels.data,raster.width,raster.height,layer,source.orbCrop);cx.putImageData(pixels,0,0);
    }
    cached.textures.set(key,{texture:texFromArtwork(raster,layer.mode!=='ink'),width:raster.width,height:raster.height});
  }
  return cached.textures.get(key);
}
function trimArtworkSources(){
  const sources=new Set(artLayers.map(layer=>layer.source));
  for(const [source,cached] of artworkSources){
    const keys=new Set(artLayers.filter(l=>l.source===source).map(artworkSourceKey));
    for(const [key,image] of cached.textures)if(!keys.has(key)){image.texture.dispose();cached.textures.delete(key);}
    if(!sources.has(source))artworkSources.delete(source);
  }
}
function artworkPanelBounds(geometry){
  if(artworkBoundsCache.has(geometry))return artworkBoundsCache.get(geometry);
  const bounds=new Map(),uv=geometry.getAttribute('orbPrintUv')||geometry.getAttribute('uv'),island=geometry.getAttribute('aPrintIsland');
  if(uv&&island)for(let i=0;i<uv.count;i++){
    const id=island.getX(i),u=uv.getX(i),v=uv.getY(i);let box=bounds.get(id);
    if(!box){box={minU:u,maxU:u,minV:v,maxV:v};bounds.set(id,box);}
    box.minU=Math.min(box.minU,u);box.maxU=Math.max(box.maxU,u);box.minV=Math.min(box.minV,v);box.maxV=Math.max(box.maxV,v);
  }
  artworkBoundsCache.set(geometry,bounds);return bounds;
}
function layoutArtworkMap(map,geometry,panelIds){
  const key=panelIds.join(',');
  if(map.geometry===geometry&&map.layoutKey===key&&geometry.getAttribute('aArtworkUv'))return false;
  const bounds=artworkPanelBounds(geometry),cols=Math.ceil(Math.sqrt(panelIds.length||1)),rows=Math.ceil((panelIds.length||1)/cols);
  const limit=Math.min(8192,renderer.capabilities.maxTextureSize),tileSize=Math.min(4096,Math.floor(limit/Math.max(cols,rows))),gutter=8;
  const width=cols*tileSize,height=rows*tileSize;
  map.tiles.clear();map.geometry=geometry;map.layoutKey=key;
  if(panelIds.length){
    if(!map.target||map.target.width!==width||map.target.height!==height){
      map.target?.dispose();
      map.target=new THREE.WebGLRenderTarget(width,height,{
        depthBuffer:false,stencilBuffer:false,generateMipmaps:true,
        minFilter:THREE.LinearMipmapLinearFilter,magFilter:THREE.LinearFilter,
        // WebGL2 encodes the linear blend into sRGB storage on the GPU, keeping
        // dark image detail without a larger floating-point render target.
        colorSpace:renderer.capabilities.isWebGL2?THREE.SRGBColorSpace:THREE.LinearSRGBColorSpace
      });
      map.target.texture.anisotropy=Math.min(8,renderer.capabilities.getMaxAnisotropy());
      map.map.value=map.target.texture;
    }
    map.camera.right=width;map.camera.top=height;map.camera.updateProjectionMatrix();
    panelIds.forEach((id,i)=>{
      const b=bounds.get(id),spanU=Math.max(1e-6,b.maxU-b.minU),spanV=Math.max(1e-6,b.maxV-b.minV);
      const density=(tileSize-gutter*2)/Math.max(spanU,spanV),left=(i%cols)*tileSize,top=Math.floor(i/cols)*tileSize;
      map.tiles.set(id,{...b,density,left,top,size:tileSize,x:left+(tileSize-spanU*density)/2,y:top+(tileSize-spanV*density)/2});
    });
  }else{map.target?.dispose();map.target=null;map.map.value=null;}
  const uv=geometry.getAttribute('orbPrintUv')||geometry.getAttribute('uv'),island=geometry.getAttribute('aPrintIsland'),values=new Float32Array(geometry.attributes.position.count*2).fill(-1);
  if(uv&&island)for(let i=0;i<uv.count;i++){
    const tile=map.tiles.get(island.getX(i));if(!tile)continue;
    values[i*2]=(tile.x+(uv.getX(i)-tile.minU)*tile.density)/width;
    values[i*2+1]=(tile.y+(uv.getY(i)-tile.minV)*tile.density)/height;
  }
  geometry.setAttribute('aArtworkUv',new THREE.BufferAttribute(values,2));
  return true;
}
function updateArtworkQuad(map,layer,index,total){
  const q=layerProfile(layer),tile=map.tiles.get(q.island);
  let mesh=map.quads.get(layer.id),scene=map.scenes.get(q.island);
  if(!scene){scene=new THREE.Scene();map.scenes.set(q.island,scene);}
  if(!mesh){
    const material=new THREE.ShaderMaterial({
      uniforms:{uSource:{value:null},uOriginal:{value:1},uTint:{value:0},uEffectsPass:{value:0},uEffects:{value:new THREE.Vector2()},uInkColor:{value:new THREE.Color()}},
      vertexShader:ARTWORK_VERTEX,fragmentShader:ARTWORK_FRAGMENT,
      transparent:true,depthTest:false,depthWrite:false,side:THREE.DoubleSide,
      forceSinglePass:true,toneMapped:false
    });
    mesh=new THREE.Mesh(artworkQuad,material);mesh.matrixAutoUpdate=false;mesh.frustumCulled=false;
    map.quads.set(layer.id,mesh);
  }
  if(mesh.parent!==scene)scene.add(mesh);
  mesh.visible=layer.visible;mesh.renderOrder=total-index;
  if(!layer.visible)return;
  const image=artworkSource(layer),A=layer.placement,meta=ART_META[layer.slot],aspect=image.height/image.width;
  // Full sleeve fits length, with proportional width. Its outer panel clips overflow.
  const full=hasFullSleeve(layer)&&layer.sleevePreset==='full',limits=UV_PROFILES[layer.slot]?.full;
  const width=full?limits.printLength/aspect*A.scale:
    meta.w*A.scale*(q.printScale||1)/(!isCustom&&meta.side==='Sleeve'?Math.max(1,aspect):1);
  const height=width*aspect,[offsetX,offsetY]=placementOffsets(layer,q);
  const [a,b,d,e]=q.basis,c=Math.cos(A.rot*Math.PI/180),s=Math.sin(A.rot*Math.PI/180),k=tile.density;
  mesh.matrix.set(
    k*(a*c+b*s)*width,k*(-a*s+b*c)*height,0,tile.x+(q.origin[0]-tile.minU+a*offsetX-b*offsetY)*k,
    k*(d*c+e*s)*width,k*(-d*s+e*c)*height,0,tile.y+(q.origin[1]-tile.minV+d*offsetX-e*offsetY)*k,
    0,0,1,0,0,0,0,1
  );
  mesh.matrixWorldNeedsUpdate=true;
  const uniforms=mesh.material.uniforms,hex=inkHex(layer);
  uniforms.uSource.value=image.texture;uniforms.uOriginal.value=layer.mode==='original'?1:0;
  uniforms.uTint.value=layer.mode==='tint'?1:0;
  uniforms.uInkColor.value.set(hex);
  uniforms.uEffects.value.set(layer.glow?(layer.emission??100)/400:0,layer.uvReactive?(layer.emission??100)/400:0);
}
function prepareEffectMap(map,layers){
  const enabled=layers.some(l=>l.visible&&(l.glow||l.uvReactive));
  map.hasEffects.value=enabled?1:0;
  if(!enabled){map.effectTarget?.dispose();map.effectTarget=null;map.effects.value=null;disposeArtworkSpill(map);return false;}
  // Only allocate when needed. A quarter-resolution linear mask preserves the
  // existing full-resolution color atlas and caps extra storage at 16 MiB.
  const w=map.target.width/4,h=map.target.height/4;
  if(map.effectTarget?.width===w&&map.effectTarget?.height===h)return false;
  map.effectTarget?.dispose();
  map.effectTarget=new THREE.WebGLRenderTarget(w,h,{depthBuffer:false,stencilBuffer:false,minFilter:THREE.LinearFilter,magFilter:THREE.LinearFilter});
  map.effects.value=map.effectTarget.texture;return true;
}
function renderEffectPanels(map,dirty){
  if(!map.effectTarget)return;
  const target=map.effectTarget;
  for(const id of dirty){
    const tile=map.tiles.get(id),panel=map.scenes.get(id);if(!panel)continue;
    for(const quad of panel.children)quad.material.uniforms.uEffectsPass.value=1;
    target.scissorTest=true;target.scissor.set(tile.left/4,tile.top/4,tile.size/4,tile.size/4);
    renderer.setRenderTarget(target);renderer.clear(true,false,false);
    target.scissor.set((tile.left+4)/4,(tile.top+4)/4,(tile.size-8)/4,(tile.size-8)/4);
    renderer.setRenderTarget(target);renderer.render(panel,map.camera);
    for(const quad of panel.children)quad.material.uniforms.uEffectsPass.value=0;
  }
}
// Cache a compact, panel-bounded color spread only when artwork is edited.
// Seven Gaussian taps span 5.4 mm per axis (under 8 mm diagonally). No blur
// touches the print itself, and separate targets prevent UV/glow color mixing.
const spillUniforms={uArt:{value:null},uEffects:{value:null},uSource:{value:null},uDirection:{value:new THREE.Vector2()},uBounds:{value:new THREE.Vector4()},uStage:{value:0},uKind:{value:0}};
const spillScene=new THREE.Scene(),spillCamera=new THREE.OrthographicCamera(-1,1,1,-1,0,1);
const spillMaterial=new THREE.ShaderMaterial({uniforms:spillUniforms,depthTest:false,depthWrite:false,toneMapped:false,
  vertexShader:'varying vec2 v; void main(){v=uv;gl_Position=vec4(position.xy,0.,1.);}',
  fragmentShader:`uniform sampler2D uArt,uEffects,uSource;uniform vec2 uDirection;uniform vec4 uBounds;uniform float uStage,uKind;varying vec2 v;
  void main(){
    vec3 result=vec3(0.0);
    for(int i=-3;i<=3;i++){
      vec2 q=v+float(i)*uDirection;
      if(q.x<uBounds.x||q.y<uBounds.y||q.x>uBounds.z||q.y>uBounds.w)continue;
      float weight=exp(-.5*float(i*i))/2.50594988;
      vec3 color;
      if(uStage<.5){
        vec4 art=texture2D(uArt,q),effect=texture2D(uEffects,q);
        float strength=mix(effect.r,effect.g,uKind)/max(effect.a,.0001);
        color=art.rgb*strength;
      }else color=texture2D(uSource,q).rgb;
      result+=color*weight;
    }
    gl_FragColor=vec4(result,1.0);
  }`});
spillScene.add(new THREE.Mesh(new THREE.PlaneGeometry(2,2),spillMaterial));
function disposeArtworkSpill(map){
  for(const target of map.spillTargets||[])target.dispose();
  map.spillTargets=null;map.spillGlow.value=null;map.spillUV.value=null;
}
function renderArtworkSpill(map,dirty){
  if(!map.hasEffects.value||!map.target)return;
  const w=map.target.width/8,h=map.target.height/8;
  if(!map.spillTargets||map.spillTargets[0].width!==w||map.spillTargets[0].height!==h){
    disposeArtworkSpill(map);
    map.spillTargets=Array.from({length:3},()=>new THREE.WebGLRenderTarget(w,h,{depthBuffer:false,stencilBuffer:false,minFilter:THREE.LinearFilter,magFilter:THREE.LinearFilter}));
    map.spillGlow.value=map.spillTargets[1].texture;map.spillUV.value=map.spillTargets[2].texture;
    dirty=[...map.tiles.keys()];
  }
  if(!dirty.length)return;
  spillUniforms.uArt.value=map.target.texture;spillUniforms.uEffects.value=map.effectTarget.texture;
  const work=map.spillTargets[0];spillUniforms.uSource.value=work.texture;
  for(const id of dirty){
    const t=map.tiles.get(id),width=map.target.width,height=map.target.height;
    spillUniforms.uBounds.value.set((t.left+4)/width,(t.top+4)/height,(t.left+t.size-4)/width,(t.top+t.size-4)/height);
    for(let kind=0;kind<2;kind++){
      spillUniforms.uKind.value=kind;
      for(let pass=0;pass<2;pass++){
        const target=pass?map.spillTargets[kind+1]:work;
        spillUniforms.uStage.value=pass;
        spillUniforms.uDirection.value.set(pass?0:.0018*t.density/width,pass?.0018*t.density/height:0);
        // Avoid binding the active framebuffer as any sampler, even when the
        // corresponding dynamic shader branch will not use that sampler.
        spillUniforms.uSource.value=pass?work.texture:map.target.texture;
        target.scissorTest=true;target.scissor.set(t.left/8,t.top/8,t.size/8,t.size/8);
        renderer.setRenderTarget(target);renderer.clear(true,false,false);renderer.render(spillScene,spillCamera);
      }
    }
  }
}
function flushArtwork(){
  if(!artworkDirty||!current)return;
  const all=artworkDirtyAll,oldTarget=renderer.getRenderTarget(),oldAutoClear=renderer.autoClear,oldAlpha=renderer.getClearAlpha();
  const oldFace=renderer.getActiveCubeFace(),oldMip=renderer.getActiveMipmapLevel();
  renderer.getClearColor(artworkClearColor);renderer.autoClear=false;renderer.setClearColor(0x000000,0);
  try{
    trimArtworkSources();
    current.traverse(mesh=>{
      if(!mesh.isMesh)return;
      const geometry=mesh.geometry,meshId=mesh.userData.orbMeshId||1,map=getArtworkMap(meshId),bounds=artworkPanelBounds(geometry);
      const layers=artLayers.filter(layer=>{const q=layerProfile(layer);return q&&(q.mesh||1)===meshId&&bounds.has(q.island);});
      const panels=[...new Set(layers.map(layer=>layerProfile(layer).island))].sort((a,b)=>a-b);
      const changed=layoutArtworkMap(map,geometry,panels),ids=new Set(layers.map(layer=>layer.id));
      for(const [id,quad] of map.quads)if(!ids.has(id)){quad.removeFromParent();quad.material.dispose();map.quads.delete(id);}
      for(const [id,scene] of map.scenes)if(!map.tiles.has(id)){scene.clear();map.scenes.delete(id);}
      map.has.value=layers.some(layer=>layer.visible)?1:0;
      if(!map.target){map.effectTarget?.dispose();map.effectTarget=null;map.effects.value=null;map.hasEffects.value=0;disposeArtworkSpill(map);return;}
      const effectsChanged=prepareEffectMap(map,layers);
      const dirty=panels.filter(id=>all||changed||effectsChanged||artworkDirtyPanels.has(`${meshId}:${id}`));
      layers.forEach((layer,i)=>{if(dirty.includes(layerProfile(layer).island))updateArtworkQuad(map,layer,i,layers.length);});
      for(const id of dirty){
        const tile=map.tiles.get(id),target=map.target;
        // RenderTarget scissor coordinates are physical pixels, independent of
        // the display's pixel ratio. Clear and repaint only the edited panel.
        target.scissorTest=true;target.scissor.set(tile.left,tile.top,tile.size,tile.size);
        renderer.setRenderTarget(target);renderer.clear(true,false,false);
        target.scissor.set(tile.left+4,tile.top+4,tile.size-8,tile.size-8);
        renderer.setRenderTarget(target);
        const scene=map.scenes.get(id);if(scene)renderer.render(scene,map.camera);
      }
      renderEffectPanels(map,dirty);
      renderArtworkSpill(map,dirty);
    });
    artworkDirty=false;artworkDirtyAll=false;artworkDirtyPanels.clear();
  }finally{
    renderer.autoClear=oldAutoClear;renderer.setClearColor(artworkClearColor,oldAlpha);
    renderer.setRenderTarget(oldTarget,oldFace,oldMip);
  }
}

// One independent graphic per row. The array is the visual stack: top first.
const fileInput=document.getElementById('file');
let pendingSlot='back',pendingLayerId=null,pendingUploadAction='add',artLoading=false;
let artLayers=[],nextArtId=1,activeArtId=null,renamingArtId=null;
const artHistory=[],artFuture=[],layerRows=new Map();
const artEntry=(id=activeArtId)=>artLayers.find(layer=>layer.id===id)||null;
const hasFullSleeve=layer=>!isCustom&&!!UV_PROFILES[layer?.slot]?.full;
const layerProfile=layer=>layer.anchor||(hasFullSleeve(layer)&&layer.sleevePreset==='full'?UV_PROFILES[layer.slot].full:UV_PROFILES[layer.slot]);
function setSleevePreset(preset){
  const entry=artEntry();if(artLoading||!hasFullSleeve(entry)||!['patch','full'].includes(preset)||entry.sleevePreset===preset)return;
  recordArtUndo();cancelAnchorPick();entry.sleevePreset=preset;entry.anchor=null;
  if(preset==='full')entry.fit=true;
  entry.placement={x:0,y:0,scale:preset==='full'?1:ART_META[entry.slot].scale/100,rot:0};
  requestArtworkRender(entry);syncArtworkUi();
}
function suggestArtworkName(filename){
  let name=String(filename||'Artwork').replace(/\.(png|jpe?g|webp|gif|avif|svg)$/i,'')
    .replace(/[_]+/g,' ').replace(/\s+/g,' ').trim();
  // Remove only recognizable export suffixes; retain color, placement and v02.
  name=name.replace(/[ -]+(?:[a-f0-9]{12,}|\d{3,5}x\d{3,5}(?:px)?|20\d{6}[-T]\d{6})$/i,'').trim()||'Artwork';
  if(name.length<=48)return name;
  let head=name.slice(0,27),tail=name.slice(-17);
  if(head.includes(' '))head=head.replace(/\s+\S*$/,'');
  if(tail.includes(' '))tail=tail.replace(/^\S*\s+/,'');
  return head.trim()+' … '+tail.trim();
}
function uniqueArtworkName(name,names){
  let result=name,n=2;
  while(names.has(result.toLocaleLowerCase()))result=`${name} (${n++})`;
  names.add(result.toLocaleLowerCase());return result;
}
function initializeLayer(entry,slot,anchor=null,names=new Set(artLayers.map(e=>e.name.toLocaleLowerCase()))){
  const name=uniqueArtworkName(entry.name,names);
  return {...entry,placementSpace:PLACEMENT_SPACE,tintCustom:entry.tintCustom??null,defaultMode:entry.mode,defaultSlot:slot,defaultScale:ART_META[slot].scale,name,autoName:name,nameEdited:false,id:'art-'+nextArtId++,slot,sleevePreset:'patch',visible:true,glow:false,uvReactive:false,emission:100,anchor:anchor?structuredClone(anchor):null,
    placement:{x:0,y:0,scale:ART_META[slot].scale/100,rot:0}};
}
function beginArtworkRename(id){
  const entry=artEntry(id);if(artLoading||!entry)return;
  if(renamingArtId===id)return;
  finishArtworkRename(true);
  selectArtwork(id);renamingArtId=id;
  const row=layerRows.get(id),input=row.querySelector('.art-name-input');
  row.querySelector('.art-select').hidden=true;row.querySelector('.art-rename').hidden=true;
  row.querySelector('.art-name-edit').hidden=false;
  input.value=entry.name;input.focus();input.select();
}
function finishArtworkRename(save=true,refocus=false){
  const id=renamingArtId;if(!id)return;
  renamingArtId=null;
  const row=layerRows.get(id),entry=artEntry(id);
  const name=row?.querySelector('.art-name-input').value.replace(/\s+/g,' ').trim();
  if(save&&entry&&name&&name!==entry.name){
    recordArtUndo();entry.name=name;entry.nameEdited=name!==entry.autoName;
  }
  if(row){
    row.querySelector('.art-name-edit').hidden=true;
    row.querySelector('.art-select').hidden=false;row.querySelector('.art-rename').hidden=false;
  }
  syncArtworkUi();
  if(refocus)row?.querySelector('.art-select').focus();
}
function recordArtUndo(){
  if(historyRestoring||designLocked)return;
  const snapshot=designSnapshot(),key=historyKey(snapshot);
  if(artHistory.length&&artHistory.at(-1).key===key)return;
  artHistory.push({snapshot,key});if(artHistory.length>40)artHistory.shift();
  artFuture.length=0;document.getElementById('artUndo').disabled=false;
  document.getElementById('artRedo').disabled=true;
}
async function undoArtwork(redo=false){
  colorPicker?.close();colorActions?.cancel();
  if(artLoading||modelLoading||designLocked)return;
  finishArtworkRename(false);cancelLayerDrag();cancelAnchorPick();
  const from=redo?artFuture:artHistory,to=redo?artHistory:artFuture;
  const currentSnapshot=designSnapshot(),key=historyKey(currentSnapshot);
  while(from.length&&from.at(-1).key===key)from.pop();
  if(!from.length){syncArtworkUi();return;}
  const next=from.at(-1);
  historyRestoring=true;setWorkspaceLock(true,redo?'Redoing…':'Undoing…');
  try{
    await restoreSnapshotGarment(next.snapshot,next.snapshot.modelFile);
    restoreDesignState(next.snapshot,false);from.pop();to.push({snapshot:currentSnapshot,key});
    workspace?.notify();artStatus('');
  }catch(error){artStatus(error.message||'This edit could not be restored.');}
  finally{historyRestoring=false;setWorkspaceLock(false);syncArtworkUi();}
}
function artStatus(message){document.getElementById('artStatus').textContent=message;}
function selectArtwork(id){
  if(id!==activeArtId){colorPicker?.close();colorActions?.cancel();}
  if(renamingArtId&&renamingArtId!==id)finishArtworkRename(true);
  if(anchorPickId&&anchorPickId!==id)cancelAnchorPick();
  activeArtId=artEntry(id)?id:null;inkEditingEntry=null;
  if(artEntry())activeArtSlot=artEntry().slot;
  syncArtworkUi();
}
function syncArtControls(){
  const entry=artEntry();if(!entry)return;
  document.getElementById('sleevePresetControl').hidden=!hasFullSleeve(entry);
  for(const button of document.querySelectorAll('[data-sleeve-preset]')){
    button.setAttribute('aria-pressed',String(button.dataset.sleevePreset===(entry.sleevePreset||'patch')));
    button.disabled=artLoading;
  }
  document.getElementById('artGlow').checked=!!entry.glow;
  document.getElementById('artUV').checked=!!entry.uvReactive;
  document.getElementById('artEmissionControl').hidden=!(entry.glow||entry.uvReactive);
  document.getElementById('artEmission').value=entry.emission??100;
  document.getElementById('artEmissionValue').value=entry.emission??100;
  const full=hasFullSleeve(entry)&&entry.sleevePreset==='full',scaleControl=artControlPair(entry.slot,'scale');
  for(const input of [scaleControl.range,scaleControl.num])input.max=String(artScaleMax(entry));
  scaleControl.range.title=full?'100% fits the sleeve length; enlarge up to 600%':'Artwork scale';
  const A=entry.placement,vals={x:A.x/.0018,y:A.y/.0018,scale:A.scale*100,rot:A.rot};
  for(const prop of ['x','y','scale','rot']){
    const pair=artControlPair(entry.slot,prop),value=Math.round(vals[prop]);
    const bounds=artInputBounds(entry,prop);
    for(const input of [pair.range,pair.num]){input.min=String(bounds.min);input.max=String(bounds.max);}
    pair.range.value=value;pair.num.value=value;
  }
}
function createLayerRow(layer){
  const wrap=document.createElement('div');wrap.className='art-layer';wrap.dataset.layerId=layer.id;
  wrap.innerHTML=`<div class="art-slot" data-art-card="${layer.id}" data-slot="${layer.slot}">
    <button class="art-drag" type="button" title="Drag to reorder; use ↑ or ↓ with the keyboard"><svg viewBox="0 0 12 20" aria-hidden="true"><path d="M3 4h.01M9 4h.01M3 10h.01M9 10h.01M3 16h.01M9 16h.01"/></svg></button>
    <button class="art-thumb" type="button"><img alt="" draggable="false"></button>
    <div class="art-labels">
      <button class="art-select" type="button" aria-controls="artEditor" aria-expanded="false"><span class="art-layer-name"></span><span class="art-layer-placement"></span></button>
      <button class="art-rename" type="button" title="Rename layer"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="m15 5 4 4M4 20l4-1L20 7a2.8 2.8 0 0 0-4-4L4 15z"/></svg></button>
      <div class="art-name-edit" hidden><input class="art-name-input" type="text" maxlength="80" aria-label="Layer name" autocomplete="off" spellcheck="false" enterkeyhint="done"><small class="art-name-source"></small></div>
    </div>
    <button class="art-eye" type="button"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M2 12s3.5-6 10-6 10 6 10 6-3.5 6-10 6S2 12 2 12Z"/><circle cx="12" cy="12" r="3"/><path class="eye-slash" d="m3 3 18 18"/></svg></button>
    <button class="art-remove" type="button" title="Remove layer">×</button></div>`;
  const toggle=()=>{if(!artLoading)selectArtwork(activeArtId===layer.id?null:layer.id);};
  wrap.firstElementChild.addEventListener('click',e=>{if(!e.target.closest('button,input,.art-name-edit'))toggle();});
  const select=wrap.querySelector('.art-select');
  select.onclick=e=>{if(e.detail<2||e.detail===undefined)toggle();};
  select.ondblclick=e=>{e.preventDefault();beginArtworkRename(layer.id);};
  wrap.querySelector('.art-rename').onclick=()=>beginArtworkRename(layer.id);
  const nameInput=wrap.querySelector('.art-name-input');
  nameInput.addEventListener('keydown',e=>{
    if(e.isComposing)return;
    if(e.key==='Enter'||e.key==='Escape'){
      e.preventDefault();e.stopPropagation();finishArtworkRename(e.key==='Enter',true);
    }
  });
  nameInput.addEventListener('blur',()=>{if(renamingArtId===layer.id)finishArtworkRename(true);});
  wrap.querySelector('.art-thumb').onclick=()=>{
    const entry=artEntry(layer.id);if(artLoading||designLocked||modelLoading||!entry)return;
    viewArtwork(entry.slot);
  };
  wrap.querySelector('.art-remove').onclick=()=>clearArtwork(layer.id);
  wrap.querySelector('.art-eye').onclick=()=>{
    const entry=artEntry(layer.id);if(artLoading||!entry)return;
    recordArtUndo();entry.visible=!entry.visible;requestArtworkRender(entry);syncArtworkUi();
  };
  const handle=wrap.querySelector('.art-drag');
  handle.addEventListener('pointerdown',e=>beginLayerDrag(e,layer.id));
  handle.addEventListener('keydown',e=>{
    if(e.key==='ArrowUp'||e.key==='ArrowDown'){
      e.preventDefault();moveArtwork(layer.id,e.key==='ArrowUp'?-1:1);handle.focus();
    }
  });
  return wrap;
}
function syncArtworkUi(){
  syncCameraUi();
  const list=document.getElementById('artLayers'),editor=document.getElementById('artEditor');
  const entry=artEntry();
  // Park the shared form before removing a row so its controls and listeners survive.
  const parent=entry?layerRows.get(entry.id):null;
  if(editor.parentElement!==parent)document.getElementById('artEditorParking').appendChild(editor);
  for(const [id,wrap] of layerRows)if(!artEntry(id)){wrap.remove();layerRows.delete(id);}
  let cursor=list.firstElementChild;
  for(const layer of artLayers){
    let wrap=layerRows.get(layer.id);
    if(!wrap){wrap=createLayerRow(layer);layerRows.set(layer.id,wrap);}
    // Do not detach/reinsert the active form on slider or color-picker updates.
    if(wrap!==cursor)list.insertBefore(wrap,cursor);else cursor=cursor.nextElementSibling;
    const row=wrap.firstElementChild,selected=layer.id===activeArtId;row.dataset.slot=layer.slot;
    wrap.classList.toggle('active',selected);
    row.classList.toggle('selected',selected);row.classList.toggle('art-hidden',!layer.visible);
    const label=ART_META[layer.slot].label+(hasFullSleeve(layer)&&layer.sleevePreset==='full'?' · Full sleeve':'');
    row.querySelector('.art-layer-name').textContent=layer.name;
    const sourceName=layer.sourceName||layer.name;
    row.querySelector('.art-layer-name').title=`${layer.name}\nSource: ${sourceName}`;
    row.querySelector('.art-select').title=`${sourceName}\nDouble-click to rename`;
    row.querySelector('.art-name-source').textContent='Source: '+sourceName;
    row.querySelector('.art-rename').setAttribute('aria-label',`Rename ${layer.name}`);
    row.querySelector('.art-name-input').disabled=artLoading;
    row.querySelector('.art-layer-placement').textContent=label+(isCustom&&!layer.anchor?' · Set position':!isCustom&&!UV_PROFILES[layer.slot]?' · Hoodie only':'');
    const img=row.querySelector('img');if(img.getAttribute('src')!==layer.thumb)img.src=layer.thumb;
    for(const button of row.querySelectorAll('button'))button.disabled=artLoading;
    for(const button of row.querySelectorAll('.art-select')){
      button.setAttribute('aria-expanded',String(selected));
      button.setAttribute('aria-label',`Edit ${layer.name}, ${label}`);
    }
    const thumbnail=row.querySelector('.art-thumb');
    thumbnail.setAttribute('aria-label',`View ${layer.name} on garment, ${label}`);
    thumbnail.title=`View on garment · ${layer.name}`;
    row.querySelector('.art-drag').setAttribute('aria-label',`Reorder ${layer.name}, ${label}`);
    row.querySelector('.art-remove').setAttribute('aria-label',`Remove ${layer.name}, ${label}`);
    const eye=row.querySelector('.art-eye');
    eye.setAttribute('aria-pressed',String(layer.visible));
    eye.setAttribute('aria-label',`${layer.visible?'Hide':'Show'} ${layer.name}, ${label}`);
    eye.title=layer.visible?'Hide layer':'Show layer';
  }
  if(entry){
    const wrap=layerRows.get(entry.id);if(editor.parentElement!==wrap)wrap.appendChild(editor);
    document.getElementById('artEditorName').textContent=ART_META[entry.slot].label;
    editor.setAttribute('aria-label',`Controls for ${entry.name}, ${ART_META[entry.slot].label}`);
  }
  editor.hidden=!entry;
  document.getElementById('artPosition').hidden=!current;
  document.getElementById('artPosition').textContent=isCustom?'Set position':'Move';
  for(const id of ['artPosition','artUploadAny'])document.getElementById(id).disabled=artLoading;
  document.getElementById('artUploadAny').textContent=artLoading?'Adding…':'+ Add artwork';
  for(const id of ['artFit','artReset','artAdd','artReplace','artView'])document.getElementById(id).disabled=artLoading||!entry;
  document.getElementById('artFit').checked=!!entry?.fit;
  document.getElementById('artUndo').disabled=artLoading||!artHistory.length;
  document.getElementById('artRedo').disabled=artLoading||!artFuture.length;
  document.getElementById('artDuplicate').disabled=artLoading||!entry;
  const index=artLayers.indexOf(entry);
  document.getElementById('artRaise').disabled=artLoading||index<=0;
  document.getElementById('artLower').disabled=artLoading||index<0||index>=artLayers.length-1;
  document.querySelectorAll('[data-art-range],[data-art-num],[data-reset-art-one]').forEach(el=>el.disabled=artLoading||!entry);
  document.getElementById('artEmpty').hidden=artLayers.length>0;
  syncInkUi();syncArtControls();
}
function prepareArtworkSource(img){
  const limit=Math.max(1,Math.min(4096,renderer.capabilities.maxTextureSize-8));
  const width=img.naturalWidth||img.width,height=img.naturalHeight||img.height;
  if(!width||!height)throw new Error('Image has no usable dimensions.');
  const scale=Math.min(1,limit/width,limit/height),cv=document.createElement('canvas');
  cv.width=Math.max(1,Math.round(width*scale));cv.height=Math.max(1,Math.round(height*scale));
  const cx=cv.getContext('2d');cx.imageSmoothingEnabled=scale<1;cx.imageSmoothingQuality='high';
  cx.drawImage(img,0,0,cv.width,cv.height);return cv;
}
function detectSolidInvert(source){
  // Only confidently dark artwork with meaningful transparency gets inverted.
  // Ignore invisible RGB and weight antialiased edges by their coverage.
  const data=source.getContext('2d').getImageData(0,0,source.width,source.height).data;
  let transparent=0,coverage=0,dark=0;
  for(let i=0;i<data.length;i+=4){
    const alpha=data[i+3];
    if(alpha===0){transparent++;continue;}
    coverage+=alpha;
    if(data[i]*.299+data[i+1]*.587+data[i+2]*.114<=64)dark+=alpha;
  }
  return coverage>0&&transparent/(data.length/4)>=.01&&dark/coverage>=.90;
}
function makeArtworkEntry(img,name){
  const source=prepareArtworkSource(img),thumb=document.createElement('canvas');thumb.width=72;thumb.height=72;
  const scale=Math.min(72/source.width,72/source.height);
  thumb.getContext('2d').drawImage(source,(72-source.width*scale)/2,(72-source.height*scale)/2,source.width*scale,source.height*scale);
  const solidInvert=detectSolidInvert(source);
  return {source,sourceName:String(name||'Artwork'),name:suggestArtworkName(name),mode:'original',inkCustom:null,solidCutoff:12,solidSoftness:65,solidMaskSource:'auto',solidSpread:0,solidEdgeSoftness:0,solidInvert,defaultSolidInvert:solidInvert,fit:false,thumb:thumb.toDataURL('image/png')};
}
function fitVisibleArtwork(source,margin=0){
  const w=source.width,h=source.height,d=source.getContext('2d').getImageData(0,0,w,h).data;
  let left=w,top=h,right=-1,bottom=-1;
  for(let y=0;y<h;y++)for(let x=0;x<w;x++)if(d[(y*w+x)*4+3]>0){
    left=Math.min(left,x);right=Math.max(right,x);top=Math.min(top,y);bottom=Math.max(bottom,y);
  }
  if(right<left||(left===0&&top===0&&right===w-1&&bottom===h-1))return source;
  left=Math.max(0,left-margin);top=Math.max(0,top-margin);right=Math.min(w-1,right+margin);bottom=Math.min(h-1,bottom+margin);
  const cv=document.createElement('canvas');cv.width=right-left+1;cv.height=bottom-top+1;
  const cx=cv.getContext('2d');cx.imageSmoothingEnabled=false;
  cx.drawImage(source,left,top,cv.width,cv.height,0,0,cv.width,cv.height);cv.orbCrop={fullWidth:w,fullHeight:h,offsetX:left,offsetY:top};return cv;
}
function openArtUpload(id,action='add'){
  const entry=artEntry(id);if(artLoading||!entry)return;
  workspace.openAssets({action,slot:entry.slot,target:id});
}
async function decodeArtworkFile(file){
  const img=await decodeArtworkImage(file,{longEdge:Math.max(1,Math.min(4096,renderer.capabilities.maxTextureSize-8))});
  return {...makeArtworkEntry(img,file.name),originalFile:file};
}
async function loadArtFiles(slot,files,action='add',targetId=null){
  if(artLoading)return [];
  const images=Array.from(files).filter(f=>f.type.startsWith('image/')||/\.(png|jpe?g|webp|gif|avif|svg)$/i.test(f.name));
  if(!images.length){artStatus('Choose a PNG, JPG, WebP, or another supported image.');return [];}
  artLoading=true;cancelLayerDrag();cancelAnchorPick();artStatus('');syncArtworkUi();
  const entries=[],failed=[];
  for(const [i,file] of images.entries()){

    try{entries.push(await decodeArtworkFile(file));}catch{failed.push(file.name);}
  }
  const registered=[];
  for(const entry of entries){try{registered.push(await workspace.register(entry));}catch{failed.push(entry.sourceName);}}
  const added=addArtworkEntries(slot,registered,action,targetId);
  artLoading=false;syncArtworkUi();
  if(failed.length)artStatus(`Could not read: ${failed.join(', ')}.`);else if(added.length)artStatus('');
  return added;
}
function addArtworkEntries(slot,entries,action='add',targetId=null){
  if(!entries.length)return [];
  if(artLayers.length+entries.length-(action==='replace'?1:0)>200){artStatus('This design has reached its 200-layer limit.');return [];}
  recordArtUndo();
  const target=artEntry(targetId),index=artLayers.indexOf(target);
  const anchor=target?.anchor||artLayers.find(e=>e.slot===slot&&e.anchor)?.anchor||null;
  const names=new Set(artLayers.filter(e=>action!=='replace'||e!==target).map(e=>e.name.toLocaleLowerCase()));
  const added=entries.map(e=>{
    const layer=initializeLayer(e,slot,anchor,names);layer.sleevePreset=target?.sleevePreset||'patch';
    if(hasFullSleeve(layer)&&layer.sleevePreset==='full'){layer.placement.scale=1;layer.fit=target?.fit??true;}
    return layer;
  });
  if(action==='replace'&&target){
    added[0].id=target.id;added[0].placement={...target.placement};added[0].visible=target.visible;
    for(const prop of ['placementSpace','fit','mode','defaultMode','inkCustom','tintCustom','solidCutoff','solidSoftness','solidMaskSource','solidSpread','solidEdgeSoftness','solidInvert','defaultSolidInvert','printPattern','printSize','printAngle','printStrength','printVersion','printMarkSize','printTone','printErosion','printPixelScale','glow','uvReactive','emission'])added[0][prop]=target[prop];
    if(target.nameEdited){added[0].name=target.name;added[0].nameEdited=true;}
    artLayers.splice(index,1,...added);
  }else artLayers.splice(index<0?0:index,0,...added);
  activeArtId=added[0].id;activeArtSlot=slot;requestArtworkRender();syncArtworkUi();workspace?.notify();
  if(isCustom&&!added[0].anchor)beginAnchorPick(added[0].id);
  return added;
}
function clearArtwork(id){
  const entry=artEntry(id);if(artLoading||!entry)return;
  if(renamingArtId===id)finishArtworkRename(false);
  recordArtUndo();const index=artLayers.indexOf(entry);artLayers.splice(index,1);
  if(anchorPickId===id)cancelAnchorPick();
  if(activeArtId===id)activeArtId=null;
  requestArtworkRender();syncArtworkUi();
  const next=artLayers[Math.min(index,artLayers.length-1)];
  (next?layerRows.get(next.id).querySelector('.art-select'):document.getElementById('artUploadAny')).focus();
  artStatus('');
}
function reorderArtwork(id,beforeId){
  if(artLoading)return false;
  const entry=artEntry(id);if(!entry||beforeId===id)return false;
  const reordered=artLayers.filter(e=>e!==entry),before=reordered.findIndex(e=>e.id===beforeId);
  reordered.splice(before<0?reordered.length:before,0,entry);
  if(reordered.every((e,i)=>e===artLayers[i]))return false;
  recordArtUndo();artLayers=reordered;
  requestArtworkRender();selectArtwork(id);
  artStatus('');
  return true;
}
function moveArtwork(id,direction){
  const index=artLayers.findIndex(e=>e.id===id),destination=index+direction;
  if(index<0||destination<0||destination>=artLayers.length)return;
  const others=artLayers.filter(e=>e.id!==id);
  reorderArtwork(id,others[destination]?.id||null);
}

// Pointer sorting supports mouse, pen and touch without intercepting file drops.
let layerDrag=null,layerScrollFrame=0;
function beginLayerDrag(e,id){
  if(artLoading||e.button!==0||artLayers.length<2)return;
  e.preventDefault();cancelLayerDrag();
  layerDrag={id,pointerId:e.pointerId,handle:e.currentTarget,startX:e.clientX,startY:e.clientY,y:e.clientY,started:false,beforeId:null};
  e.currentTarget.setPointerCapture(e.pointerId);
}
function updateLayerDrop(){
  if(!layerDrag?.started)return;
  const list=document.getElementById('artLayers');
  list.querySelectorAll('.drop-before').forEach(el=>el.classList.remove('drop-before'));
  list.classList.remove('drop-end');layerDrag.beforeId=null;
  for(const entry of artLayers){
    if(entry.id===layerDrag.id)continue;
    const wrap=layerRows.get(entry.id),rect=wrap.firstElementChild.getBoundingClientRect();
    if(layerDrag.y<rect.top+rect.height/2){layerDrag.beforeId=entry.id;wrap.classList.add('drop-before');break;}
  }
  if(!layerDrag.beforeId)list.classList.add('drop-end');
}
function scrollLayerDrag(){
  if(!layerDrag?.started)return;
  const pane=document.getElementById('panel'),rect=pane.getBoundingClientRect(),margin=Math.min(40,rect.height/4);
  const dy=layerDrag.y<rect.top+margin?-Math.min(12,(rect.top+margin-layerDrag.y)*.3):
    layerDrag.y>rect.bottom-margin?Math.min(12,(layerDrag.y-rect.bottom+margin)*.3):0;
  if(dy){pane.scrollTop+=dy;updateLayerDrop();}
  layerScrollFrame=requestAnimationFrame(scrollLayerDrag);
}
document.addEventListener('pointermove',e=>{
  if(!layerDrag||e.pointerId!==layerDrag.pointerId)return;
  layerDrag.y=e.clientY;
  if(!layerDrag.started&&Math.hypot(e.clientX-layerDrag.startX,e.clientY-layerDrag.startY)>4){
    layerDrag.started=true;
    document.getElementById('artLayers').classList.add('sorting');
    layerRows.get(layerDrag.id).classList.add('is-dragging');
    layerScrollFrame=requestAnimationFrame(scrollLayerDrag);
  }
  if(layerDrag.started){e.preventDefault();updateLayerDrop();}
},{passive:false});
function cancelLayerDrag(){
  if(!layerDrag)return;
  const d=layerDrag;layerDrag=null;cancelAnimationFrame(layerScrollFrame);
  const list=document.getElementById('artLayers');list.classList.remove('sorting','drop-end');
  list.querySelectorAll('.drop-before,.is-dragging').forEach(el=>el.classList.remove('drop-before','is-dragging'));
  if(d.handle.hasPointerCapture(d.pointerId))d.handle.releasePointerCapture(d.pointerId);
}
document.addEventListener('pointerup',e=>{
  if(!layerDrag||e.pointerId!==layerDrag.pointerId)return;
  const d=layerDrag;cancelLayerDrag();
  if(d.started)reorderArtwork(d.id,d.beforeId);else selectArtwork(d.id);
  layerRows.get(d.id)?.querySelector('.art-drag').focus();
});
document.addEventListener('pointercancel',cancelLayerDrag);
window.addEventListener('blur',cancelLayerDrag);
document.addEventListener('keydown',e=>{if(e.key==='Escape')cancelLayerDrag();});

fileInput.addEventListener('change',async()=>{
  if(pendingUploadAction==='choose')openPlacementPicker(fileInput.files);
  else{
    const added=await loadArtFiles(pendingSlot,fileInput.files,pendingUploadAction,pendingLayerId);
    if(isCustom&&added[0]&&!added[0].anchor)beginAnchorPick(added[0].id);
  }
});
for(const button of document.querySelectorAll('[data-sleeve-preset]'))button.onclick=()=>setSleevePreset(button.dataset.sleevePreset);
document.getElementById('artAdd').onclick=()=>openArtUpload(activeArtId,'add');
document.getElementById('artReplace').onclick=()=>openArtUpload(activeArtId,'replace');
document.getElementById('artUndo').onclick=()=>undoArtwork();
document.getElementById('artRedo').onclick=()=>undoArtwork(true);
document.getElementById('artDuplicate').onclick=()=>{
  const entry=artEntry();if(!entry||artLoading)return;if(artLayers.length>=200){artStatus('This design has reached its 200-layer limit.');return;}recordArtUndo();
  const layer={...entry,id:'art-'+nextArtId++,name:uniqueArtworkName(entry.name,new Set(artLayers.map(l=>l.name.toLowerCase()))),placement:{...entry.placement},anchor:entry.anchor?structuredClone(entry.anchor):null};
  artLayers.splice(artLayers.indexOf(entry),0,layer);activeArtId=layer.id;requestArtworkRender();syncArtworkUi();workspace?.notify();
};
document.getElementById('artView').onclick=()=>viewArtwork(activeArtSlot);
document.getElementById('artClose').onclick=()=>{
  leaveInspection();const id=activeArtId;selectArtwork(null);layerRows.get(id)?.querySelector('.art-select').focus();
};
document.getElementById('artRaise').onclick=()=>moveArtwork(activeArtId,-1);
document.getElementById('artLower').onclick=()=>moveArtwork(activeArtId,1);
for(const [id,prop] of [['artGlow','glow'],['artUV','uvReactive']])document.getElementById(id).onchange=e=>{
  const entry=artEntry();if(artLoading||!entry)return;
  recordArtUndo();entry[prop]=e.target.checked;
  if(entry[prop]){
    entry.mode='ink';
    if(!entry.inkCustom)entry.inkCustom=inkHex(entry);
  }
  requestArtworkRender(entry);syncArtworkUi();
};
let emissionEditingId=null;
document.getElementById('artEmission').addEventListener('input',e=>{
  const entry=artEntry();if(artLoading||!entry)return;
  if(emissionEditingId!==entry.id){recordArtUndo();emissionEditingId=entry.id;}
  entry.emission=Number(e.target.value);requestArtworkRender(entry);syncArtControls();
});
for(const event of ['change','blur'])document.getElementById('artEmission').addEventListener(event,()=>emissionEditingId=null);
let printEditing=null;
document.getElementById('printPattern').onchange=e=>{
  const entry=artEntry();if(!entry||artLoading)return;recordArtUndo();entry.printPattern=e.target.value;entry.printVersion=2;
  requestArtworkRender(entry);syncInkUi();workspace?.notify();
};
for(const id of ['printSize','printAngle','printMarkSize','printTone','printErosion','printPixelScale']){
  const input=document.getElementById(id);
  input.addEventListener('input',()=>{const entry=artEntry();if(!entry||artLoading)return;
    if(printEditing!==input){recordArtUndo();printEditing=input;}
    entry.printVersion=2;entry[id]=Number(input.value);requestArtworkRender(entry);workspace?.notify();
  });
  for(const event of ['change','blur'])input.addEventListener(event,()=>printEditing=null);
}
let solidEditing=null;
document.getElementById('solidMaskSource').onchange=e=>{const entry=artEntry();if(!entry||artLoading)return;recordArtUndo();entry.solidMaskSource=e.target.value;requestArtworkRender(entry);syncInkUi();workspace?.notify();};
for(const id of ['solidCutoff','solidSoftness','solidSpread','solidEdgeSoftness']){
  const input=document.getElementById(id);
  input.addEventListener('input',()=>{
    const entry=artEntry();if(!entry||artLoading)return;
    if(solidEditing!==input){recordArtUndo();solidEditing=input;}
    entry[id]=Number(input.value);requestArtworkRender(entry);workspace?.notify();
  });
  for(const event of ['change','blur'])input.addEventListener(event,()=>solidEditing=null);
}
document.getElementById('solidInvert').onchange=e=>{
  const entry=artEntry();if(!entry||artLoading)return;
  recordArtUndo();entry.solidInvert=e.target.checked;requestArtworkRender(entry);workspace?.notify();
};
document.getElementById('artFit').onchange=e=>{
  const entry=artEntry();if(artLoading||!entry)return;
  recordArtUndo();entry.fit=e.target.checked;requestArtworkRender(entry);syncArtworkUi();
};
document.getElementById('artReset').onclick=()=>{
  const entry=artEntry();if(artLoading||!entry)return;
  recordArtUndo();for(const prop of ['x','y','scale','rot'])applyArtValue(entry.id,prop,artDefault(entry.slot,prop));
};
for(const prop of ['x','y','scale','rot']){
  const pair=artControlPair(activeArtSlot,prop);let editingId=null,wheelTimer;
  const begin=()=>{if(editingId!==activeArtId){recordArtUndo();editingId=activeArtId;}};
  for(const input of [pair.range,pair.num]){
    input.addEventListener('input',()=>{if(artLoading||!artEntry())return;begin();applyArtValue(activeArtId,prop,input.value);});
    input.addEventListener('change',()=>editingId=null);input.addEventListener('blur',()=>editingId=null);
    input.addEventListener('wheel',e=>{
      if(input.disabled||!artEntry())return;
      e.preventDefault();begin();applyArtValue(activeArtId,prop,Number(pair.num.value)+(e.deltaY<0?1:-1)*(e.shiftKey?10:1));
      clearTimeout(wheelTimer);wheelTimer=setTimeout(()=>editingId=null,250);
    },{passive:false});
  }
  document.querySelector(`[data-reset-art-one="${prop}"]`).onclick=()=>{
    const entry=artEntry();if(artLoading||!entry)return;
    recordArtUndo();applyArtValue(entry.id,prop,artDefault(entry.slot,prop));
  };
}
document.getElementById('artWorkspace').addEventListener('keydown',e=>{
  if(/^(INPUT|SELECT|TEXTAREA)$/.test(e.target.tagName))return;
  if(e.key==='F2'&&artEntry()){e.preventDefault();beginArtworkRename(activeArtId);return;}
  
});
syncArtworkUi();


function makeArtworkMask(img,settings={}){
  // Shape brightness BEFORE texture filtering; source alpha remains edge coverage.
  // This keeps intentional ink buildup without crushing antialiased silhouettes.
  const srcW=img.width,srcH=img.height,pad=4;
  const out=document.createElement('canvas');out.width=srcW+pad*2;out.height=srcH+pad*2;
  const cx=out.getContext('2d',{willReadFrequently:true});cx.drawImage(img,pad,pad);
  const im=cx.getImageData(pad,pad,srcW,srcH),d=im.data;
  const sourceTone=capturePrintTone(d,settings);
  applySolidMask(d,srcW,srcH,settings,img.orbCrop);
  for(let i=0;i<d.length;i+=4)d[i]=d[i+1]=d[i+2]=255;
  applyPrintTexture(d,srcW,srcH,settings,{...img.orbCrop,sourceTone});
  cx.putImageData(im,pad,pad);return out;
}
function texFromArtwork(cv,original=false){
  const t=new THREE.CanvasTexture(cv);
  t.colorSpace=original?THREE.SRGBColorSpace:THREE.NoColorSpace;
  t.flipY=false;t.wrapS=t.wrapT=THREE.ClampToEdgeWrapping;
  t.magFilter=THREE.LinearFilter;
  // Filter coverage before compositing, including when artwork is reduced or
  // rotated. Mipmaps are generated once, never while adjusting a layer.
  t.minFilter=THREE.LinearMipmapLinearFilter;t.generateMipmaps=true;
  t.premultiplyAlpha=false;
  t.anisotropy=Math.min(8,renderer.capabilities.getMaxAnisotropy());
  t.needsUpdate=true;return t;
}
// model
document.getElementById('btnModel').onclick=()=>{
  const f=document.getElementById('fileModel'); f.value=''; f.click();
};
document.getElementById('fileModel').onchange=e=>{
  if(e.target.files[0]) loadModel(e.target.files[0]);
};
document.getElementById('btnFlip').onclick=()=>{
  if(!isCustom)return;
  recordArtUndo();customFlipped=!customFlipped;
  const turn=new THREE.Matrix4().makeRotationY(Math.PI);
  current.traverse(o=>{if(o.isMesh){o.geometry.applyMatrix4(turn);o.geometry.computeBoundingSphere();}});
  for(const q of artLayers.map(layer=>layer.anchor).filter(Boolean)){
    q.point=new THREE.Vector3(...q.point).applyMatrix4(turn).toArray();
    q.normal=new THREE.Vector3(...q.normal).transformDirection(turn).toArray();
  }
  requestArtworkRender();rebuildPresentClone(false);
};
document.getElementById('btnShipped').onclick=()=>loadCatalog(selectedCatalogId);
document.getElementById('artPosition').onclick=()=>{if(isCustom)beginAnchorPick(activeArtId);else openMovePicker();};
document.getElementById('positionCancel').onclick=()=>{cancelAnchorPick();artStatus('');};
document.addEventListener('keydown',e=>{if(e.key==='Escape'&&anchorPickId){cancelAnchorPick();artStatus('');}});

// Global image drop and manual Add artwork share the same placement chooser.
const placementDialog=document.getElementById('placementDialog');
let placementMode='front',placementSuggested='front';
const placementSide=slot=>ART_META[slot]?.side==='Inside'?'inside':ART_META[slot]?.side==='Back'?'back':'front';
function renderPlacements(){
  const kind=GARMENT_CATALOG.find(g=>g.id===activeGarmentId)?.type||'tee';
  const available=isCustom?ART_KEYS.filter(k=>!ART_META[k].hoodie||kind==='hoodie'):Object.keys(UV_PROFILES);
  renderPlacementDiagram(placementDialog.querySelector('.placement-options'),{
    kind,side:placementMode,available,meta:ART_META,suggested:placementSuggested,
    counts:Object.fromEntries(available.map(slot=>[slot,artLayers.filter(layer=>layer.slot===slot).length]))
  });
  for(const button of placementDialog.querySelectorAll('[data-placement-side]')){
    const active=button.dataset.placementSide===placementMode;
    button.setAttribute('aria-selected',String(active));button.tabIndex=active?0:-1;
  }
  placementDialog.querySelector('.placement-options').setAttribute('aria-labelledby','placement-tab-'+placementMode);
}
for(const button of placementDialog.querySelectorAll('[data-placement-side]'))button.onclick=()=>{placementMode=button.dataset.placementSide;renderPlacements();};
placementDialog.querySelector('.placement-tabs').addEventListener('keydown',event=>{
  if(!['ArrowLeft','ArrowRight','Home','End'].includes(event.key))return;
  event.preventDefault();
  const sides=['front','back','inside'],index=sides.indexOf(placementMode);
  const next=event.key==='Home'?'front':event.key==='End'?'inside':sides[(index+(event.key==='ArrowLeft'?2:1))%3];
  const button=placementDialog.querySelector(`[data-placement-side="${next}"]`);button.click();button.focus();
});
let placementFiles=[],placementEntries=[],placementMoveId=null,placementThumbUrl=null,placementReturnFocus=null;
function openPlacementPicker(files,suggested=activeArtSlot){
  if(artLoading)return;
  const images=Array.from(files).filter(f=>f.type.startsWith('image/')||/\.(png|jpe?g|webp|gif|avif|svg)$/i.test(f.name));
  if(!images.length){artStatus('Choose a supported image file.');return;}
  placementEntries=[];placementMoveId=null;document.getElementById('placementTitle').textContent='Choose a placement';
  placementFiles=images;placementReturnFocus=document.activeElement;
  if(placementThumbUrl)URL.revokeObjectURL(placementThumbUrl);
  placementThumbUrl=URL.createObjectURL(images[0]);
  document.getElementById('placementImage').src=placementThumbUrl;
  document.getElementById('placementFileName').textContent=images.length===1?images[0].name:`${images.length} images`;
  placementSuggested=suggested;placementMode=placementSide(suggested);renderPlacements();
  if(!placementDialog.open)placementDialog.showModal();
}
function closePlacementPicker(){placementDialog.close();}
placementDialog.addEventListener('close',()=>{
  // A queued close event can arrive after a new picker has already opened.
  // It must not revoke that new artwork preview or clear its pending files.
  if(placementDialog.open)return;
  placementFiles=[];placementEntries=[];placementMoveId=null;
  if(placementThumbUrl)URL.revokeObjectURL(placementThumbUrl);
  placementThumbUrl=null;document.getElementById('placementImage').removeAttribute('src');
  placementReturnFocus?.focus?.();
});
document.getElementById('placementCancel').onclick=closePlacementPicker;
placementDialog.addEventListener('click',e=>{if(e.target===placementDialog)closePlacementPicker();});
function openEntryPicker(entries){
  if(artLoading||!entries.length)return;
  placementFiles=[];placementEntries=entries;placementMoveId=null;placementReturnFocus=document.activeElement;
  document.getElementById('placementTitle').textContent='Choose a placement';
  document.getElementById('placementImage').src=entries[0].thumb;
  document.getElementById('placementFileName').textContent=entries.length===1?entries[0].name:`${entries.length} images`;
  placementSuggested=activeArtSlot;placementMode=placementSide(activeArtSlot);renderPlacements();placementDialog.showModal();
}
function openMovePicker(){
  const entry=artEntry();if(artLoading||!entry)return;
  placementFiles=[];placementEntries=[];placementMoveId=entry.id;placementReturnFocus=document.activeElement;
  document.getElementById('placementTitle').textContent='Change placement';
  document.getElementById('placementImage').src=entry.thumb;document.getElementById('placementFileName').textContent=entry.name;
  placementSuggested=entry.slot;placementMode=placementSide(entry.slot);renderPlacements();placementDialog.showModal();
}
placementDialog.querySelector('.placement-options').addEventListener('click',async event=>{
  const button=event.target.closest('[data-place]');if(!button||button.disabled)return;
  const files=placementFiles.slice(),entries=placementEntries.slice(),moveId=placementMoveId,slot=button.dataset.place;
  closePlacementPicker();
  if(moveId){
    const entry=artEntry(moveId);if(!entry||!UV_PROFILES[slot])return;
    recordArtUndo();entry.slot=slot;entry.defaultSlot=slot;entry.defaultScale=ART_META[slot].scale;
    entry.anchor=null;entry.sleevePreset='patch';entry.placement={x:0,y:0,scale:ART_META[slot].scale/100,rot:0};
    activeArtSlot=slot;activeArtId=moveId;requestArtworkRender();syncArtworkUi();viewArtwork(slot);workspace?.notify();return;
  }
  const added=entries.length?addArtworkEntries(slot,entries):await loadArtFiles(slot,files,'add');
  if(added.length){viewArtwork(slot);if(isCustom&&!added[0].anchor)beginAnchorPick(added[0].id);}
});
document.getElementById('artUploadAny').onclick=()=>workspace?.openAssets();
const dropEl=document.getElementById('drop');
let dragDepth=0;
const hasDropFiles=e=>Array.from(e.dataTransfer?.types||[]).includes('Files');
document.addEventListener('dragenter',e=>{if(!hasDropFiles(e))return;e.preventDefault();dragDepth++;dropEl.classList.add('on');});
document.addEventListener('dragover',e=>{if(hasDropFiles(e)){e.preventDefault();e.dataTransfer.dropEffect='copy';}});
document.addEventListener('dragleave',e=>{if(!hasDropFiles(e))return;if(--dragDepth<=0){dragDepth=0;dropEl.classList.remove('on');}});
document.addEventListener('drop',e=>{
  if(!hasDropFiles(e))return;
  e.preventDefault();dragDepth=0;dropEl.classList.remove('on');
  if(designLocked||modelLoading||artLoading||workspace?.busy)return;
  const files=Array.from(e.dataTransfer.files),project=files.find(f=>/\.(orb|zip)$/i.test(f.name)),model=files.find(f=>/\.glb$/i.test(f.name));
  if(project){workspace.dropProject(project);return;}
  if(hasDirectory(e.dataTransfer)){workspace.dropFolder(e.dataTransfer);return;}
  if(model){loadModel(model);return;}
  const slot=e.target.closest?.('[data-art-card]')?.dataset.slot||activeArtSlot;
  openPlacementPicker(files,slot);
});
window.addEventListener('blur',()=>{dragDepth=0;dropEl.classList.remove('on');});


// present + save
const pageHeader=document.querySelector('header');
const panel=document.getElementById('panel');
const mobilePresentQuery=window.matchMedia('(max-width:820px)');
const isMobilePresent=()=>mobilePresentQuery.matches;
function enterPresent(){
  if(state.present || !current) return;
  if(state.focusTarget.y>.1)setView('angle');

  // Clone is already cached. Make it visible and mark Present active in the
  // same frame so the animation loop cannot immediately hide it again.
  if(!presentCloneActive) rebuildPresentClone(false);
  const showPair=!isMobilePresent();
  presentGarment.visible=showPair;
  setPresentCloneOpacity(0);
  presentShadow.visible=showPair;
  presentShadow.material.opacity=0;
  presentSpin=0;
  presentMix=0;
  state.present=true;
  document.body.classList.add('present');
  stage.dataset.present='1';
}
function exitPresent(){
  if(!state.present) return;

  // Preserve the apparent orientation of the primary shirt when its temporary
  // presentation rotation is removed, avoiding a visual snap on exit.
  state.az-=presentSpin;
  state.taz-=presentSpin;
  presentSpin=0;

  state.present=false;
  document.body.classList.remove('present');
  stage.dataset.present='0';
}
document.getElementById('btnPresent').onclick=enterPresent;
addEventListener('keydown',e=>{ if(e.key==='Escape'&&state.present) exitPresent(); });

const presentExitShield=document.getElementById('presentExitShield');
presentExitShield.addEventListener('pointerdown',e=>{
  // Block the gesture before it can reach the full-viewport WebGL canvas.
  e.preventDefault();
  e.stopPropagation();
},{passive:false});
presentExitShield.addEventListener('click',e=>{
  e.preventDefault();
  e.stopPropagation();
  if(state.present) exitPresent();
});
presentExitShield.addEventListener('wheel',e=>{
  if(!state.present) return;
  e.preventDefault();
  e.stopPropagation();
},{passive:false});

/* ================================= loop ================================= */

function resize(){
  if(renderSuspended)return;
  const w=window.innerWidth||1,h=window.innerHeight||1;
  renderer.setSize(w,h,false);
  drawPatternBackground();
}
addEventListener('resize',resize);

const clock=new THREE.Clock();
let intro=REDUCED?1:0;

// Tunable rotational cloth inertia.
// "Settle time" changes the release timescale while preserving roughly the
// same damping character, so ramp-in and settle-out can be tuned separately.
const INERTIA_BASE_SETTLE=0.35;
let inertiaInput=0;
let inertiaTwist=0;
let inertiaVelocity=0;
let inertiaReleaseKick=0;
let inertiaLoadTarget=0;
let inertiaLastMotionVelocity=0;

function updateFabricInertia(dt){
  if(REDUCED || !state.inertia.enabled){
    inertiaInput=inertiaTwist=inertiaVelocity=inertiaReleaseKick=0;
    inertiaLoadTarget=0;
    inertiaLastMotionVelocity=0;
    uni.uTwist.value=0;
    return;
  }

  const maxTwist=THREE.MathUtils.degToRad(state.inertia.strength);

  if(dragging){
    // While the pointer is held, do NOT run the settling spring.
    // We only load a trailing deformation and hold it there until release.
    const raw=orbitInputVelocity;
    const rampTau=Math.max(0.015,state.inertia.ramp/1000);
    const inputBlend=1-Math.exp(-dt/rampTau);
    inertiaInput += (raw-inertiaInput)*inputBlend;

    const sens=clamp(state.inertia.sensitivity/100,0,1);
    const dead=lerp(0.30,0.04,sens);
    const full=lerp(4.60,1.80,sens);
    const mag=Math.abs(inertiaInput);

    if(mag>dead && maxTwist>0){
      let t=clamp((mag-dead)/Math.max(0.001,full-dead),0,1);
      t=t*t*(3-2*t);

      // IMPORTANT: use the SAME sign as camera azimuth change.
      // From the user's apparent-shirt-rotation perspective, this makes the
      // lower fabric and sleeves trail behind instead of moving ahead.
      inertiaLoadTarget=Math.sign(inertiaInput)*maxTwist*t;
    }

    // A second, slower load stage makes the lower fabric visibly "stay back"
    // before accumulating its lag. Pausing while still held does not settle it.
    const loadTau=Math.max(0.025,rampTau*1.35);
    const loadBlend=1-Math.exp(-dt/loadTau);
    inertiaTwist += (inertiaLoadTarget-inertiaTwist)*loadBlend;

    // No spring velocity is allowed to build while held; all oscillation begins
    // only after pointer release.
    inertiaVelocity=0;
    inertiaReleaseKick=0;

  }else{
    // Once released, the loaded twist is free to catch up to neutral and swing
    // past it. This is the only phase where the under-damped spring runs.
    inertiaInput += (0-inertiaInput)*(1-Math.exp(-dt/0.10));

    const settleScale=clamp(state.inertia.settle/INERTIA_BASE_SETTLE,0.35,7.2);
    const activeK=clamp(state.inertia.elasticity,10,100);
    const k=activeK/(settleScale*settleScale);

    const over=clamp(state.inertia.overshoot/100,0,1);
    const dampingRatio=lerp(1.02,0.18,over);
    const damping=(2*Math.sqrt(activeK)*dampingRatio)/settleScale;

    if(Math.abs(inertiaReleaseKick)>0.000001){
      inertiaVelocity += inertiaReleaseKick;
      inertiaReleaseKick=0;
    }

    inertiaVelocity += (0-inertiaTwist)*k*dt;
    inertiaVelocity *= Math.exp(-damping*dt);
    inertiaTwist += inertiaVelocity*dt;
    inertiaTwist=clamp(inertiaTwist,-maxTwist*1.20,maxTwist*1.20);

    if(Math.abs(inertiaTwist)<0.00002 && Math.abs(inertiaVelocity)<0.00005){
      inertiaTwist=0;
      inertiaVelocity=0;
      inertiaLoadTarget=0;
      inertiaLastMotionVelocity=0;
    }
  }

  uni.uTwist.value=inertiaTwist;
}

const presentScreenRight=new THREE.Vector3();

function activeRenderRect(eased){
  const W=window.innerWidth||1;
  const H=window.innerHeight||1;
  const r=stage.getBoundingClientRect();

  // #stage remains the normal-mode render region. Present smoothly grows that
  // region into the entire viewport. This is only a viewport/scissor change,
  // not a WebGL canvas resize.
  const left=THREE.MathUtils.lerp(r.left,0,eased);
  const top=THREE.MathUtils.lerp(r.top,0,eased);
  const width=THREE.MathUtils.lerp(Math.max(1,r.width),W,eased);
  const height=THREE.MathUtils.lerp(Math.max(1,r.height),H,eased);

  return {left,top,width,height,W,H};
}

function draw(){
  flushArtwork();
  const eased=presentMix*presentMix*(3-2*presentMix);
  const mobileSingle=isMobilePresent();
  const vr=activeRenderRect(eased);
  const activeAspect=Math.max(0.1,vr.width/vr.height);

  // Mobile does not need an artificial zoom anymore. Expanding the actual
  // render region vertically gives the shirt the space it was missing.
  //
  // On desktop, zoom out only when the viewport is narrow enough that a
  // two-shirt layout genuinely needs extra horizontal room.
  const tanHalfFov=Math.tan(THREE.MathUtils.degToRad(camera.fov*0.5));
  // Keep enough physical separation that the two garment meshes never pass
  // through each other. Narrow windows are handled by camera fit, not by
  // squeezing the shirts together.
  const targetPairOffset=PRESENT_OFFSET;
  const baseHorizontalHalf=tanHalfFov*state.r*activeAspect;
  const approxShirtHalfWidth=0.39;
  const neededHalf=(targetPairOffset+approxShirtHalfWidth)*1.12;
  const narrowPairFit=mobileSingle ? 1 : THREE.MathUtils.clamp(neededHalf/Math.max(0.001,baseHorizontalHalf),1,1.80);

  // Mobile Present uses the full viewport, but backs the camera away slightly
  // so the whole garment has comfortable breathing room top-to-bottom.
  const mobileFit=mobileSingle ? THREE.MathUtils.lerp(1,1.14,eased) : 1;
  const viewR=state.r*THREE.MathUtils.lerp(1,narrowPairFit,eased)*mobileFit;

  camera.aspect=activeAspect;
  camera.updateProjectionMatrix();
  state.focus.lerp(state.focusTarget,.22);
  camera.position.set(
    state.focus.x+viewR*Math.sin(state.el)*Math.sin(state.az),
    viewR*Math.cos(state.el)+state.focus.y+0.02,
    state.focus.z+viewR*Math.sin(state.el)*Math.cos(state.az));
  camera.lookAt(state.focus);
  camera.updateMatrixWorld();
  updateLightLock();

  presentScreenRight.set(1,0,0).applyQuaternion(camera.quaternion);

  if(mobileSingle){
    // One centered shirt in mobile Present.
    garment.position.set(0,-0.350,0);
  }else{
    garment.position.set(
      presentScreenRight.x*(-targetPairOffset*eased),
      -0.350,
      presentScreenRight.z*(-targetPairOffset*eased)
    );
  }

  shirtShadow.position.x=garment.position.x;
  shirtShadow.position.z=garment.position.z;

  if(presentCloneActive && !mobileSingle){
    // Start beyond the ACTUAL viewport edge. Because the WebGL canvas itself is
    // full-window, the only clipping boundary is now the real screen edge,
    // never an invisible internal #stage edge.
    const horizontalHalf=tanHalfFov*viewR*activeAspect;
    const cloneStart=horizontalHalf+approxShirtHalfWidth*1.20;
    const cloneOffset=THREE.MathUtils.lerp(cloneStart,targetPairOffset,eased);

    presentGarment.position.set(
      presentScreenRight.x*cloneOffset,
      -0.350,
      presentScreenRight.z*cloneOffset
    );
    presentGarment.rotation.y=presentSpin+Math.PI;

    // Fade only while crossing the real screen edge. This prevents a hard
    // cropped vertical silhouette without making the shirt pop in beside A.
    let cloneAlpha=THREE.MathUtils.clamp((eased-0.06)/0.24,0,1);
    cloneAlpha=cloneAlpha*cloneAlpha*(3-2*cloneAlpha);

    const cloneShown=cloneAlpha>0.004;
    presentGarment.visible=cloneShown;
    setPresentCloneOpacity(cloneAlpha);

    presentShadow.position.x=presentGarment.position.x;
    presentShadow.position.z=presentGarment.position.z;
    presentShadow.visible=cloneShown;
    presentShadow.material.opacity=cloneAlpha;
  }else{
    presentGarment.visible=false;
    setPresentCloneOpacity(0);
    presentShadow.visible=false;
    presentShadow.material.opacity=0;
  }

  garment.rotation.y=presentSpin;

  // Clear the entire permanent canvas so no previous larger presentation frame
  // can linger when the viewport contracts back into #stage.
  renderer.setScissorTest(false);
  renderer.setViewport(0,0,vr.W,vr.H);
  renderer.clear(true,true,true);

  // WebGL viewport origin is bottom-left; DOM rect origin is top-left.
  const vx=vr.left;
  const vy=vr.H-(vr.top+vr.height);
  renderer.setViewport(vx,vy,vr.width,vr.height);
  renderer.setScissor(vx,vy,vr.width,vr.height);
  renderer.setScissorTest(true);
  updateShadowMap();
  renderer.render(scene,camera);
  renderer.setScissorTest(false);
}
function tick(){
  requestAnimationFrame(tick);
  const dt=Math.min(0.05,clock.getDelta());
  if(renderSuspended)return;
  uni.uTime.value+=dt;
  updateCityTraffic(dt);updateCreativeLighting(dt);
  if(intro<1){
    intro=Math.min(1,intro+dt/1.15);
    state.r=lerp(2.45,state.tr,1-Math.pow(1-intro,3));
  } else state.r+=(state.tr-state.r)*0.16;
  const presentTarget=state.present?1:0;
  const presentFollow=1-Math.exp(-dt*6.2);
  presentMix+=(presentTarget-presentMix)*presentFollow;

  if(state.present && !REDUCED) presentSpin+=dt*0.19;

  if(!state.present && presentMix<0.002 && presentCloneActive){
    presentMix=0;
    presentGarment.visible=false;
    setPresentCloneOpacity(0);
    presentShadow.visible=false;
    presentShadow.material.opacity=0;
    garment.rotation.y=0;
    garment.position.set(0,-0.350,0);
  }

  state.az+=(state.taz-state.az)*0.22;
  state.el+=(state.tel-state.el)*0.22;
  uni.uWind.value+=(WIND_LEVELS[state.wind]-uni.uWind.value)*0.05;
  updateFabricInertia(dt);
  if(anchorPickId){uni.uWind.value=0;uni.uTwist.value=0;}
  draw();
}

/* ================================= boot ================================= */

const loadImg=b64=>new Promise((res,rej)=>{
  const i=new Image(); i.onload=()=>res(i); i.onerror=rej;
  i.src='data:image/png;base64,'+b64;
});

function brandArtworkSourceUrl(url,longEdge){
  if(!url.startsWith('data:image/svg+xml'))return url;
  const comma=url.indexOf(','),payload=url.slice(comma+1);
  const text=url.slice(0,comma).includes(';base64')?atob(payload):decodeURIComponent(payload);
  const doc=new DOMParser().parseFromString(text,'image/svg+xml'),svg=doc.documentElement;
  if(svg.localName!=='svg'||doc.querySelector('parsererror'))throw new Error('Invalid brand SVG.');
  const box=(svg.getAttribute('viewBox')||'').trim().split(/[\s,]+/).map(Number);
  const w=box[2]||parseFloat(svg.getAttribute('width')),h=box[3]||parseFloat(svg.getAttribute('height'));
  if(!(w>0&&h>0))return url;
  // Set the SVG's rasterization viewport BEFORE decoding. Enlarging a small
  // decoded bitmap later cannot recover the original vector edge detail.
  const limit=Math.max(1,Math.min(longEdge,4096,renderer.capabilities.maxTextureSize-8));
  const scale=limit/Math.max(w,h);
  svg.setAttribute('width',Math.max(1,Math.round(w*scale))+'px');
  svg.setAttribute('height',Math.max(1,Math.round(h*scale))+'px');
  return 'data:image/svg+xml;charset=utf-8,'+encodeURIComponent(new XMLSerializer().serializeToString(svg));
}
const loadSvg=(url,longEdge)=>new Promise((resolve,reject)=>{
  const img=new Image();img.onload=()=>resolve(img);img.onerror=reject;
  try{img.src=brandArtworkSourceUrl(url,longEdge);}catch(error){reject(error);}
});
function initializeBrandArtwork(logo,back){
  return [[logo,'Emblem','chest'],[back,'Wordmark','back']].map(([image,name,slot])=>{
    const entry=makeArtworkEntry(image,BRAND.name+' '+name+'.svg');
    entry.solidInvert=true; // The bundled ORB graphics are black on transparent.
    entry.mode='ink'; // Only the startup graphics override the Original default.
    // A null custom color follows the garment until the user picks a color.
    const layer=initializeLayer(entry,slot);
    if(slot==='chest'){layer.placement.scale=.6;layer.defaultScale=60;}
    layer.defaultMode='ink';layer.defaultSolidInvert=true;
    return layer;
  });
}
function setStudioInput(id,value,event='input'){
  const input=document.getElementById(id);
  if(input.type==='checkbox')input.checked=!!value;else input.value=String(value);
  input.dispatchEvent(new Event(event,{bubbles:true}));
}
function resetStudioColor(id,keepOpen=false){
  const entry=artEntry();
  if(id==='artwork')id=entry?.mode==='tint'?'tintCustom':entry?.mode==='ink'?'inkCustom':null;
  if(!id)return;
  if(!keepOpen)colorPicker?.close();
  if(id==='inkCustom'||id==='tintCustom'){
    if(artLoading||!entry)return;recordArtUndo();entry[id]=null;requestArtworkRender(entry);syncInkUi();
  }else if(id==='garmentCustom'){
    useManualFabricColor();state.blank=0;state.garmentCustom='#D8D8D8';
    document.getElementById(id).value=state.garmentCustom;document.querySelector('#swatches .custom i').style.background=state.garmentCustom;
    syncGarmentSwatches();applyLook();
  }else if(id==='gridColor'){
    state.gridColorCustom=false;state.gridColor=state.light==='uv'?UV_BACKDROP.gridColor:BRAND[state.theme].grid;document.getElementById(id).value=state.gridColor;drawPatternBackground();
  }else if(id==='bgCustom')setStudioInput(id,state.light==='uv'?UV_BACKDROP.bg:THEMES[state.theme].bg);
  if(keepOpen)colorPicker?.refresh();
}
function installGroupResets(){
  for(const button of document.querySelectorAll('[data-reset-group]')){
    button.innerHTML=RESET_ICON;
    button.onclick=()=>{
      colorPicker?.close();colorActions?.cancel();
      switch(button.dataset.resetGroup){
        case 'lighting':
          Object.assign(state,CREATIVE_DEFAULTS,{runwayPaused:REDUCED,afterglowPaused:REDUCED,projectorPaused:REDUCED});state.blackLightPower=100;state.regularLightPower=100;state.nightLightPower=100;state.nightTraffic='subtle';state.nightPaused=REDUCED;
          document.querySelector('#segLight [data-v="studio"]').click();setStudioInput('lightPower',100);
          setStudioInput('lightLock',false,'change');setStudioInput('selfShadows',true,'change');
          break;
        case 'grid':
          setStudioInput('dotGrid',true,'change');setStudioInput('gridType','square','change');resetStudioColor('gridColor');
          applyGridScale(35);applyGridCharSize(45);applyGridStroke(.5);break;
        case 'artwork':{
          const entry=artEntry();if(!entry||artLoading)return;recordArtUndo();
          Object.assign(entry,{mode:entry.defaultMode||'original',inkCustom:null,tintCustom:null,solidCutoff:12,solidSoftness:65,solidMaskSource:'auto',solidSpread:0,solidEdgeSoftness:0,solidInvert:!!entry.defaultSolidInvert,printPattern:'none',printSize:40,printAngle:45,printStrength:100,printVersion:2,printMarkSize:50,printTone:100,printErosion:0,printPixelScale:35,glow:false,uvReactive:false,emission:100,fit:hasFullSleeve(entry)&&entry.sleevePreset==='full'});
          requestArtworkRender(entry);syncArtworkUi();break;
        }
      }
    };
  }
  // Text group resets use the same glyph and borderless treatment as individual resets.
  for(const [id,label] of [['artReset','Reset placement'],['resetInertia','Reset motion']]){
    const button=document.getElementById(id);button.classList.add('reset-action');button.innerHTML=RESET_ICON+'<span>'+label+'</span>';
  }
}
function samplePreviewColor(x,y){
  const bounds=stage.getBoundingClientRect();if(x<bounds.left||x>=bounds.right||y<bounds.top||y>=bounds.bottom)return null;
  // Capture only when the user samples; no persistent GPU readback or screenshots.
  draw();const gl=renderer.getContext(),rgba=new Uint8Array(4),rect=canvas.getBoundingClientRect();
  const px=Math.max(0,Math.min(canvas.width-1,Math.floor((x-rect.left)*canvas.width/rect.width)));
  const py=Math.max(0,Math.min(canvas.height-1,Math.floor((y-rect.top)*canvas.height/rect.height)));
  gl.readPixels(px,canvas.height-1-py,1,1,gl.RGBA,gl.UNSIGNED_BYTE,rgba);
  const bg=patternCtx.getImageData(Math.min(patternCanvas.width-1,Math.floor(x*patternCanvas.width/innerWidth)),Math.min(patternCanvas.height-1,Math.floor(y*patternCanvas.height/innerHeight)),1,1).data;
  const alpha=rgba[3]/255,premultiplied=gl.getContextAttributes().premultipliedAlpha;
  return '#'+[0,1,2].map(i=>Math.round(Math.min(255,rgba[i]*(premultiplied?1:alpha)+bg[i]*(1-alpha))).toString(16).padStart(2,'0')).join('').toUpperCase();
}

// Shared state boundary for undo, portable files, and browser recovery.
function designSnapshot(){
  return {name:document.getElementById('designName').value,garmentId:activeGarmentId,customFlipped,modelFile:customModelFile,modelToken:modelHistoryId(customModelFile),active:activeArtId,
    settings:structuredClone(pick(state,SETTING_FIELDS)),regularBackdrop:regularBackdrop?{...regularBackdrop}:null,
    lighting:{reference:lightReference.toArray(),quaternion:lightRig.quaternion.toArray()},
    camera:{az:state.taz,el:state.tel,r:state.tr,focus:state.focusTarget.toArray(),view:state.view},
    layers:artLayers.map(e=>({...e,placement:{...e.placement},anchor:e.anchor?structuredClone(e.anchor):null}))};
}
function historyKey(snapshot){return JSON.stringify({name:snapshot.name,garmentId:snapshot.garmentId,customFlipped:snapshot.customFlipped,modelToken:snapshot.modelToken,settings:snapshot.settings,regularBackdrop:snapshot.regularBackdrop,layers:snapshot.layers.map(e=>pick(e,LAYER_FIELDS))});}
function legacySolidInvert(source){
  // Migrate pre-v37 Solid layers once; new artwork always uses explicit polarity.
  const w=source.width,h=source.height,d=source.getContext('2d').getImageData(0,0,w,h).data;
  let transparent=false,light=0,alpha=0;
  for(let i=0;i<d.length;i+=4){transparent ||= d[i+3]<255;light+=(d[i]*.299+d[i+1]*.587+d[i+2]*.114)*d[i+3];alpha+=d[i+3];}
  if(transparent)return alpha>0&&light/alpha<127;
  const size=Math.min(12,w,h);let corners=0,count=0;
  for(const [x0,y0] of [[0,0],[w-size,0],[0,h-size],[w-size,h-size]])for(let y=y0;y<y0+size;y++)for(let x=x0;x<x0+size;x++){
    const i=(y*w+x)*4;corners+=d[i]*.299+d[i+1]*.587+d[i+2]*.114;count++;
  }
  return corners/Math.max(1,count)>127;
}
function restoreDesignState(snapshot,restoreCamera=true){
  colorPicker?.close();colorActions?.cancel();cancelAnchorPick();finishArtworkRename(false);
  artLayers=snapshot.layers.map(e=>({...e,placement:{...e.placement},anchor:e.anchor?structuredClone(e.anchor):null}));
  for(const layer of artLayers)if(layer.solidInvert===undefined){
    layer.solidInvert=(layer.mode==='ink'||layer.defaultMode==='ink')?legacySolidInvert(layer.source):false;
    layer.defaultSolidInvert=layer.defaultMode==='ink'&&layer.solidInvert;
  }
  for(const layer of artLayers)migratePlacement(layer,layerProfile(layer));
  activeArtId=artLayers.some(e=>e.id===snapshot.active)?snapshot.active:null;
  if(artEntry())activeArtSlot=artEntry().slot;
  nextArtId=Math.max(nextArtId,...artLayers.map(e=>(Number(e.id.replace(/^art-/,''))||0)+1));
  Object.assign(state,{...CREATIVE_DEFAULTS,runwayPaused:REDUCED,afterglowPaused:REDUCED,projectorPaused:REDUCED,nightLightPower:100,nightTraffic:'subtle',nightPaused:REDUCED},structuredClone(pick(snapshot.settings,SETTING_FIELDS)));
  if(state.light==='night')state.lightPower=state.nightLightPower;
  document.getElementById('designName').value=snapshot.name||'Untitled design';
  regularBackdrop=snapshot.regularBackdrop?{...snapshot.regularBackdrop}:state.light==='uv'?{bg:THEMES.light.bg,gridColor:BRAND.light.grid,gridColorCustom:false}:null;
  applyTheme(false);
  // Theme application can choose a default grid; the saved preview takes precedence.
  state.bg=snapshot.settings.bg;state.gridColor=snapshot.settings.gridColor;
  // Refresh earlier light-theme defaults restored by browser autosave.
  const oldLightDefaults=['#f4f4f4','#dbd9d3'];
  if(state.theme==='light'){
    if(state.light!=='uv'&&oldLightDefaults.includes(state.bg.toLowerCase()))state.bg=THEMES.light.bg;
    if(regularBackdrop&&oldLightDefaults.includes(regularBackdrop.bg.toLowerCase()))regularBackdrop.bg=THEMES.light.bg;
  }
  if(snapshot.lighting){lightReference.fromArray(snapshot.lighting.reference);lightRig.quaternion.fromArray(snapshot.lighting.quaternion);lightReferenceReady=true;}
  applyLightingPreset();
  renderer.shadowMap.enabled=state.selfShadows;shadowDirty=true;
  scene.traverse(o=>{if(o.isMesh)for(const m of Array.isArray(o.material)?o.material:[o.material])m.needsUpdate=true;});
  if(restoreCamera&&snapshot.camera){const c=snapshot.camera;state.az=state.taz=c.az;state.el=state.tel=clamp(c.el,.25,2.8);state.r=state.tr=clamp(c.r,.08,10);state.focus.fromArray(c.focus);state.focusTarget.copy(state.focus);state.view=c.view;inspectionFocus=state.focusTarget.distanceTo(garmentCenter)>.03?{point:state.focusTarget.clone(),distance:state.tr}:null;}
  document.getElementById('garmentCustom').value=state.garmentCustom;document.querySelector('#swatches .custom i').style.background=state.garmentCustom;
  for(const id of ['bgCustom','gridColor']){document.getElementById(id).value=id==='bgCustom'?state.bg:state[id];const chip=document.getElementById(id==='bgCustom'?'bgColorChip':id+'Chip');if(chip)chip.style.background=id==='bgCustom'?state.bg:state[id];}
  for(const id of ['matchFabricToTheme','dotGrid','selfShadows'])document.getElementById(id).checked=state[id];
  document.getElementById('lightLock').checked=state.light==='night'||!state.lightLocked;
  document.getElementById('gridType').value=state.gridType;
  for(const [id,value] of [['segLight',state.light],['segWind',state.wind],['segView',state.view]])for(const b of document.querySelectorAll('#'+id+' button[data-v]'))b.setAttribute('aria-pressed',String(String(value)===b.dataset.v));
  for(const k of Object.keys(MOTION_APPLIERS))MOTION_APPLIERS[k](state.inertia[k]);
  document.getElementById('inertiaEnabled').checked=state.inertia.enabled;
  applyGridScale(state.gridScale);applyGridCharSize(state.gridCharSize);applyGridStroke(state.gridStroke);
  syncCameraUi();syncGridStyle();syncLightPowerControl();setArtworkGlossiness(state.artGlossiness);syncGarmentSwatches();
  requestArtworkRender();syncArtworkUi();applyLook();applyBackground();
}
async function restoreSnapshotGarment(snapshot,model){
  if(snapshot.garmentId==='custom'){
    if(!model)throw new Error('The custom garment is missing.');
    if(!isCustom||customModelFile!==model){if(!await loadModel(model))throw new Error('The custom garment could not load.');}
    if(!!snapshot.customFlipped!==customFlipped)document.getElementById('btnFlip').click();
  }else if(!await loadCatalog(snapshot.garmentId))throw new Error('The garment could not load. Your design was not replaced.');
}
function setWorkspaceLock(value,message='Working…'){
  designLocked=value;document.querySelector('header').inert=value;document.querySelector('main').inert=value;
  document.getElementById('workspaceBusy').hidden=!value;document.querySelector('#workspaceBusy span').textContent=message;
}
function installDesignHistory(){
  let editing=null;
  const before=e=>{if(designLocked||historyRestoring)return;const t=e.target;
    if(!t.closest('#panel,header,#colorPopover'))return;
    if(t.matches('input[type="file"],input[type="search"]'))return;
    if(e.type==='input'){
      if(!t.matches('input')||t.matches('input[type="checkbox"]'))return;
      const owner=t.closest('#colorPopover')&&colorPicker?.target?colorPicker.target:t;
      if(editing!==owner){recordArtUndo();editing=owner;}
    }else if(e.type==='change'){
      if(t.matches('input[type="checkbox"],select'))recordArtUndo();editing=null;
    }else if(t.closest('#swatches button[data-blank],#segLight button,#segWind button,[data-theme-mode],[data-reset-color],[data-reset-group],#resetArtGlossiness,[data-reset-motion],#resetInertia,#resetGridScale,#resetGridStroke,#resetGridCharSize'))recordArtUndo();
  };
  for(const type of ['input','change','click'])document.addEventListener(type,before,true);
  document.addEventListener('focusin',e=>{if(e.target.id==='designName')recordArtUndo();},true);
  document.addEventListener('focusout',()=>editing=null);
  document.addEventListener('pointerup',()=>workspace?.notify());
  document.addEventListener('keydown',e=>{
    if(!(e.ctrlKey||e.metaKey)||e.altKey||e.target.closest('input,textarea,select,[contenteditable="true"]'))return;
    if(e.key.toLowerCase()==='z'||e.key.toLowerCase()==='y'){e.preventDefault();undoArtwork(e.shiftKey||e.key.toLowerCase()==='y');}
  });
}
const defaultDesignSettings=structuredClone(pick(state,SETTING_FIELDS));
workspace=installWorkspace({
  schema:{garments:GARMENT_CATALOG.map(g=>g.id),slots:ART_KEYS},busy:()=>artLoading||modelLoading||designLocked,
  snapshot:designSnapshot,modelFile:()=>customModelFile,decode:decodeArtworkFile,
  finish:()=>{finishArtworkRename(true);colorPicker?.close();},lock:setWorkspaceLock,
  clearHistory:()=>{artHistory.length=0;artFuture.length=0;syncArtworkUi();},
  async restore(snapshot,model){
    historyRestoring=true;
    try{await restoreSnapshotGarment(snapshot,model);restoreDesignState(snapshot);}finally{historyRestoring=false;}
  },
  newDesign:()=>{
    const snapshot=designSnapshot();snapshot.layers=[];snapshot.active=null;snapshot.name='Untitled design';snapshot.settings=structuredClone(defaultDesignSettings);snapshot.regularBackdrop=null;
    recordArtUndo();restoreDesignState(snapshot,false);setView('angle');
  },
  chooseEntries:openEntryPicker,
  addEntries:(slot,entries,action,target)=>{addArtworkEntries(slot,entries,action,target);viewArtwork(slot);},
  browse:ctx=>{pendingUploadAction=ctx.action;pendingSlot=ctx.slot||activeArtSlot;pendingLayerId=ctx.target||null;fileInput.value='';fileInput.click();}
});
installDesignHistory();
document.getElementById('resetView').onclick=()=>setView('angle');
const cameraLabels={front:'Front',angle:'Front ¾',side:'Left',backangle:'Back ¾',back:'Back',detail:'Detail'};
for(const button of document.querySelectorAll('#segView button[data-v]'))button.textContent=cameraLabels[button.dataset.v];
for(const button of document.querySelectorAll('#segWind button'))button.textContent=['Still','Gentle','Breezy'][Number(button.dataset.v)];
const lightShortLabels={studio:'Studio',softbox:'Soft',day:'Day',night:'Night',uv:'UV',runway:'Runway',afterglow:'Afterglow',projector:'Projector'};
const lightShortcutViews=['studio','softbox','day','night','uv','runway','afterglow','projector'];
const cameraShortcutViews=['front','angle','side','backangle','back','detail','neck'];
for(const button of document.querySelectorAll('#segLight button')){
  const id=button.dataset.v,n=lightShortcutViews.indexOf(id)+1;
  button.textContent=lightShortLabels[id];button.setAttribute('aria-label',`${LIGHT_PRESETS[id].label}, numpad ${n}`);
  setTip(`#segLight button[data-v="${id}"]`,`${LIGHT_PRESETS[id].label} · Numpad ${n}. ${LIGHT_PRESETS[id].description}`);
}
for(const [i,id] of cameraShortcutViews.entries()){
  const selector=id==='neck'?'[data-detail-view="neck"]':`#segView button[data-v="${id}"]`;
  for(const button of document.querySelectorAll(selector))button.setAttribute('aria-keyshortcuts',String(i+1));
}
setTip('#detailCameraToggle','Detail cameras · top-row 6: Artwork close-up; 7: Inside neck tag; 8: Cycle other details.');
function cycleDetailCamera(){
  syncCameraUi();
  const views=Array.from(detailMenu.querySelectorAll('[data-detail-view]'))
    .filter(button=>button.dataset.detailView.startsWith('placement:')&&!button.hidden&&!button.disabled)
    .map(button=>button.dataset.detailView);
  if(!views.length)return;
  const next=(views.indexOf(state.view)+1)%views.length;
  closeDetailMenu();setView(views[next]);
}
function handlePresetShortcut(event){
  if(event.defaultPrevented||event.repeat||event.isComposing||event.ctrlKey||event.metaKey||event.altKey||event.shiftKey)return;
  if(event.target?.closest('input,textarea,select,[contenteditable]:not([contenteditable="false"]),[role="textbox"]'))return;
  if(designLocked||artLoading||modelLoading||workspace?.busy||document.querySelector('dialog[open]')||!document.getElementById('colorPopover').hidden)return;
  const light=/^Numpad([1-8])$/.exec(event.code),view=/^Digit([1-8])$/.exec(event.code);
  if(light){event.preventDefault();document.querySelector(`#segLight button[data-v="${lightShortcutViews[Number(light[1])-1]}"]`).click();}
  else if(view){event.preventDefault();if(view[1]==='8')cycleDetailCamera();else{closeDetailMenu();setView(cameraShortcutViews[Number(view[1])-1]);}}
}
document.addEventListener('keydown',handlePresetShortcut);
installExports({THREE,renderer,scene,camera,garment,presentGarment,shirtShadow,presentShadow,uni,state,current:()=>current,
  artworkColor:inkHex,snapshot:designSnapshot,workspace,busy:()=>artLoading||modelLoading||designLocked||workspace.busy,
  lock:setWorkspaceLock,pause:value=>renderSuspended=value,flush:flushArtwork,draw,resize,
  updateLights:updateLightLock,updateShadows:()=>{shadowDirty=true;updateShadowMap();},
  backdrop:drawPatternBackground,lighting:()=>({reference:lightReference.clone(),quaternion:lightRig.quaternion.clone()}),
  restoreLighting:s=>{lightReference.copy(s.reference);lightRig.quaternion.copy(s.quaternion);},
  finish:()=>{finishArtworkRename(true);colorPicker?.close();colorActions?.cancel();},
  name:()=>document.getElementById('designName').value,
  detailView:detailCamera,detailViews:[{id:'neck',label:'Inside neck tag'},...ART_KEYS.filter(k=>ART_META[k].detail).map(k=>({id:'placement:'+k,label:ART_META[k].label}))],
  viewAngles:v=>detailCamera(v)?.angles||(v==='right'?[-Math.PI/2,1.45]:VIEWS[v]),
  label:()=>GARMENT_CATALOG.find(g=>g.id===activeGarmentId)?.label||'Custom garment'
});

colorPicker=installColorPicker({onReset:input=>resetStudioColor(input.id,true)});
colorActions=installColorActions({picker:colorPicker,artworkTarget:()=>{const entry=artEntry();return entry&&entry.mode!=='original'?document.getElementById(entry.mode==='tint'?'tintCustom':'inkCustom'):null;},resetColor:resetStudioColor,samplePreview:samplePreviewColor});
installGroupResets();
installSliderControls(prop=>artDefault(artEntry()?.slot||activeArtSlot,prop));
await Promise.all([loadSvg(BRAND.wordmark,4096),loadSvg(BRAND.emblem,2048)]).then(async ([back,logo])=>{
  artLayers=initializeBrandArtwork(logo,back);
  requestArtworkRender();syncArtworkUi();
  setColorMode(state.themeMode);
  if(REDUCED||anchorPickId){ uni.uWind.value=0; uni.uTwist.value=0; }
  resize(); setView('angle');
  tick();
  if(!await loadCatalog(selectedCatalogId))throw new Error('Initial garment could not load.');
  window.ORBStartup?.progress(.94,'Preparing preview');
  // Upload textures, compose artwork, and draw the first garment before the handoff.
  resize();draw();
  await new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve)));
  for(let i=0;i<artLayers.length;i++){const registered=await workspace.register(artLayers[i]);artLayers[i].assetId=registered.assetId;}
  await workspace.ready();
  document.body.classList.add('ready');
  await window.ORBStartup?.complete();
  preloadCatalog();
}).catch(err=>{
  console.error(err);bootMsg.textContent='Preview could not initialize. Reload to try again.';
  window.ORBStartup?.fail('The preview could not load. Check your connection and try again.');
});
