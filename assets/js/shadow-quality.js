// Offsets follow world-space texel size instead of a single sub-texel value.
// Keep double-sided cloth shadows and existing PCF filtering.
export function configureGarmentShadow(light,{span,mobile=false}={}){
  const texel=span/light.shadow.mapSize.x;
  light.shadow.bias=light.isSpotLight?-.00025:-.0002;
  light.shadow.normalBias=Math.min(.004,Math.max(.0018,texel*(mobile?2:1.5)));
}
