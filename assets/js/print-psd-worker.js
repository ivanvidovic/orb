import {withPrintProfile} from './print-color-profile.js?v=0.9.64';
import {createPrintRenderer} from './print-psd-render.js?v=0.9.64';
import {writePsdUint8Array,initializeCanvas} from '../vendor/ag-psd/writer.js?v=86';
initializeCanvas((w,h)=>new OffscreenCanvas(w,h));
const render=createPrintRenderer(()=>new OffscreenCanvas(1,1));let plan,pairs=[],retainedPixels=0;
self.onmessage=({data})=>{
  try{
    if(data.type==='start'){plan=data.plan;pairs=[];retainedPixels=plan.width*plan.height*2;self.postMessage({type:'ready'});}
    else if(data.type==='layer'){
      let result;try{result=render.layer(data.bitmap,data.desc,data.settings,data.color);}finally{data.bitmap.close();}
      const occupied=[result.treated,result.untreated].reduce((sum,l)=>sum+l.imageData.width*l.imageData.height,0);
      if(retainedPixels+occupied>180000000)throw new Error('The cropped artwork layers exceed the export memory budget. Export fewer layers or separate print layouts.');
      retainedPixels+=occupied;
      pairs.push(result);self.postMessage({type:'layer',sourcePixels:result.sourcePixels,rasterScale:result.rasterScale});
    }else if(data.type==='finish'){
      const bytes=withPrintProfile(writePsdUint8Array(render.document(plan,pairs),{compress:true}));pairs=[];plan=null;self.postMessage({type:'done',bytes},[bytes.buffer]);
    }
  }catch(error){pairs=[];self.postMessage({type:'error',message:error.message||'Could not build the layered PSD.'});}
};
