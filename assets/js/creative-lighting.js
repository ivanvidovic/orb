export const CREATIVE_DEFAULTS={runwayActivity:'gentle',runwayFlash:100,runwayPaused:false,runwayTime:0,runwayPower:100,afterglowSpeed:100,afterglowFade:4,afterglowPaused:false,afterglowTime:4,afterglowPower:100,projectorPattern:'caustics',projectorScale:100,projectorSpeed:35,projectorPaused:false,projectorTime:0,projectorPower:100};
export const isCreative=id=>['runway','afterglow','projector'].includes(id);
export function runwaySample(time,activity='gentle'){
 const events=activity==='active'?[.8,2.1,3.4,5.9,7.2,9.5,11.2,14.1,16.7,18.2]:[1.2,5.8,9.6,15.3];
 const t=((time%20)+20)%20,result=[0,0,0];
 events.forEach((start,i)=>{const d=t-start;if(d>=0&&d<.65)result[i%3]=Math.sin(Math.PI*Math.min(1,d/.09))*Math.exp(-d*5)+Math.exp(-Math.pow((d-.12)/.11,2))*.7;});
 return result;
}
export function projectorValue(x,y,t,pattern,scale){
 const u=(x-.5)/Math.max(.01,scale),v=(y-.5)/Math.max(.01,scale);
 if(pattern==='stripes')return .5+.5*Math.sin(u*32+t*.7);
 if(pattern==='geometry'){const a=u*Math.cos(t*.12)-v*Math.sin(t*.12),b=u*Math.sin(t*.12)+v*Math.cos(t*.12);return Math.sin(a*19+t*.3)*Math.cos(b*15-t*.2)>.25?1:.025;}
 const wave=Math.sin(u*17+t*.4+Math.sin(v*11-t*.25))+Math.sin(v*19-t*.33+Math.sin(u*13+t*.22));
 return .04+.96*Math.pow(Math.max(0,1-Math.abs(wave)*1.5),3);
}
export function createCreativeLighting(THREE,scene,uniforms){
 const rig=new THREE.Group();scene.add(rig);rig.visible=false;
 const flashes=['#f5f8ff','#fff2df','#edf2ff'].map((color,i)=>{const l=new THREE.DirectionalLight(color,0);l.position.set(...[[-1.5,.5,1.6],[1.7,.25,.8],[-.4,.8,-1.5]][i]);rig.add(l,l.target);return l;});
 const projector=new THREE.SpotLight('#e4f1ff',0,8,.38,.35,1),charger=new THREE.SpotLight('#fff5dd',0,8,.35,.55,1);
 for(const l of [projector,charger]){l.castShadow=true;l.shadow.mapSize.set(1024,1024);l.shadow.bias=-.0001;l.shadow.normalBias=.0015;rig.add(l,l.target);}
 projector.position.set(-.3,.65,2);projector.target.position.set(0,.02,0);charger.target.position.set(0,.02,0);
 const canvas=document.createElement('canvas');canvas.width=canvas.height=128;const ctx=canvas.getContext('2d'),pixels=ctx.createImageData(128,128),texture=new THREE.CanvasTexture(canvas);texture.colorSpace=THREE.SRGBColorSpace;projector.map=texture;
 let lastPattern='',lastFrame=-1;
 return {rig,projector,charger,flashes,update(dt,state){
  const mode=state.light;rig.visible=isCreative(mode);for(const l of flashes)l.intensity=0;projector.visible=mode==='projector';charger.visible=mode==='afterglow';
  uniforms.uAfterglow.value=mode==='afterglow'?1:0;
  if(!rig.visible)return;
  const paused=state[mode+'Paused'],delta=Math.max(0,Math.min(.05,dt));
  if(!paused)state[mode+'Time']+=delta;
  const time=state[mode+'Time'],gain=state.lightPower/100;
  if(mode==='runway'){const sample=runwaySample(time,state.runwayActivity);flashes.forEach((l,i)=>l.intensity=sample[i]*5*gain*state.runwayFlash/100);}
  if(mode==='afterglow'){
   const phase=time*state.afterglowSpeed/100/12*Math.PI*2;
   charger.position.set(Math.sin(phase)*1.7,.35,Math.cos(phase)*1.7);charger.intensity=4*gain;
   uniforms.uAfterPhase.value=phase;uniforms.uAfterFade.value=state.afterglowFade;uniforms.uAfterSpeed.value=state.afterglowSpeed/100;uniforms.uAfterPower.value=gain;
  }
  if(mode==='projector'){
   projector.intensity=8*gain;const t=time*state.projectorSpeed/100,frame=Math.floor(t*30),key=state.projectorPattern+'/'+state.projectorScale;
   if(frame!==lastFrame||key!==lastPattern){
    for(let y=0;y<128;y++)for(let x=0;x<128;x++){const i=(y*128+x)*4,n=Math.round(255*projectorValue(x/127,y/127,t,state.projectorPattern,state.projectorScale/100));pixels.data[i]=pixels.data[i+1]=pixels.data[i+2]=n;pixels.data[i+3]=255;}
    ctx.putImageData(pixels,0,0);texture.needsUpdate=true;lastFrame=frame;lastPattern=key;
   }
  }
 }};
}
