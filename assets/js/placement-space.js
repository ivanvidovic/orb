// Artwork adjustments live in a garment-independent placement reference space.
export const PLACEMENT_SPACE='relative-v1';
export function placementOffsets(layer,profile){
  const [sx,sy]=layer.anchor?[1,1]:(profile.offsetScale||[1,1]);
  return [layer.placement.x*sx,layer.placement.y*sy];
}
export function migratePlacement(layer,profile){
  if(layer.placementSpace===PLACEMENT_SPACE)return false;
  if(layer.anchor){layer.placementSpace=PLACEMENT_SPACE;return false;}
  if(!profile)return false; // A hoodie-only layer can stay dormant on a tee.
  const old=profile.legacy;
  if(!old){layer.placementSpace=PLACEMENT_SPACE;return false;}
  const A=layer.placement,[a,b,c,d]=profile.basis,[oa,ob,oc,od]=old.basis;
  const u=old.origin[0]+oa*A.x-ob*A.y-profile.origin[0],v=old.origin[1]+oc*A.x-od*A.y-profile.origin[1],det=a*d-b*c;
  if(Math.abs(det)<1e-8)throw new Error('Invalid placement calibration.');
  const [sx,sy]=profile.offsetScale||[1,1];
  const oldSize=old.printLength||old.printScale||1,newSize=profile.printLength||profile.printScale||1;
  // Authored bases are unchanged rotations. Keep the old quad exactly while
  // expressing its center and size in the new proportional reference frame.
  layer.placement={x:(d*u-b*v)/det/sx,y:-(-c*u+a*v)/det/sy,scale:A.scale*oldSize/newSize,rot:A.rot};
  layer.placementSpace=PLACEMENT_SPACE;return true;
}
