
// Summarize selections without depending on whether their controls are expanded.
export function installExportSummary({dialog,working=()=>false}){

 const get=id=>document.getElementById(id),plural=(n,one,many=one+'s')=>`${n} ${n===1?one:many}`;
 function sync(){
  const views=dialog.querySelectorAll('[name="exportView"]:checked:not(:disabled)').length;
  const fromSnapshots=!!dialog.querySelector('[name=exportSource][value=snapshots]:checked'),variants=fromSnapshots?dialog.querySelectorAll('#exportSnapshots input:checked').length:1;
  const psds=get('exportPsd').checked?get('exportPrintLayouts').querySelectorAll('.print-layout-heading input:checked').length:0;
  const issues=get('exportPsd').checked?get('exportPrintLayouts').querySelectorAll('[data-invalid="true"]').length:0;
  get('exportLayoutWarning').hidden=!issues;get('exportLayoutWarning').textContent=issues?plural(issues,'layout')+' need'+(issues===1?'s':'')+' attention. Open Print artwork to review.':'';
  const setting=id=>get(id).querySelector('input:checked')?.nextElementSibling?.textContent||'';get('exportSettingsSummary').textContent=[setting('exportSize'),setting('exportShape'),setting('exportBackground'),setting('exportLighting')].join(' · ');
  const graphics=get('exportArtwork').checked,project=get('exportDesign').checked;
  const current=!!get('exportBackground').querySelector('input[value="current"]:checked');
  get('exportGridOption').hidden=!current;
  if(!working()){get('exportGrid').disabled=!current||!views;}
  get('exportMockupTitleCount').textContent=plural(views,'view');
  get('exportPrintTitleCount').textContent=[fromSnapshots&&get('exportPsd').checked?'Unique snapshot PSDs':psds?plural(psds,'PSD layout'):null,graphics?'Individual graphics':null,issues?plural(issues,'layout')+' to review':null].filter(Boolean).join(' · ')||'None selected';
  get('exportProjectTitleCount').textContent=project?plural(variants,'project'):'Not included';
  get('exportSummary').textContent=[views?plural(views*variants,'mockup'):null,fromSnapshots&&get('exportPsd').checked?'Unique snapshot PSDs':psds?plural(psds,'PSD layout'):null,graphics?'Individual graphics':null,project?plural(variants,'ORB project'):null].filter(Boolean).join(' · ')||'No files selected';
 }
 dialog.addEventListener('printlayoutchange',sync);dialog.addEventListener('input',sync);dialog.addEventListener('change',sync);sync();return {sync};
}
