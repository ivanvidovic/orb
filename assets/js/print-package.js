import {decodeArtworkImage} from './artwork-decode.js?v=86';
import {cleanFilename} from './design-format.js?v=91-flow';
export function psdSupported(){return typeof Worker!=='undefined'&&typeof OffscreenCanvas!=='undefined'&&typeof createImageBitmap==='function';}
export function workerRequest(worker,payload,transfer,check){
  return new Promise((resolve,reject)=>{
    let timer;const clear=()=>{clearInterval(timer);worker.removeEventListener('message',message);worker.removeEventListener('error',error);worker.removeEventListener('messageerror',error);};
    const fail=e=>{clear();reject(e instanceof Error?e:new Error('The PSD export worker could not finish. Try a smaller print size.'));};
    const error=()=>fail(new Error('The PSD export worker could not finish. Try a smaller print size.'));
    const message=e=>{clear();if(e.data.type==='error')reject(new Error(e.data.message));else resolve(e.data);};
    worker.addEventListener('message',message);worker.addEventListener('error',error);worker.addEventListener('messageerror',error);
    timer=setInterval(()=>{try{check();}catch(e){fail(e);}},100);
    try{check();worker.postMessage(payload,transfer||[]);}catch(e){fail(e);}
  });
}
export async function addPrintLayouts(zip,data,plans,colorFor,{check=()=>{},message=()=>{},advance=()=>{}}={}){
  if(!psdSupported())throw new Error('Layered PSD export needs a browser with OffscreenCanvas support. Use a current desktop Chrome, Edge, Firefox or Safari, or turn off layered PSDs.');
  const {doc,records}=data,reference={design:doc.name,garment:doc.garmentId,ppi:300,units:'inches',surfaces:[],omittedLayers:doc.layers.filter(l=>!plans.some(p=>p.layers.some(d=>d.id===l.id))).map(l=>({id:l.id,name:l.name,placement:l.slot}))};
  const exported=new Set();
  for(const [index,plan] of plans.entries()){
    check();const worker=new Worker(new URL('./print-psd-worker.js?v=91-flow',import.meta.url),{type:'module'}),layers=[];
    try{
      await workerRequest(worker,{type:'start',plan},[],check);
      for(const [i,desc] of plan.layers.entries()){
        check();message(`${plan.name} PSD · layer ${i+1} of ${plan.layers.length} · layout ${index+1} of ${plans.length}`);
        const layer=doc.layers.find(l=>l.id===desc.id),record=records.find(r=>r.id===layer?.assetId);
        if(!layer||!record)throw new Error('A print layer is missing its original artwork. Reopen the design and try again.');
        // Decode SVGs for the requested print size, independently of the 3D preview texture.
        const m=desc.matrix,edge=Math.ceil(Math.max(Math.hypot(m[0],m[1])/desc.crop[2],Math.hypot(m[2],m[3])/desc.crop[3]));
        const img=await decodeArtworkImage(record.blob,{longEdge:Math.max(4096,edge),maxEdge:12000});check();
        const bitmap=await createImageBitmap(img);let response;
        try{response=await workerRequest(worker,{type:'layer',bitmap,desc,settings:layer,color:colorFor(layer)},[bitmap],check);}catch(e){bitmap.close();throw e;}
        layers.push({id:layer.id,name:layer.name,placement:layer.slot,visible:layer.visible!==false,assetId:layer.assetId,mode:layer.mode,printPattern:layer.printPattern||'none',glow:!!layer.glow,uvReactive:!!layer.uvReactive,emission:layer.emission,matrixPixels:desc.matrix,sourcePixels:response.sourcePixels,rasterScale:response.rasterScale});exported.add(layer.id);advance();
      }
      message(`${plan.name} PSD · writing layers…`);const result=await workerRequest(worker,{type:'finish'},[],check);check();
      const path=`Layouts/${String(index+1).padStart(2,'0')}_${cleanFilename(plan.name)}.psd`;zip.file(path,result.bytes);advance();
      reference.surfaces.push({file:path,surface:plan.name,canvasInches:{width:plan.inches.width,height:plan.inches.height},artworkInches:{width:plan.inches.artWidth,height:plan.inches.artHeight},pixels:{width:plan.width,height:plan.height},layers});
    }finally{worker.terminate();}
  }
  zip.file('Layouts/Layout-reference.json',JSON.stringify(reference,null,2));
  zip.file('Layouts/README.txt',`LAYERED PRINT LAYOUTS\n\nEach PSD is one flat print surface, in sRGB (embedded profile) at 300 pixels per inch. Open Image Size in Photoshop to check the chosen inch dimensions. The canvas is the artwork document, not the screen frame. Allow screen and press margins separately with your printer.\n\nTreated artwork: named, editable pixel layers with the studio's colors, Solid/Tint treatment and print textures. Layer order, rotation, relative position and hidden state are preserved. Untreated artwork: a hidden, aligned backup group using source colors and alpha. Enable this group only after hiding Treated artwork. Background preview: a hidden gray layer to help inspect white or transparent art; leave it hidden for print. Original files, including SVGs, are in Originals when Include artwork + originals is selected. Pixel layers are not editable vector paths or Photoshop adjustment layers.\n\nLayouts use the selected garment's calibrated flat print charts, centered on the visible composition. They do not bake in fabric folds, lighting, shadows, gloss or glow/UV illumination. Glow and UV intent are recorded in Layout-reference.json. Artwork beyond a panel edge is retained in the flat file; check the mockups for seams, hood occlusion and garment boundaries. Inside tags, sleeves and hood surfaces are separate layouts. All-hidden, unavailable and deselected surfaces are omitted; their layers are listed in the reference.\n\nPrint sizes are chosen in the export dialog, not measured from a real garment. Confirm print size and placement on the actual blank. Increasing canvas dimensions adds space; it does not resize the artwork. Artwork width scales the entire composition proportionally. Larger source images or vectors give better results; a 300 PPI document cannot recover detail missing from a small raster source. Raster upscaling factors are recorded in the reference.\n\nPrint textures are visual effects, not calibrated halftone frequencies. These RGB PSDs are a production starting point, not press-ready spot-color separations. Screen mesh, ink separations, underbase, trapping and halftone settings remain the printer's decisions.\n`);
  return reference.surfaces.length;
}
