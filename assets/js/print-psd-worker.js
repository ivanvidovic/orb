import {withPrintProfile} from './print-color-profile.js?v=86';
import {createPrintRenderer} from './print-psd-render.js?v=91-flow';
import {writePsdUint8Array,initializeCanvas} from '../vendor/ag-psd/writer.js?v=86';
initializeCanvas((w,h)=>new OffscreenCanvas(w,h));
const render=createPrintRenderer(()=>new OffscreenCanvas(1,1));let plan,pairs=[];
self.onmessage=({data})=>{
  try{
    if(data.type==='start'){plan=data.plan;pairs=[];self.postMessage({type:'ready'});}
    else if(data.type==='layer'){
      let result;try{result=render.layer(data.bitmap,data.desc,data.settings,data.color);}finally{data.bitmap.close();}
      pairs.push(result);self.postMessage({type:'layer',sourcePixels:result.sourcePixels,rasterScale:result.rasterScale});
    }else if(data.type==='finish'){
      const bytes=withPrintProfile(writePsdUint8Array(render.document(plan,pairs),{compress:true}));pairs=[];plan=null;self.postMessage({type:'done',bytes},[bytes.buffer]);
    }
  }catch(error){pairs=[];self.postMessage({type:'error',message:error.message||'Could not build the layered PSD.'});}
};
