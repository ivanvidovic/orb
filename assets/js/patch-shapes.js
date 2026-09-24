// Portable normalized outlines, shared by the preview, project files and export.
export function patchContours(p){
 if(p.shape==='custom')return p.outline.contours;
 const loop=[];
 if(p.shape==='oval'){for(let i=0;i<160;i++){const a=i/160*Math.PI*2;loop.push([.5+.5*Math.cos(a),.5+.5*Math.sin(a)]);}return [loop];}
 if(p.shape==='shield')return [[[.04,0],[.96,0],[1,.06],[1,.55],[.94,.72],[.76,.87],[.5,1],[.24,.87],[.06,.72],[0,.55],[0,.06]]];
 const rx=Math.min(.5,p.corner/p.width),ry=Math.min(.5,p.corner/p.height);
 for(const [cx,cy,start] of [[1-rx,ry,-Math.PI/2],[1-rx,1-ry,0],[rx,1-ry,Math.PI/2],[rx,ry,Math.PI]])for(let i=0;i<=20;i++){const a=start+i/20*Math.PI/2;loop.push([cx+rx*Math.cos(a),cy+ry*Math.sin(a)]);}
 return [loop.filter((v,i,a)=>i===0||Math.hypot(v[0]-a[i-1][0],v[1]-a[i-1][1])>1e-8)];
}
export function patchMatrix(p,q){return [p.width/1000,0,0,p.height/1000,q.origin[0]+p.x/1000-p.width/2000,q.origin[1]+p.y/1000-p.height/2000];}
export function outlinePath(contours){return contours.map(loop=>'M'+loop.map(p=>p.map(v=>Number(v.toFixed(7))).join(',')).join('L')+'Z').join('');}
export function patchSVG(contours,width,height){return `<svg xmlns="http://www.w3.org/2000/svg" width="${width.toFixed(4)}mm" height="${height.toFixed(4)}mm" viewBox="0 0 ${width} ${height}"><title>Patch cut outline</title><path transform="scale(${width} ${height})" d="${outlinePath(contours)}" fill="none" stroke="#000" stroke-width="0.1" vector-effect="non-scaling-stroke" fill-rule="evenodd"/></svg>`;}
