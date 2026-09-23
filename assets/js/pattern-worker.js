import {renderPatternRaster} from './pattern-raster.js?v=79';
self.onmessage=async ({data:{bitmap,layer,limit}})=>{
 try{
  const canvas=()=>new OffscreenCanvas(1,1),source=canvas();source.width=bitmap.width;source.height=bitmap.height;source.getContext('2d').drawImage(bitmap,0,0);bitmap.close();
  const raster=renderPatternRaster(source,layer,limit,canvas),result=await createImageBitmap(raster,{premultiplyAlpha:'none',imageOrientation:'none',colorSpaceConversion:'none'});self.postMessage({bitmap:result},[result]);
 }catch(error){bitmap.close();self.postMessage({error:error.message});}
};
