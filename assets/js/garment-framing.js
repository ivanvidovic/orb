// Fixed proportions from Ivan's sizing sheet. Models retain their native geometry.
// Camera transforms match a common back-view baseline; the hood is extra visible height.
const FRAMES={"mens-tee":{"scale":1,"center":[0,0.026000000000000023,0]},"womens-tee":{"scale":0.9580303974400939,"center":[0,0.03776334886213303,0]},"mens-hoodie":{"scale":1.1787769939826684,"center":[0,0.01378148369126463,0]},"womens-hoodie":{"scale":1.0316779763631354,"center":[0,0.01247881490170094,0]}};
const ENVELOPE=[[-0.33318728230415706,-0.45710784141384536,-0.18763752918581053],[-0.33318728230415706,-0.45710784141384536,0.18763759944639452],[-0.33318728230415706,0.41518703778850347,-0.18763752918581053],[-0.33318728230415706,0.41518703778850347,0.18763759944639452],[0.33318728230415706,-0.45710784141384536,-0.18763752918581053],[0.33318728230415706,-0.45710784141384536,0.18763759944639452],[0.33318728230415706,0.41518703778850347,-0.18763752918581053],[0.33318728230415706,0.41518703778850347,0.18763759944639452]];
const PREVIOUS={"mens-tee":{"width":0.4670504704117775,"center":[0,-0.041032571783289284,0]},"womens-tee":{"width":0.44543421268463135,"center":[0,-0.03199043315276501,0]},"mens-hoodie":{"width":0.4303642436861992,"center":[0,-0.024284198611974728,0]},"womens-hoodie":{"width":0.3999864086508751,"center":[0,-0.026110355582088185,0]}};
export function torsoFrame(id){
 const f=FRAMES[id];if(!f)return null;
 return {center:[...f.center],scale:f.scale,points:ENVELOPE.map(p=>p.map((v,i)=>f.center[i]+v/f.scale))};
}
export function torsoDistance(id){return FRAMES[id]?1.85/FRAMES[id].scale:1.55;}
// Only used to migrate saved v83 full-view cameras once.
export function previousTorsoFrame(id){const f=PREVIOUS[id];return f?{center:[...f.center],distance:1.64*f.width/PREVIOUS['mens-tee'].width}:null;}

// The front reference fills about 88% of the viewport. Angled silhouettes need
// extra cuff clearance; these factors are identical across all four garments.
const PREVIEW_DISTANCES={front:1.62,back:1.62,angle:1.76,backangle:1.76,side:1.85};
export function previewDistance(id,view){return FRAMES[id]?(PREVIEW_DISTANCES[view]??1.85)/FRAMES[id].scale:torsoDistance(id);}

// Previous presentation only, for one-time saved-camera migration.
const PREVIEW_V3={"mens-tee":{"scale":1,"center":[0,0.026000000000000023,0]},"womens-tee":{"scale":0.9580303974400939,"center":[0,0.06496390504638419,0]},"mens-hoodie":{"scale":1.1787769939826684,"center":[0,0.01378148369126463,0]},"womens-hoodie":{"scale":1.00162910326518,"center":[0,0.01247881490170094,0]}};
export function previousPreviewFrame(id){const f=PREVIEW_V3[id];return f?{center:[...f.center],scale:f.scale}:null;}
