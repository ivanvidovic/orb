import {printDesignKey} from './print-design-key.js?v=0.9.64';
import {installExportSources,exportLabel,srgbPng} from './export-variants.js?v=0.9.64';
import {installExportSummary} from './export-summary.js?v=0.9.64';
import {createExportProgress} from './export-progress.js?v=0.9.64';
import {installPrintLayoutUI} from './print-layout-ui.js?v=0.9.64';
import {addPrintLayouts} from './print-package.js?v=0.9.64';
import {addArtworkPackage} from './artwork-export.js?v=0.9.64';
import {canvasBlob,downloadBlob,cleanFilename} from './design-format.js?v=0.9.64';
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
  for(const input of document.querySelectorAll('[name=exportView]')){const label=input.parentElement,span=document.createElement('span');span.textContent=label.textContent;for(const node of [...label.childNodes])if(node!==input)node.remove();label.append(span);label.parentElement.classList.add('export-choice-buttons');}
  function syncDetailExports(){const inputs=Array.from(document.querySelectorAll('[data-detail-export]'));for(const input of inputs){input.disabled=!sources.selected()&&!api.detailView(input.value);input.closest('label').hidden=input.disabled;if(input.disabled)input.checked=false;}$('exportCloseups').hidden=!inputs.some(input=>!input.disabled);syncCloseupCount();}
  function syncCloseupCount(){$('exportCloseupCount').textContent=$('exportPlacementViews').querySelectorAll('input:checked').length+' selected';}
  $('exportPlacementViews').addEventListener('change',syncCloseupCount);
  let working=false,cancelled=false,preparing=false;
  const sources=installExportSources();
  document.querySelectorAll('[name=exportSource]').forEach(input=>input.addEventListener('change',syncDetailExports));
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
      uni.uWind.value=saved.wind;uni.uTwist.value=saved.twist;
      let lightingError;try{api.restoreLighting(saved.lighting);}catch(error){lightingError=error;}
      renderer.setRenderTarget(saved.target);renderer.setPixelRatio(saved.ratio);renderer.setSize(saved.size.x,saved.size.y,false);
      renderer.setViewport(saved.viewport);renderer.setScissor(saved.scissor);renderer.setScissorTest(saved.scissorTest);api.pause(false);api.resize();api.updateShadows();api.draw();if(lightingError)throw lightingError;
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
  function frame(width,height,{background,grid,shadow=true}){
    api.flush();camera.updateProjectionMatrix();camera.updateMatrixWorld();api.updateLights();api.updateShadows();
    renderer.setViewport(0,0,width,height);renderer.setScissorTest(false);renderer.clear(true,true,true);
    const shadowVisible=shirtShadow.visible;
    try{if(!shadow)shirtShadow.visible=false;renderer.render(scene,camera);}
    finally{shirtShadow.visible=shadowVisible;}
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
  async function exportAll(){
    if(working||preparing||api.busy()||!api.current())return;
    let plans,variants;const fromSnapshots=sources.selected(),snapshotPrints=fromSnapshots&&$('exportPsd').checked;try{plans=snapshotPrints?[]:printUI.plans();variants=sources.choices();}catch(e){message(e.message);return;}
    const views=Array.from(document.querySelectorAll('[name="exportView"]:checked')).map(el=>el.value);
    if(!views.length&&!plans.length&&!snapshotPrints&&!$('exportArtwork').checked&&!$('exportDesign').checked){message('Select a view, a print layout, graphics or an ORB project to export.');return;}
    const edge=Number(choice('exportSize')),shape=choice('exportShape'),width=shape==='portrait'?Math.round(edge*.8):edge,height=shape==='wide'?Math.round(edge*9/16):edge;
    const exportLighting=choice('exportLighting');
    const options={width,height,background:choice('exportBackground'),grid:$('exportGrid').checked,shadow:false},name=cleanFilename(api.name());
    working=true;cancelled=false;api.lock(true,'Preparing selected files…');$('exportConfirm').disabled=true;$('exportCancel').hidden=false;
    for(const el of $('exportDialog').querySelectorAll('input,select,.print-layout button'))el.disabled=true;
    progress.start(2+(snapshotPrints?variants.length:0)+views.length*variants.length+plans.reduce((n,p)=>n+p.layers.length+1,0)+2);
    let session,variantSession,releaseLighting,success=false,psdCount=0,projectCount=0,graphicsCount=0;
    async function restoreExport(){
      const errors=[];
      for(const restore of [()=>{const item=session;session=null;item?.finish();},()=>{const release=releaseLighting;releaseLighting=null;release?.();},async()=>{const item=variantSession;variantSession=null;if(item)await item.restore();},()=>api.pause(false)]){
        try{await restore();}catch(e){errors.push(e.message||String(e));}
      }
      if(errors.length)throw new Error('Could not fully restore the working view: '+errors.join('; '));
    }
    try{
      message('Preparing selected files…');await turn();
      check();progress.advance();
      await api.prepare?.();check();progress.advance();
      const images=[],zip=new window.JSZip(),exportInfo=[],printInfo=[],projectInfo=[],graphicsInfo=[],printSets=new Map();
      if(fromSnapshots)variantSession=await api.workspace.beginExportSession();
      for(const [variantIndex,entry] of variants.entries()){
        check();if(entry){message('Opening '+entry.name+'…');await variantSession.load(await sources.load(entry));check();}
        await api.prepare?.();check();
        const identity=api.exportIdentity(),labels=exportLabel(entry?.name||api.name(),identity.garment,identity.fabric,variantIndex),folder=zip.folder(labels.folder),shots=[];
        if($('exportDesign').checked){
          message('Preparing project · '+(entry?.name||api.name()));
          let design;
          if(entry){const data=await api.workspace.artworkData();check();design=await api.workspace.archiveData({...data,doc:{...data.doc,name:entry.name}});}
          else design=await api.workspace.makeArchive(false);check();
          const path=fromSnapshots?labels.folder+'/'+labels.prefix+'.orb':name+'.orb';
          zip.file(path,await design.arrayBuffer());projectInfo.push({snapshot:entry?.name||api.name(),file:path});projectCount++;
        }
        if($('exportArtwork').checked){
          const data=await api.workspace.artworkData();check();progress.reserve(data.doc.layers.length);
          const count=await addArtworkPackage(fromSnapshots?folder:zip,data,api.artworkColor,{check,message,advance:()=>progress.advance()});
          graphicsCount+=count;graphicsInfo.push({snapshot:entry?.name||api.name(),folder:fromSnapshots?labels.folder:'.',layers:count});
        }
        if(!fromSnapshots&&plans.length){
          const data=await api.workspace.artworkData();check();
          psdCount+=await addPrintLayouts(zip,data,plans,api.artworkColor,{check,message,advance:()=>progress.advance()});
        }
        if(snapshotPrints){
          const result=await api.printLayouts(),snapshotPlans=printUI.plansFor(result.surfaces,result.garment),snapshotData=await api.workspace.artworkData();check();
          if(snapshotPlans.length){
            const key=await printDesignKey(snapshotData,snapshotPlans,api.artworkColor);check();
            let set=printSets.get(key);
            if(!set){
              const path='Print Designs/'+String(printSets.size+1).padStart(2,'0')+' — '+cleanFilename(entry.name);
              set={folder:path,layouts:snapshotPlans.map(p=>p.name)};
              progress.reserve(snapshotPlans.reduce((n,p)=>n+p.layers.length+1,0));
              psdCount+=await addPrintLayouts(zip.folder(path),snapshotData,snapshotPlans,api.artworkColor,{check,message,advance:()=>progress.advance()});printSets.set(key,set);
            }
            printInfo.push({snapshot:entry.name,snapshotId:entry.id,...set});
          }else printInfo.push({snapshot:entry.name,snapshotId:entry.id,layouts:[],reason:'No visible artwork on selected print surfaces'});
        }
        if(snapshotPrints)progress.advance();
        if(!views.length)continue;
        if(exportLighting==='neutral')releaseLighting=api.neutralLighting();
        session=captureSession(width,height);camera.aspect=width/height;
        const {center,points,box}=pointsAndCenter(),fullViews=['front','angle','side','right','backangle','back'];
        const distance=fitDistance(THREE,points,center,fullViews.map(api.viewAngles),camera.aspect,camera.fov,1.08);
        for(const [i,view] of views.entries()){
          check();message(`${entry?.name||api.name()} · ${viewLabel(view)} · ${i+1} of ${views.length}`);await turn();
          const shot=api.detailView?.(view);
          if(!fullViews.includes(view)&&view!=='detail'&&!shot){exportInfo.push({snapshot:entry?.name,skippedView:view,reason:'Placement unavailable on this garment'});progress.advance();continue;}
          const [az,el]=api.viewAngles(view),focus=center.clone(),d=shot?shot.distance/Math.min(1,camera.aspect):view==='detail'?distance*.66:distance;
          if(shot)focus.fromArray(shot.point);if(view==='detail')focus.y+=box.getSize(new THREE.Vector3()).y*.17;
          camera.position.set(focus.x+d*Math.sin(el)*Math.sin(az),focus.y+d*Math.cos(el),focus.z+d*Math.sin(el)*Math.cos(az));camera.lookAt(focus);
          const canvas=frame(width,height,options),blob=await srgbPng(canvas);canvas.width=canvas.height=1;check();
          shots.push({view,blob});folder.file(labels.prefix+'_'+viewLabel(view).replaceAll(' ','-')+'.png',await blob.arrayBuffer());progress.advance();
        }
        session.finish();session=null;releaseLighting?.();releaseLighting=null;
        images.push(...shots);exportInfo.push({snapshot:entry?.name||api.name(),...identity,folder:labels.folder,views:shots.map(s=>viewLabel(s.view)),lighting:exportLighting,background:options.background,width,height});
      }
      await restoreExport();
      zip.file('Export Summary.json',JSON.stringify({design:name,mockups:exportInfo,printDesigns:printInfo,projects:projectInfo,graphics:graphicsInfo},null,2));
      if(snapshotPrints)zip.file('Print Designs/README.txt','SNAPSHOT PRINT DESIGNS\n\nIdentical print designs share a PSD set. Garment colors and scene lighting are not printed. Automatic ink colors can differ between garments and therefore require separate sets.\n\n'+printInfo.map(item=>item.snapshot+'\n'+(item.folder||item.reason)+'\n').join('\n'));
      message('Packaging selected files…');const blob=await zip.generateAsync({type:'blob',compression:'STORE'},meta=>{check();progress.packaging(meta.percent/100);});check();downloadBlob(blob,name+'_Export.zip');success=true;progress.finish(true);message(`Selected files downloaded · ${images.length} mockups${psdCount?` · ${psdCount} layered PSDs`:''}${projectCount?` · ${projectCount} ORB project${projectCount===1?'':'s'}`:''}${graphicsCount?` · ${graphicsCount} graphics layers`:''}.`);
    }catch(error){message(error.message||'The export could not finish. Try a smaller image size.');}
    finally{try{await restoreExport();}catch(e){message('Export stopped; restoring the working design failed: '+e.message);}progress.finish(success);working=false;api.lock(false);$('exportConfirm').disabled=false;$('exportCancel').hidden=true;for(const el of $('exportDialog').querySelectorAll('input,select,.print-layout button'))el.disabled=false;printUI.restoreAvailability();syncDetailExports();summary.sync();}
  }
  $('btnExportAll').onclick=async()=>{
    if(api.busy()||working||preparing)return;message('');progress.reset();syncDetailExports();$('exportDialog').showModal();
    preparing=true;$('exportConfirm').disabled=true;printUI.loading();summary.sync();
    try{await sources.refresh();const result=await api.printLayouts();printUI.set(result.surfaces,result.garment);}
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
  // Cover only the live canvas while the existing renderer captures other views.
  function holdSnapshotView(){
    api.draw();
    const source=renderer.domElement,stage=source.parentElement;
    const sourceRect=source.getBoundingClientRect(),rect=stage.getBoundingClientRect();
    const held=document.createElement('canvas'),cue=document.createElement('div');
    held.width=Math.max(1,Math.round(rect.width));held.height=Math.max(1,Math.round(rect.height));
    const context=held.getContext('2d');if(!context)throw new Error('Could not prepare snapshot preview.');
    const scaleX=source.width/sourceRect.width,scaleY=source.height/sourceRect.height;
    context.drawImage(source,(rect.left-sourceRect.left)*scaleX,(rect.top-sourceRect.top)*scaleY,rect.width*scaleX,rect.height*scaleY,0,0,held.width,held.height);
    held.setAttribute('aria-hidden','true');held.style.cssText='position:absolute;inset:0;width:100%;height:100%;pointer-events:none;z-index:2;';
    cue.className='snapshot-capture-corners';cue.setAttribute('aria-hidden','true');
    for(let i=0;i<4;i++)cue.append(document.createElement('i'));
    const visibility=source.style.visibility;stage.append(held,cue);source.style.visibility='hidden';
    return ()=>{source.style.visibility=visibility;held.remove();cue.remove();held.width=held.height=1;};
  }
  return {async snapshotPreviews(){
    if(working||preparing||!api.current())throw new Error('The garment is not ready for a snapshot.');
    working=true;let session,releaseView;
    try{
      releaseView=holdSnapshotView();
      await api.prepare?.();
      const width=1200,height=1400;
      session=captureSession(width,height);shirtShadow.visible=false;camera.aspect=width/height;
      const {center,points}=pointsAndCenter();
      const distance=fitDistance(THREE,points,center,['front','back'].map(api.viewAngles),camera.aspect,camera.fov,1.12);
      const previews={gallery:{}};
      for(const view of ['front','back']){
        const [az,el]=api.viewAngles(view),d=distance;
        camera.position.set(center.x+d*Math.sin(el)*Math.sin(az),center.y+d*Math.cos(el),center.z+d*Math.sin(el)*Math.cos(az));camera.lookAt(center);
        const canvas=frame(width,height,{background:'transparent',grid:false});
        const thumb=document.createElement('canvas');thumb.width=480;thumb.height=560;
        const encode=(image,quality)=>new Promise((resolve,reject)=>image.toBlob(blob=>blob?resolve(blob):reject(new Error('Could not create snapshot preview.')),'image/webp',quality));
        try{
          previews.gallery[view]=await encode(canvas,.94);
          const context=thumb.getContext('2d');context.imageSmoothingQuality='high';context.drawImage(canvas,0,0,480,560);
          previews[view]=await encode(thumb,.86);
        }finally{canvas.width=canvas.height=thumb.width=thumb.height=1;}
      }
      return previews;
    }finally{try{session?.finish();}finally{try{if(releaseView)await new Promise(resolve=>requestAnimationFrame(resolve));}finally{releaseView?.();working=false;}}}
  }};

}
