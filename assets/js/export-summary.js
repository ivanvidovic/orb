import {installBalancedChoices} from './export-choices.js?v=90';
// Summarize selections without depending on whether their controls are expanded.
export function installExportSummary({dialog,working=()=>false}){
 installBalancedChoices(dialog);
 const get=id=>document.getElementById(id),plural=(n,one,many=one+'s')=>`${n} ${n===1?one:many}`;
 function sync(){
  const views=dialog.querySelectorAll('[name="exportView"]:checked:not(:disabled)').length;
  const psds=get('exportPsd').checked?get('exportPrintLayouts').querySelectorAll('.print-layout-heading input:checked').length:0;
  const issues=get('exportPsd').checked?get('exportPrintLayouts').querySelectorAll('[data-invalid="true"]').length:0;
  get('exportLayoutWarning').hidden=!issues;get('exportLayoutWarning').textContent=issues?plural(issues,'layout')+' need'+(issues===1?'s':'')+' attention. Open Print artwork to review.':'';
  const graphics=get('exportArtwork').checked,project=get('exportDesign').checked,sheet=get('exportSheet').checked&&views>0;
  const current=!!get('exportBackground').querySelector('input[value="current"]:checked');
  if(!working()){get('exportGrid').disabled=!current||!views;get('exportSheet').disabled=!views;}
  get('exportMockupTitleCount').textContent=plural(views,'view')+(sheet?' · sheet':'');
  get('exportPrintTitleCount').textContent=[psds?plural(psds,'PSD layout'):null,graphics?'Individual graphics':null,issues?plural(issues,'layout')+' to review':null].filter(Boolean).join(' · ')||'None selected';
  get('exportProjectTitleCount').textContent=project?'Included':'Not included';
  get('exportSummary').textContent=[views?plural(views,'mockup'):null,sheet?'Presentation sheet':null,psds?plural(psds,'PSD layout'):null,graphics?'Individual graphics':null,project?'ORB project':null].filter(Boolean).join(' · ')||'No files selected';
 }
 dialog.addEventListener('printlayoutchange',sync);dialog.addEventListener('input',sync);dialog.addEventListener('change',sync);sync();return {sync};
}
