import {applyPrintTexture,hasPrintTexture,capturePrintTone} from './print-texture.js?v=68';
import {decodeArtworkImage} from './artwork-decode.js?v=45';
import {canvasBlob,cleanFilename} from './design-format.js?v=68';
export function solidCoverageLut(settings={}){
  const cutoff=(settings.solidCutoff??12)/100,width=Math.max(.0001,(1-cutoff)*(settings.solidSoftness??65)/100),lut=new Float32Array(256);
  for(let i=0;i<256;i++){const level=settings.solidInvert?1-i/255:i/255,t=Math.max(0,Math.min(1,(level-cutoff)/width));lut[i]=t*t*(3-2*t);}
  return lut;
}
const linear=v=>v<=.04045?v/12.92:((v+.055)/1.055)**2.4;
const srgb=v=>Math.round(255*Math.max(0,Math.min(1,v<=.0031308?v*12.92:1.055*v**(1/2.4)-.055)));
const sourceLinear=Array.from({length:256},(_,i)=>linear(i/255));
export function treatPixels(data,layer,color){
  if(layer.mode==='original')return;
  const ink=color.slice(1).match(/../g).map(v=>parseInt(v,16)),lut=solidCoverageLut(layer);
  const rgb=ink.map(v=>linear(v/255)),inkLight=rgb[0]*.2126+rgb[1]*.7152+rgb[2]*.0722,chroma=rgb.map(v=>v-inkLight),low=Math.min(...chroma),high=Math.max(...chroma);
  for(let i=0;i<data.length;i+=4){
    if(layer.mode==='ink'){
      const level=Math.round(data[i]*.299+data[i+1]*.587+data[i+2]*.114);
      data[i+3]=Math.round(data[i+3]*lut[level]);data[i]=ink[0];data[i+1]=ink[1];data[i+2]=ink[2];
    }else{
      const light=sourceLinear[data[i]]*.2126+sourceLinear[data[i+1]]*.7152+sourceLinear[data[i+2]]*.0722;
      let strength=1;if(low<-.00001)strength=Math.min(strength,light/-low);if(high>.00001)strength=Math.min(strength,(1-light)/high);
      for(let c=0;c<3;c++)data[i+c]=srgb(light+chroma[c]*strength);
    }
  }
}
const turn=()=>new Promise(resolve=>requestAnimationFrame(resolve));
export async function treatedPng(blob,layer,color,check=()=>{}){
  const img=await decodeArtworkImage(blob),width=img.naturalWidth||img.width,height=img.naturalHeight||img.height;
  if(!width||!height||width>16384||height>16384||width*height>32000000)throw new Error('Artwork is too large for a full-resolution PNG on this device. Export without artwork or use a smaller source.');
  const cv=document.createElement('canvas');cv.width=width;cv.height=height;
  try{
    const ctx=cv.getContext('2d',{willReadFrequently:true});if(!ctx)throw new Error('Could not allocate artwork canvas.');ctx.drawImage(img,0,0,width,height);
    if(layer.mode!=='original'||hasPrintTexture(layer))for(let y=0;y<height;y+=128){
      check();const pixels=ctx.getImageData(0,y,width,Math.min(128,height-y));const sourceTone=capturePrintTone(pixels.data,layer);treatPixels(pixels.data,layer,color);applyPrintTexture(pixels.data,width,pixels.height,layer,{fullWidth:width,fullHeight:height,offsetY:y,sourceTone});ctx.putImageData(pixels,0,y);await turn();
    }
    check();return {blob:await canvasBlob(cv),width,height};
  }finally{cv.width=cv.height=1;}
}
export async function addArtworkPackage(zip,{doc,records},colorFor,{check=()=>{},message=()=>{},render=treatedPng}={}){
  const originals=new Map(),layers=[];
  for(const [i,record] of records.entries()){
    check();const asset=doc.assets.find(a=>a.id===record.id),ext=asset.path.split('.').pop();
    const name=cleanFilename(record.name.replace(/\.[^.]+$/,'')),path=`Originals/${String(i+1).padStart(3,'0')}_${name}.${ext}`;
    zip.file(path,await record.blob.arrayBuffer());originals.set(record.id,path);
  }
  for(const [i,layer] of doc.layers.entries()){
    check();message(`Preparing artwork · ${i+1} of ${doc.layers.length}`);await turn();
    const color=colorFor(layer),record=records.find(r=>r.id===layer.assetId);
    const file=`Artwork/${String(i+1).padStart(3,'0')}_${cleanFilename(layer.slot)}_${cleanFilename(layer.name)}.png`;
    const textured=hasPrintTexture(layer);
    const result=await render(record.blob,{...layer,printPattern:'none'},color,check);check();zip.file(file,await result.blob.arrayBuffer());
    let texturedFile=null;
    if(textured){texturedFile=file.replace('Artwork/','Artwork-textured/');const treatment=await render(record.blob,layer,color,check);check();zip.file(texturedFile,await treatment.blob.arrayBuffer());}
    layers.push({layer:layer.name,placement:layer.slot,visible:layer.visible!==false,artwork:file,texturedArtwork:texturedFile,printTexture:textured?{pattern:layer.printPattern,size:layer.printSize??40,angle:layer.printAngle??45,strength:layer.printStrength??100,version:layer.printVersion??1,markSize:layer.printMarkSize??50,toneResponse:layer.printTone??100,erosion:layer.printErosion??0}:null,original:originals.get(layer.assetId),width:result.width,height:result.height,mode:layer.mode==='ink'?'solid':layer.mode,color:layer.mode==='original'?null:color,solid:layer.mode==='ink'?{cutoff:layer.solidCutoff??12,softness:layer.solidSoftness??65,invert:!!layer.solidInvert}:null,glow:!!layer.glow,uvReactive:!!layer.uvReactive,emission:layer.emission,previewPlacement:layer.placement});
  }
  zip.file('Artwork-reference.json',JSON.stringify({design:doc.name,garment:doc.garmentId,layers},null,2));
  zip.file('Artwork-README.txt','Artwork contains one smooth treated PNG per layer, including hidden layers (identified in Artwork-reference.json). Artwork-textured contains an additional patterned PNG for each layer with print texture enabled. Originals contains each used source file once, with unchanged bytes. Filenames link through the reference file.\n\nTreated PNGs use the original raster dimensions, or SVG intrinsic raster dimensions. Source margins are retained. Garment placement, scale, rotation, fit-to-artwork, lighting, gloss, glow and UV illumination are not baked in. Glow and UV intent are recorded in the reference. Print patterns are visual styling. Size is relative to the source image, not a physical screen frequency. No physical print dimensions or screen separations are assigned. Consult the mockups for placement and appearance.\n\nSolid applies the selected color and brightness mask, multiplied by source alpha. Tint retains dark shading. Original retains source colors and alpha. Animated sources are flattened to a frame; untouched originals remain available.\n');
  return layers.length;
}
