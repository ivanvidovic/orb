// One similarity transform per body surface. Named placements are insertion
// points in the reference canvas, never independent seam-following transforms.
export function mapSurfacePoint(referenceOrigin,mapping,point){
  return point.map((v,i)=>mapping.origin[i]+(v-referenceOrigin[i])*mapping.scale);
}

export function sharedSurfaceProfiles(profiles,calibration,garmentId){
  const result={...profiles};
  for(const surface of Object.values(calibration.surfaces)){
    const mapping=surface.garments[garmentId];
    if(!mapping)continue;
    if(!(mapping.scale>0&&Number.isFinite(mapping.scale)))throw new Error('Invalid surface calibration.');
    for(const [slot,reference] of Object.entries(surface.placements)){
      const native=profiles[slot];if(!native)continue; // Hoodie-only placements stay dormant on tees.
      const camera=mapping.cameras[slot];
      if(!camera)throw new Error('Missing surface camera calibration.');
      result[slot]={...native,...camera,
        origin:mapSurfacePoint(surface.origin,mapping,reference.origin),
        basis:[...reference.basis],
        printScale:reference.printScale*mapping.scale,
        offsetScale:reference.offsetScale.map(v=>v*mapping.scale)
      };
      delete result[slot].hemReference;
    }
  }
  return result;
}

// Return one uniform, undoable edit for a whole surface. Visible artwork sets
// the bounds; hidden layers receive the same transform to retain registration.
export function fitSurfacePlacements(layers,profiles,bounds,layerBounds){
  const visible=layers.filter(l=>l.visible!==false);if(!visible.length)return [];
  const boxes=visible.map(layerBounds);
  const lo=[Math.min(...boxes.map(b=>b.minU)),Math.min(...boxes.map(b=>b.minV))];
  const hi=[Math.max(...boxes.map(b=>b.maxU)),Math.max(...boxes.map(b=>b.maxV))];
  const size=hi.map((v,i)=>v-lo[i]),center=hi.map((v,i)=>(v+lo[i])/2);
  const min=[bounds.minU,bounds.minV],max=[bounds.maxU,bounds.maxV];
  const scale=Math.min(1,...size.map((v,i)=>(max[i]-min[i])/Math.max(v,1e-12)));
  const target=center.map((v,i)=>Math.max(min[i]+size[i]*scale/2,Math.min(max[i]-size[i]*scale/2,v)));
  if(Math.abs(scale-1)<1e-10&&target.every((v,i)=>Math.abs(v-center[i])<1e-10))return [];
  return layers.map(layer=>{
    const q=profiles[layer.slot],A=layer.placement,[sx,sy]=q.offsetScale||[1,1],[a,b,c,d]=q.basis,det=a*d-b*c;
    const point=[q.origin[0]+a*A.x*sx-b*A.y*sy,q.origin[1]+c*A.x*sx-d*A.y*sy];
    const [u,v]=point.map((p,i)=>target[i]+(p-center[i])*scale-q.origin[i]);
    return {layer,placement:{x:(d*u-b*v)/det/sx,y:(c*u-a*v)/det/sy,scale:A.scale*scale,rot:A.rot}};
  });
}
