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
