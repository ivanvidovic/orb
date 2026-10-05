// Small constrained cord chains. Garment geometry/materials remain ordinary GLB.
const systems=new WeakMap();
export function prepareCordMetadata(root,out,THREE){
 root.traverse(o=>{
  const c=o.userData.orbCordCollider;if(!c)return;
  const tr=(x,y,z)=>new THREE.Vector3(x,y,z).applyMatrix4(o.matrixWorld);
  const a=tr(c.xmin,0,c.zmin),b=tr(c.xmax,0,c.zmax);
  out.userData.orbCordCollider={nx:c.nx,ny:c.ny,xmin:a.x,xmax:b.x,ymin:b.y,ymax:a.y,
   front:c.front.map((z,i)=>z<-1?-10:tr(c.xmin+(i%c.nx)/(c.nx-1)*(c.xmax-c.xmin),z,c.zmin+Math.floor(i/c.nx)/(c.ny-1)*(c.zmax-c.zmin)).z)};
 });
}
export function adoptCordMetadata(source,mesh,THREE){
 const c=source.userData.orbCord;if(!c)return;
 mesh.userData.orbCord={...c,points:c.points.map(p=>new THREE.Vector3(...p).applyMatrix4(source.matrixWorld).toArray()),radius:c.radius*source.matrixWorld.getMaxScaleOnAxis()};
 // CPU deformation handles both cord and rigid tip; no second fabric warp.
 mesh.geometry.attributes.aFlow.array.fill(0);mesh.geometry.attributes.aFlow.needsUpdate=true;
 mesh.frustumCulled=false;
}
function smooth(a,b,x){const t=Math.max(0,Math.min(1,(x-a)/(b-a)));return t*t*(3-2*t);}
function displacement(p,o,V){
 const hn=Math.max(0,Math.min(1,(p.y+.024)/.696));const f=Math.pow(Math.max(0,1-hn/.86),1.35);
 const flow=Math.min(1,Math.max(f,.8*Math.pow(Math.max(0,(Math.abs(p.x)/o.halfWidth-.7)/.3),1.2)*smooth(.26,.58,hn)));
 V.set(0,0,0);if(flow<.001)return V;
 const t=o.time,w1=Math.sin(p.y*6.4-t*2.05+p.x*3.1),w2=Math.sin(p.y*12.7+t*3.25+p.z*5.3+1.7),w3=Math.sin(p.x*8.6+p.z*6.9-t*1.35),a=o.wind*flow;
 V.copy(o.dir).multiplyScalar((w1*.62+w2*.24)*a);V.y+=w3*.13*a;
 const rx=p.x+.0001,rz=p.z+.0001,rl=Math.hypot(rx,.0001,rz),rr=(w2*.30+w3*.22)*a/rl;V.x+=rx*rr;V.y+=.0001*rr;V.z+=rz*rr;
 const angle=o.twist*Math.pow(Math.max(flow*flow*(3-2*flow),.0001),o.flowPower),c=Math.cos(angle),s=Math.sin(angle);
 V.x+=c*p.x+s*p.z-p.x;V.z+=-s*p.x+c*p.z-p.z;return V;
}
function makeSystem(group,THREE,yaw){
 const bySide=new Map(),field=group.userData.orbCordCollider;
 for(const mesh of group.children){const c=mesh.userData.orbCord;if(!c)continue;
  let chain=bySide.get(c.side);if(!chain){const rest=c.points.map(p=>new THREE.Vector3(...p));chain={rest,p:rest.map(p=>p.clone()),prev:rest.map(p=>p.clone()),lengths:rest.slice(1).map((p,i)=>p.distanceTo(rest[i])),parts:[],radius:c.radius};bySide.set(c.side,chain);}
  const g=mesh.geometry;chain.parts.push({mesh,kind:c.kind,base:g.attributes.position.array.slice(),normal:g.attributes.normal.array.slice(),ts:g.attributes._orb_t?.array});
 }
 return {chains:[...bySide.values()],field,lastYaw:yaw,velocity:0,active:false,elapsed:0,THREE};
}
function height(field,x,y){
 if(!field||x<field.xmin||x>field.xmax||y<field.ymin||y>field.ymax)return -10;
 const u=(x-field.xmin)/(field.xmax-field.xmin)*(field.nx-1),v=(field.ymax-y)/(field.ymax-field.ymin)*(field.ny-1),i=Math.min(field.nx-2,Math.floor(u)),j=Math.min(field.ny-2,Math.floor(v)),a=u-i,b=v-j;
 const k=j*field.nx+i,z0=field.front[k],z1=field.front[k+1],z2=field.front[k+field.nx],z3=field.front[k+field.nx+1];
 if(Math.min(z0,z1,z2,z3)<-1)return -10;return (z0*(1-a)+z1*a)*(1-b)+(z2*(1-a)+z3*a)*b;
}
export function updateCordMotion(group,dt,o,THREE){
 if(!group)return false;let sys=systems.get(group);if(!sys){sys=makeSystem(group,THREE,o.yaw);systems.set(group,sys);}if(!sys.chains.length)return false;
 const delta=Math.atan2(Math.sin(o.yaw-sys.lastYaw),Math.cos(o.yaw-sys.lastYaw));sys.lastYaw=o.yaw;
 const velocity=Math.max(-7,Math.min(7,delta/Math.max(dt,.001))),alpha=Math.max(-25,Math.min(25,(velocity-sys.velocity)/Math.max(dt,.001)));sys.velocity=velocity;
 const V=new THREE.Vector3(),W=new THREE.Vector3(),T=new THREE.Vector3(),Q=new THREE.Quaternion(),M=new THREE.Vector3();
 if(!o.enabled){for(const c of sys.chains)for(let i=0;i<c.p.length;i++){c.p[i].copy(c.rest[i]);c.prev[i].copy(c.rest[i]);}sys.velocity=0;}
 else{
  const steps=Math.max(1,Math.ceil(Math.min(dt,.05)*120)),h=Math.min(dt,.05)/steps;
  for(let s=0;s<steps;s++)for(const c of sys.chains){
   const root=c.rest[0],disp=displacement(root,o,V).clone();c.p[0].copy(root).add(disp);c.prev[0].copy(c.p[0]);
   for(let i=1;i<c.p.length;i++){
    const p=c.p[i],prev=c.prev[i],x=p.x,y=p.y,z=p.z;W.copy(p).sub(prev).multiplyScalar(Math.exp(-3.3*h));prev.set(x,y,z);
    const dragX=-alpha*z*.8+velocity*velocity*x*.25,dragZ=alpha*x*.8+velocity*velocity*z*.25;
    p.add(W);p.x+=(dragX+7*(c.rest[i].x+disp.x-x))*h*h;p.y-=9.81*h*h;p.z+=(dragZ+7*(c.rest[i].z+disp.z-z))*h*h;
   }
   const collide=p=>{
    // The root exits through the hood; torso collision starts below the mount.
    if(p.y>root.y-.005)return;
    let z=height(sys.field,p.x,p.y);if(z<-1)return;
    T.set(p.x,p.y,z);displacement(T,o,V);z=height(sys.field,p.x-V.x,p.y-V.y);if(z<-1)return;
    const limit=z+V.z+c.radius+.00035;if(p.z<limit)p.z=limit;
   };
   for(let it=0;it<256;it++){
    c.p[0].copy(root).add(disp);
    for(let i=1;i<c.p.length;i++){W.copy(c.p[i]).sub(c.p[i-1]);const d=W.length();if(d<1e-8)continue;W.multiplyScalar((d-c.lengths[i-1])/d);if(i===1)c.p[i].sub(W);else{c.p[i-1].addScaledVector(W,.5);c.p[i].addScaledVector(W,-.5);}}
    for(let i=c.p.length-1;i>0;i--){W.copy(c.p[i]).sub(c.p[i-1]);const d=W.length();if(d<1e-8)continue;W.multiplyScalar((d-c.lengths[i-1])/d);if(i===1)c.p[i].sub(W);else{c.p[i-1].addScaledVector(W,.5);c.p[i].addScaledVector(W,-.5);}}
    for(let i=1;i<c.p.length;i++)collide(c.p[i]);
    // Check between nodes too, so a segment cannot cut through a convex fold.
    for(let i=1;i<c.p.length;i++){const mid=M.copy(c.p[i]).add(c.p[i-1]).multiplyScalar(.5),old=mid.z;collide(mid);const push=mid.z-old;if(push>0){c.p[i].z+=push;if(i>1)c.p[i-1].z+=push;}}
    const end=c.p.length-1,tip=M.copy(c.p[end]).sub(c.p[end-1]).normalize().multiplyScalar(.012).add(c.p[end]),oldTip=tip.z;collide(tip);if(tip.z>oldTip){const push=tip.z-oldTip;c.p[end].z+=push;c.p[end-1].z+=push;}
   }
  }
 }
 let activity=0;
 for(const c of sys.chains){
  const end=c.p.length-1,tipT=c.p[end].clone().sub(c.p[end-1]).normalize(),restT=c.rest[end].clone().sub(c.rest[end-1]).normalize();
  for(let i=1;i<c.p.length;i++)activity=Math.max(activity,c.p[i].distanceToSquared(c.prev[i]));
  const restCurve=new THREE.CatmullRomCurve3(c.rest),liveCurve=new THREE.CatmullRomCurve3(c.p);
  for(const part of c.parts){const g=part.mesh.geometry,pa=g.attributes.position,na=g.attributes.normal;
   if(!o.enabled){pa.array.set(part.base);na.array.set(part.normal);pa.needsUpdate=true;na.needsUpdate=true;continue;}
   if(part.kind==='tip'){
    Q.setFromUnitVectors(restT,tipT);
    for(let i=0;i<pa.count;i++){V.fromArray(part.base,i*3).sub(c.rest[end]).applyQuaternion(Q).add(c.p[end]);pa.setXYZ(i,V.x,V.y,V.z);V.fromArray(part.normal,i*3).applyQuaternion(Q);na.setXYZ(i,V.x,V.y,V.z);}
   }else{
    const frames=new Map();
    for(let i=0;i<pa.count;i++){
     const t=part.ts?.[i]??0;let frame=frames.get(t);
     if(!frame){const tc=Math.max(0,Math.min(1,t)),old=restCurve.getPoint(tc),now=liveCurve.getPoint(tc),ot=restCurve.getTangent(tc),nt=liveCurve.getTangent(tc);
      if(t>1){const extra=(t-1)*end*c.lengths[end-1];old.addScaledVector(restT,extra);now.addScaledVector(tipT,extra);ot.copy(restT);nt.copy(tipT);}
      frame={old,now,q:new THREE.Quaternion().setFromUnitVectors(ot,nt)};frames.set(t,frame);
     }
     V.fromArray(part.base,i*3).sub(frame.old).applyQuaternion(frame.q).add(frame.now);pa.setXYZ(i,V.x,V.y,V.z);V.fromArray(part.normal,i*3).applyQuaternion(frame.q);na.setXYZ(i,V.x,V.y,V.z);
    }
   }
   pa.needsUpdate=true;na.needsUpdate=true;
  }
 }
 sys.active=o.enabled&&(activity>1e-11||Math.abs(velocity)>.001||Math.abs(o.wind)>.00001);return sys.active;
}
export function cordMotionState(group){
 const s=systems.get(group);return s?{active:s.active,chains:s.chains.map(c=>({points:c.p.map(p=>p.toArray()),rest:c.rest.map(p=>p.toArray()),lengths:c.lengths,radius:c.radius,field:s.field}))}:null;
}
