// v0.9.13: display alignment only; source meshes and UVs remain authored assets.
// The normalized garment center is halfway between hem -0.024 and top 0.716.
const ALIGNMENT={
 'mens-crewneck':{scale:1.085,center:[0,.346,0],offset:[0,-.006,0]},
 'womens-tee':{scale:.9,center:[0,.346,0],offset:[0,.027,0]},
 'womens-crewneck':{scale:.94,center:[0,.346,0],offset:[-.004,-.031,0]}
};
export function garmentPresentation(id){return ALIGNMENT[id]||null;}
export function presentationPoint(id,point){
 const a=ALIGNMENT[id];return a?point.map((v,i)=>a.center[i]+(v-a.center[i])*a.scale+a.offset[i]):[...point];
}
