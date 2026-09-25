import {installExportSummary} from './export-summary.js?v=91';
import {createExportProgress} from './export-progress.js?v=87';
import {installPrintLayoutUI} from './print-layout-ui.js?v=91-history13';
import {addPrintLayouts} from './print-package.js?v=91-history13';
import {addArtworkPackage} from './artwork-export.js?v=91-history13';
import {canvasBlob,downloadBlob,cleanFilename} from './design-format.js?v=91-history13';
const $=id=>document.getElementById(id);
const VIEW_NAMES={front:'Front',angle:'Front three-quarter',side:'Left side',right:'Right side',backangle:'Back three-quarter',back:'Back',detail:'Detail'};
const turn=()=>new Promise(resolve=>requestAnimationFrame(resolve));
export function fitDistance(THREE,points,center,angles,aspect,fov,padding=1.20){
  const tanY=Math.tan(fov*Math.PI/360),tanX=tanY*aspect;
  let result=.1;
  for(const [az,el] of angles){
    const direction=new THREE.Vector3(Math.sin(el)*Math.sin(az),Math.cos(el),Math.sin(el)*Math.cos(az));
    const right=new THREE.Vector3().crossVectors(new THREE.Vector3(0,1,0),direction).normalize(),up=new THREE.Vector3().crossVectors(direction,right).normalize();
    for(const p of points){const v=p.clone().sub(center),z=v.dot(direction);result=Math.max(result,z+Math.abs(v.dot(right))*padding/tanX,z+Math.abs(v.dot(up))*padding/tanY);}
  }
  return result;
}
export function installExports(api){
  const {THREE,renderer,camera,scene,garment,presentGarment,presentShadow,shirtShadow,uni,state}=api;
  const detailOptions=api.detailViews||[],detailLabels=new Map(detailOptions.map(v=>[v.id,v.label]));
  const viewLabel=view=>detailLabels.get(view)||VIEW_NAMES[view];
  for(const view of detailOptions){const label=document.createElement('label'),input=document.createElement('input');input.type='checkbox';input.name='exportView';input.value=view.id;input.dataset.detailExport='true';label.append(input,document.createTextNode(view.label));$('exportPlacementViews').append(label);}
  function syncDetailExports(){const inputs=Array.from(document.querySelectorAll('[data-detail-export]'));for(const input of inputs){input.disabled=!api.detailView(input.value);input.closest('label').hidden=input.disabled;if(input.disabled)input.checked=false;}$('exportCloseups').hidden=!inputs.some(input=>!input.disabled);syncCloseupCount();}
  function syncCloseupCount(){$('exportCloseupCount').textContent=$('exportPlacementViews').querySelectorAll('input:checked').length+' selected';}
  $('exportPlacementViews').addEventListener('change',syncCloseupCount);
  let working=false,cancelled=false,preparing=false;
  const printUI=installPrintLayoutUI({toggle:$('exportPsd'),container:$('exportPrintLayouts'),status:$('exportPrintNote')});
  const progress=createExportProgress($('exportProgress'));
  const summary=installExportSummary({dialog:$('exportDialog'),working:()=>working});
  const choice=id=>$(id).querySelector('input:checked').value;
  const message=text=>{$('exportStatus').textContent=text;};
  const check=()=>{if(cancelled)throw new Error('Export cancelled.');};
  function captureSession(width,height){
    api.finish();api.draw();api.pause(true);
    const saved={camera:camera.clone(),size:renderer.getSize(new THREE.Vector2()),ratio:renderer.getPixelRatio(),wind:uni.uWind.value,twist:uni.uTwist.value,
      garmentPosition:garment.position.clone(),garmentRotation:garment.rotation.clone(),presentVisible:presentGarment.visible,presentShadowVisible:presentShadow.visible,
      shadowPosition:shirtShadow.position.clone(),shadowVisible:shirtShadow.visible,lighting:api.lighting(),viewport:renderer.getViewport(new THREE.Vector4()),scissor:renderer.getScissor(new THREE.Vector4()),scissorTest:renderer.getScissorTest(),target:renderer.getRenderTarget()};
    const finish=()=>{
      camera.copy(saved.camera);camera.updateMatrixWorld();garment.position.copy(saved.garmentPosition);garment.rotation.copy(saved.garmentRotation);
      presentGarment.visible=saved.presentVisible;presentShadow.visible=saved.presentShadowVisible;shirtShadow.position.copy(saved.shadowPosition);shirtShadow.visible=saved.shadowVisible;
      uni.uWind.value=saved.wind;uni.uTwist.value=saved.twist;api.restoreLighting(saved.lighting);
      renderer.setRenderTarget(saved.target);renderer.setPixelRatio(saved.ratio);renderer.setSize(saved.size.x,saved.size.y,false);
      renderer.setViewport(saved.viewport);renderer.setScissor(saved.scissor);renderer.setScissorTest(saved.scissorTest);api.pause(false);api.resize();api.updateShadows();api.draw();
    };
    try{
      const gl=renderer.getContext(),max=gl.getParameter(gl.MAX_RENDERBUFFER_SIZE);
      if(width>max||height>max)throw new Error('Choose a smaller export size for this device.');
      renderer.setRenderTarget(null);renderer.setPixelRatio(1);renderer.setSize(width,height,false);renderer.setViewport(0,0,width,height);renderer.setScissorTest(false);
      uni.uWind.value=0;uni.uTwist.value=0;presentGarment.visible=false;presentShadow.visible=false;garment.position.set(0,-.350,0);garment.rotation.set(0,0,0);
      shirtShadow.position.x=0;shirtShadow.position.z=0;garment.updateMatrixWorld(true);
      return {saved,finish};
    }catch(error){finish();throw error;}
  }
  function frame(width,height,{background,grid}){
    api.flush();camera.updateProjectionMatrix();camera.updateMatrixWorld();api.updateLights();api.updateShadows();
    renderer.setViewport(0,0,width,height);renderer.setScissorTest(false);renderer.clear(true,true,true);renderer.render(scene,camera);
    const output=document.createElement('canvas');output.width=width;output.height=height;const ctx=output.getContext('2d');
    if(background==='current'){
      if(grid)api.backdrop(output);else{ctx.fillStyle=state.bg;ctx.fillRect(0,0,width,height);}
    }else if(background==='white'){ctx.fillStyle='#ffffff';ctx.fillRect(0,0,width,height);}
    ctx.drawImage(renderer.domElement,0,0);return output;
  }
  function pointsAndCenter(){
    const box=new THREE.Box3().setFromObject(api.current()),center=box.getCenter(new THREE.Vector3()),points=[];
    for(const x of [box.min.x,box.max.x])for(const y of [box.min.y,box.max.y])for(const z of [box.min.z,box.max.z])points.push(new THREE.Vector3(x,y,z));
    return {center,points,box};
  }
  async function presentationSheet(images,options){
    const cols=Math.min(3,images.length),rows=Math.ceil(images.length/cols),width=2400,margin=80,gap=28,cellWidth=(width-2*margin-gap*(cols-1))/cols;
    const cellHeight=cellWidth*options.height/options.width,header=180,label=48;
    const cv=document.createElement('canvas');cv.width=width;cv.height=Math.ceil(header+rows*(cellHeight+label+gap)+margin);
    const ctx=cv.getContext('2d');ctx.fillStyle='#f4f4f2';ctx.fillRect(0,0,cv.width,cv.height);ctx.fillStyle='#181818';ctx.font='500 48px Rubik, sans-serif';ctx.fillText(api.name()||'Untitled design',margin,88,width-2*margin);
    ctx.font='24px Rubik, sans-serif';ctx.fillStyle='#555';ctx.fillText(api.label(),margin,132);
    for(let i=0;i<images.length;i++){
      const image=images[i],bitmap=await createImageBitmap(image.blob),x=margin+(i%cols)*(cellWidth+gap),y=header+Math.floor(i/cols)*(cellHeight+label+gap);
      ctx.fillStyle=options.background==='current'?state.bg:'#fff';ctx.fillRect(x,y,cellWidth,cellHeight);ctx.drawImage(bitmap,x,y,cellWidth,cellHeight);bitmap.close();
      ctx.fillStyle='#444';ctx.font='22px Rubik, sans-serif';ctx.fillText(viewLabel(image.view),x,y+cellHeight+32,cellWidth);
    }
    ctx.font='18px Rubik, sans-serif';ctx.fillStyle='#777';ctx.fillText(window.BRAND.title,margin,cv.height-28);
    return canvasBlob(cv);
  }
  async function exportAll(){
    if(working||preparing||api.busy()||!api.current())return;
    let plans;try{plans=printUI.plans();}catch(e){message(e.message);return;}
    const views=Array.from(document.querySelectorAll('[name="exportView"]:checked')).map(el=>el.value);
    if(!views.length&&!plans.length&&!$('exportArtwork').checked&&!$('exportDesign').checked){message('Select a view, a print layout, graphics or an ORB project to export.');return;}
    const edge=Number(choice('exportSize')),shape=choice('exportShape'),width=shape==='portrait'?Math.round(edge*.8):edge,height=shape==='wide'?Math.round(edge*9/16):edge;
    const options={width,height,background:choice('exportBackground'),grid:$('exportGrid').checked},name=cleanFilename(api.name());
    working=true;cancelled=false;api.lock(true,'Preparing print package…');$('exportConfirm').disabled=true;$('exportCancel').hidden=false;
    for(const el of $('exportDialog').querySelectorAll('input,select,.print-layout button'))el.disabled=true;
    const artworkUnits=$('exportArtwork').checked?(api.snapshot?.().layers.length||0):0;
    progress.start(2+views.length+(views.length&&$('exportSheet').checked?1:0)+artworkUnits+plans.reduce((n,p)=>n+p.layers.length+1,0)+2);
    let session,success=false;
    try{
      message('Preparing print package…');await turn();
      const design=$('exportDesign').checked?await api.workspace.makeArchive(false):null;check();progress.advance();
      await api.prepare?.();check();progress.advance();
      if(views.length){session=captureSession(width,height);camera.aspect=width/height;}
      const bounds=pointsAndCenter(),{center,points}=api.framing?.()||bounds,{box}=bounds;
      // A common distance for all full views prevents garments jumping in scale.
      const fullViews=['front','angle','side','right','backangle','back'];
      const distance=fitDistance(THREE,points,center,fullViews.map(api.viewAngles),camera.aspect,camera.fov);
      const images=[],zip=new window.JSZip();
      for(const [i,view] of views.entries()){
        check();message(`Rendering ${viewLabel(view)} · ${i+1} of ${views.length}`);await turn();
        const [az,el]=api.viewAngles(view),focus=center.clone(),shot=api.detailView?.(view);
        const d=shot?shot.distance/Math.min(1,camera.aspect):view==='detail'?distance*.66:distance;
        if(shot)focus.fromArray(shot.point);
        if(view==='detail')focus.y+=box.getSize(new THREE.Vector3()).y*.17;
        camera.position.set(focus.x+d*Math.sin(el)*Math.sin(az),focus.y+d*Math.cos(el),focus.z+d*Math.sin(el)*Math.cos(az));camera.lookAt(focus);
        const canvas=frame(width,height,options),blob=await canvasBlob(canvas);canvas.width=canvas.height=1;check();
        images.push({view,blob});zip.file(name+'_'+viewLabel(view).replaceAll(' ','-')+'.png',await blob.arrayBuffer());progress.advance();
      }
      session?.finish();session=null;
      if(images.length&&$('exportSheet').checked){message('Building presentation sheet…');await document.fonts.ready;const sheet=await presentationSheet(images,options);check();zip.file(name+'_Presentation.png',await sheet.arrayBuffer());progress.advance();}
      if(design)zip.file(name+'.orb',await design.arrayBuffer());
      const data=($('exportArtwork').checked||plans.length)?await api.workspace.artworkData():null;check();
      if($('exportArtwork').checked)await addArtworkPackage(zip,data,api.artworkColor,{check,message,advance:()=>progress.advance()});
      if(plans.length)await addPrintLayouts(zip,data,plans,api.artworkColor,{check,message,advance:()=>progress.advance()});

      message('Packaging print files…');const blob=await zip.generateAsync({type:'blob',compression:'STORE'},meta=>{check();progress.packaging(meta.percent/100);});check();downloadBlob(blob,name+'_Print-Package.zip');success=true;progress.finish(true);message(`Print package downloaded · ${views.length} views${plans.length?` · ${plans.length} layered PSDs`:''}.`);
    }catch(error){message(error.message||'The export could not finish. Try a smaller image size.');}
    finally{session?.finish();progress.finish(success);working=false;api.lock(false);$('exportConfirm').disabled=false;$('exportCancel').hidden=true;for(const el of $('exportDialog').querySelectorAll('input,select,.print-layout button'))el.disabled=false;printUI.restoreAvailability();syncDetailExports();summary.sync();}
  }
  $('btnExportAll').onclick=async()=>{
    if(api.busy()||working||preparing)return;message('');progress.reset();syncDetailExports();$('exportDialog').showModal();
    preparing=true;$('exportConfirm').disabled=true;printUI.loading();summary.sync();
    try{const result=await api.printLayouts();printUI.set(result.surfaces,result.garment);}
    catch(e){printUI.set([],null);message(e.message||'Print layouts could not be prepared. You can still export mockups and separate artwork.');}
    finally{preparing=false;$('exportConfirm').disabled=false;summary.sync();}
  };
  $('exportConfirm').onclick=exportAll;$('exportCancel').onclick=()=>{cancelled=true;message('Cancelling…');};
  $('exportDialog').addEventListener('cancel',e=>{if(working){e.preventDefault();cancelled=true;}});
  $('exportDialog').querySelector('[data-close-dialog]').onclick=()=>{if(working){cancelled=true;message('Cancelling…');}else $('exportDialog').close();};
  $('btnSave').onclick=async()=>{
    if(working||api.busy()||!api.current())return;
    working=true;api.lock(true,'Saving image…');let session;
    try{
      await api.prepare?.();
      api.finish();api.draw();const currentCamera=camera.clone(),aspect=camera.aspect;
      const width=aspect>=1?2048:Math.round(2048*aspect),height=aspect>=1?Math.round(2048/aspect):2048;
      session=captureSession(width,height);camera.copy(currentCamera);camera.aspect=width/height;
      const output=frame(width,height,{background:'current',grid:true}),blob=await canvasBlob(output);
      downloadBlob(blob,cleanFilename(api.name())+'_Current-view.png');
    }catch(error){$('designStatus').textContent=error.message||'The image could not be saved.';}
    finally{session?.finish();working=false;api.lock(false);}
  };
}
