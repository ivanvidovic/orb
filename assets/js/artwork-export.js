import {createArtworkTreatment} from './artwork-treatment.js?v=91-natural';
import {applyPrintTexture,hasPrintTexture,capturePrintTone,pixelateArtwork} from './print-texture.js?v=91-natural';
import {decodeArtworkImage} from './artwork-decode.js?v=45';
import {canvasBlob,cleanFilename} from './design-format.js?v=91-natural';
import {solidCoverageLut,applySolidMask} from './solid-mask.js?v=81';
export {solidCoverageLut} from './solid-mask.js?v=81';
const linear=v=>v<=.04045?v/12.92:((v+.055)/1.055)**2.4;
const srgb=v=>Math.round(255*Math.max(0,Math.min(1,v<=.0031308?v*12.92:1.055*v**(1/2.4)-.055)));
const sourceLinear=Array.from({length:256},(_,i)=>linear(i/255));
export function treatPixels(data,layer,color,width=data.length/4,height=1){
  if(layer.mode==='original')return;
  if(layer.mode==='ink')applySolidMask(data,width,height,layer);
  const ink=color.slice(1).match(/../g).map(v=>parseInt(v,16));
  const rgb=ink.map(v=>linear(v/255)),inkLight=rgb[0]*.2126+rgb[1]*.7152+rgb[2]*.0722,chroma=rgb.map(v=>v-inkLight),low=Math.min(...chroma),high=Math.max(...chroma);
  for(let i=0;i<data.length;i+=4){
    if(layer.mode==='ink'){
      data[i]=ink[0];data[i+1]=ink[1];data[i+2]=ink[2];
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
    const ctx=cv.getContext('2d',{willReadFrequently:true});if(!ctx)throw new Error('Could not allocate artwork canvas.');const source=pixelateArtwork(img,layer);ctx.drawImage(source,0,0,width,height);if(source!==img)source.width=source.height=1;
    if((layer.printRounding??0)>0){
      const result=createArtworkTreatment().render(cv,{...layer,fit:false,printPattern:layer.printPattern==='pixel'?'none':layer.printPattern},Math.max(width,height));
      const rgba=new Uint8ClampedArray(result.width*result.height*4);
      if(result.coverageOnly){const rgb=color.slice(1).match(/../g).map(v=>parseInt(v,16));for(let j=0;j<result.data.length;j++){rgba[j*4]=rgb[0];rgba[j*4+1]=rgb[1];rgba[j*4+2]=rgb[2];rgba[j*4+3]=result.data[j];}}
      else{rgba.set(result.data);if(layer.mode==='tint')treatPixels(rgba,layer,color,result.width,result.height);}
      const out=document.createElement('canvas');out.width=result.width;out.height=result.height;
      const oc=out.getContext('2d'),pixels=oc.createImageData(out.width,out.height);pixels.data.set(rgba);oc.putImageData(pixels,0,0);
      ctx.clearRect(0,0,width,height);ctx.drawImage(out,result.padding,result.padding,width,height,0,0,width,height);out.width=out.height=1;
      check();return {blob:await canvasBlob(cv),width,height};
    }
    const chunkHeight=layer.mode==='ink'?height:128;
    if(layer.mode!=='original'||hasPrintTexture(layer))for(let y=0;y<height;y+=chunkHeight){
      check();const pixels=ctx.getImageData(0,y,width,Math.min(chunkHeight,height-y));const sourceTone=capturePrintTone(pixels.data,layer);treatPixels(pixels.data,layer,color,width,pixels.height);applyPrintTexture(pixels.data,width,pixels.height,layer,{fullWidth:width,fullHeight:height,offsetY:y,sourceTone});ctx.putImageData(pixels,0,y);await turn();
    }
    check();return {blob:await canvasBlob(cv),width,height};
  }finally{cv.width=cv.height=1;}
}
export async function addArtworkPackage(zip,{doc,records},colorFor,{check=()=>{},message=()=>{},render=treatedPng,advance=()=>{}}={}){
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
    layers.push({layer:layer.name,placement:layer.slot,visible:layer.visible!==false,artwork:file,texturedArtwork:texturedFile,rounding:layer.printRounding??0,printTexture:textured?{pattern:layer.printPattern,size:layer.printSize??40,angle:layer.printAngle??45,strength:layer.printStrength??100,version:layer.printVersion??1,pixelScale:layer.printPixelScale??35,branchMode:layer.printBranchMode??'repeat',density:layer.printDensity??50,seed:layer.printSeed??1,markSize:layer.printMarkSize??50,toneResponse:layer.printTone??100,erosion:layer.printErosion??0}:null,original:originals.get(layer.assetId),width:result.width,height:result.height,mode:layer.mode==='ink'?'solid':layer.mode,color:layer.mode==='original'?null:color,solid:layer.mode==='ink'?{cutoff:layer.solidCutoff??12,softness:layer.solidSoftness??65,invert:!!layer.solidInvert,maskSource:layer.solidMaskSource??'brightness',spread:layer.solidSpread??0,edgeSoftness:layer.solidEdgeSoftness??0}:null,glow:!!layer.glow,uvReactive:!!layer.uvReactive,emission:layer.emission,previewPlacement:layer.placement});advance();
  }
  zip.file('Artwork-reference.json',JSON.stringify({design:doc.name,garment:doc.garmentId,layers},null,2));
  zip.file('Artwork-README.txt','Artwork contains one smooth treated PNG per layer, including hidden layers (identified in Artwork-reference.json). Artwork-textured contains an additional patterned PNG for each layer with print texture enabled. Originals contains each used source file once, with unchanged bytes. Filenames link through the reference file.\n\nTreated PNGs use the original raster dimensions, or SVG intrinsic raster dimensions. Source margins are retained. Garment placement, scale, rotation, fit-to-artwork, lighting, gloss, glow and UV illumination are not baked in. Glow and UV intent are recorded in the reference. Print patterns are visual styling. Size is relative to the source image, not a physical screen frequency. No physical print dimensions or screen separations are assigned. Consult the mockups for placement and appearance.\n\nSolid applies the selected color with Brightness or Alpha coverage. Auto selects Alpha for single-color sources. Spread and Edge softness modify coverage within source image bounds. Tint retains dark shading. Original retains source colors and alpha. Animated sources are flattened to a frame; untouched originals remain available.\n');
  return layers.length;
}
