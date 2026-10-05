// v0.9.15: display alignment only; source meshes and UVs remain authored assets.
// The normalized garment center is halfway between hem -0.024 and top 0.716.
const ALIGNMENT={
 'mens-tee':{scale:.97,center:[0.0011338309850543737,0.6656590700149536,-0.007651563733816147],offset:[0,0,0]},
 'mens-tee':{scale:.97,center:[0.0011338309850543737,0.6656590700149536,-0.007651563733816147],offset:[0,0,0]},
 'mens-crewneck':{scale:1.05245,center:[0,.346,0],offset:[0,-.0180435,0]},
 'womens-tee':{scale:.9,center:[0,.346,0],offset:[0,.027,0]},
 'womens-crewneck':{scale:.94,center:[0,.346,0],offset:[-.004,-.031,0]}
};
export function garmentPresentation(id){return ALIGNMENT[id]||null;}
export function presentationPoint(id,point){
 const a=ALIGNMENT[id];return a?point.map((v,i)=>a.center[i]+(v-a.center[i])*a.scale+a.offset[i]):[...point];
}
