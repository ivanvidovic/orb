import {createArtworkTreatment} from './artwork-treatment.js?v=91-flow';
const canvas=()=>new OffscreenCanvas(1,1),engine=createArtworkTreatment(canvas);
let source=null;
self.onmessage=event=>{
  const {id,bitmap,settings,limit}=event.data;
  try{
    if(bitmap){
      engine.clear();if(source)source.width=source.height=1;
      source=canvas();source.width=bitmap.width;source.height=bitmap.height;
      source.getContext('2d',{willReadFrequently:true}).drawImage(bitmap,0,0);bitmap.close();
    }
    if(!source)throw new Error('Artwork source is missing.');
    const result=engine.render(source,settings,limit);
    self.postMessage({id,result},[result.data.buffer]);
  }catch(error){bitmap?.close();self.postMessage({id,error:error.message||'Artwork could not be processed.'});}
};
