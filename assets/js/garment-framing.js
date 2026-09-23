// Torso dimensions measured from the production body panels.
const FRAMES={"mens-tee":{"width":0.4670504704117775,"center":[0,-0.041032571783289284,0]},"womens-tee":{"width":0.44543421268463135,"center":[0,-0.03199043315276501,0]},"mens-hoodie":{"width":0.4303642436861992,"center":[0,-0.024284198611974728,0]},"womens-hoodie":{"width":0.3999864086508751,"center":[0,-0.026110355582088185,0]}};
// One normalized envelope contains every garment, including hood and sleeves.
// Sharing it keeps torso sizes comparable while avoiding export crops.
const ENVELOPE=[[-0.6928748626694918,-0.8697535107071369,-0.38688785882353904],[-0.6928748626694918,-0.8697535107071369,0.3868880078402143],[-0.6928748626694918,0.9803091005116915,-0.38688785882353904],[-0.6928748626694918,0.9803091005116915,0.3868880078402143],[0.6928748626694918,-0.8697535107071369,-0.38688785882353904],[0.6928748626694918,-0.8697535107071369,0.3868880078402143],[0.6928748626694918,0.9803091005116915,-0.38688785882353904],[0.6928748626694918,0.9803091005116915,0.3868880078402143]];
export function torsoFrame(id){
 const f=FRAMES[id];if(!f)return null;
 return {center:[...f.center],width:f.width,points:ENVELOPE.map(p=>p.map((v,i)=>f.center[i]+v*f.width))};
}
export function torsoDistance(id){return FRAMES[id]?1.64*FRAMES[id].width/FRAMES['mens-tee'].width:1.55;}
