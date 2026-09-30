// Memory policy is stable across rotation and narrow desktop windows.
export const MOBILE_MEMORY=navigator.userAgentData?.mobile===true||/Android|iPhone|iPad|iPod/i.test(navigator.userAgent)||(navigator.platform==='MacIntel'&&navigator.maxTouchPoints>1);
export const RENDER_BUDGET=Object.freeze({
 pixelRatio:MOBILE_MEMORY?1.5:2,
 artworkSide:MOBILE_MEMORY?2048:8192,
 artworkTile:MOBILE_MEMORY?1024:4096,
 sourceSide:MOBILE_MEMORY?2048:4096,
 cacheCount:MOBILE_MEMORY?1:4,
 cacheBytes:(MOBILE_MEMORY?0:((navigator.deviceMemory||8)>=8?2048:1024))*1024*1024,
 presentPixels:MOBILE_MEMORY?1000000:Infinity,
 presentSamples:MOBILE_MEMORY?0:2
});
export function artworkAtlasSize(count,maxTextureSize){
 const cols=Math.ceil(Math.sqrt(count||1)),rows=Math.ceil((count||1)/cols);
 const limit=Math.min(RENDER_BUDGET.artworkSide,maxTextureSize);
 // Power-of-two tiles keep mip levels aligned between artwork panels.
 const tile=2**Math.floor(Math.log2(Math.min(RENDER_BUDGET.artworkTile,Math.floor(limit/Math.max(cols,rows)))));
 return {cols,rows,tile,width:cols*tile,height:rows*tile};
}
