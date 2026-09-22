// A repeatable traffic sequence with quiet intervals. No shadow maps or timers.
const smooth=(a,b,x)=>{const t=Math.max(0,Math.min(1,(x-a)/(b-a)));return t*t*(3-2*t);};
const events=[{start:1,duration:6.8,direction:1,brake:true,depth:1.5},{start:13,duration:5.5,direction:-1,brake:false,depth:-1.7},{start:24,duration:8,direction:-1,brake:true,depth:1.7},{start:39,duration:6,direction:1,brake:false,depth:-1.5}];
export function trafficSample(time,mode='subtle'){
 const t=(time*(mode==='active'?1.45:1))%50;
 const event=events.find(e=>t>=e.start&&t<=e.start+e.duration);
 if(mode==='off'||!event)return {head:0,tail:0,x:0,z:1.5};
 const u=(t-event.start)/event.duration;
 const head=smooth(0,.18,u)*(1-smooth(.46,.78,u));
 const tail=smooth(.38,.57,u)*(1-smooth(.82,1,u));
 const brake=event.brake?smooth(.62,.68,u)*(1-smooth(.76,.87,u)):0;
 return {head:head*(mode==='active'?1.25:1),tail:tail*(.22+.62*brake),x:event.direction*(-2.8+5.6*u),z:event.depth};
}
export function createCityTraffic(THREE,scene){
 const rig=new THREE.Group();scene.add(rig);
 const head=new THREE.DirectionalLight('#e7edff',0),pair=new THREE.DirectionalLight('#fff1d9',0),tail=new THREE.DirectionalLight('#ff2412',0);
 rig.add(head,pair,tail,head.target,pair.target,tail.target);rig.visible=false;
 let time=0;
 return {update(dt,{enabled,mode,paused,power}){
   rig.visible=enabled;
   if(!enabled)return;
   if(!paused&&mode!=='off')time+=Math.max(0,Math.min(.05,dt));
   const s=trafficSample(time,mode),gain=power/100;
   head.position.set(s.x,.02,s.z);pair.position.set(s.x+.32,.02,s.z);tail.position.set(s.x-.48,.08,s.z);
   head.intensity=s.head*.85*gain;pair.intensity=s.head*.28*gain;tail.intensity=s.tail*.9*gain;
 },get time(){return time;},rig};
}
