// Compact controls share the existing select/input event path and saved state.
const groups=[];
export function syncProjectorButtons(){
 for(const {select,buttons} of groups)for(const [option,button] of buttons){button.hidden=option.hidden;button.setAttribute('aria-pressed',String(option.value===select.value));}
}
export function setupProjectorControls(){
 for(const id of ['projectorPattern','projectorColorMode','projectorGradient','projectorWarpShape','projectorShape']){
  const select=document.getElementById(id);select.hidden=true;
  const row=select.parentElement;row.classList.add('projector-choice-row');
  const grid=document.createElement('div');grid.className='projector-choices';grid.setAttribute('role','group');grid.setAttribute('aria-label',row.querySelector('label').textContent);
  if(id==='projectorPattern')grid.classList.add('projector-effects');
  const buttons=[...select.options].map(option=>{const button=document.createElement('button');button.type='button';button.textContent=option.textContent;button.addEventListener('click',()=>{select.value=option.value;select.dispatchEvent(new Event('change',{bubbles:true}));});grid.append(button);return [option,button];});
  row.append(grid);groups.push({select,buttons});
 }
 const shuffleIcon='<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" aria-hidden="true"><path d="M3 6h3c5 0 7 12 12 12h3m-4-4 4 4-4 4M3 18h3c2 0 3-2 4-4m4-4c1-2 2-4 4-4h3m-4-4 4 4-4 4"/></svg>';
 function randomColor(){const rgb=new Uint8Array(3);crypto.getRandomValues(rgb);return '#'+[...rgb].map(n=>n.toString(16).padStart(2,'0')).join('');}
 function shuffleButton(title,action){const button=document.createElement('button');button.type='button';button.className='projector-shuffle';button.title=title;button.setAttribute('aria-label',title);button.innerHTML=shuffleIcon;button.addEventListener('click',action);return button;}
 const palette=document.querySelector('#projectorPalette .color-tools');palette.classList.add('projector-swatches');
 for(const swatch of [...palette.querySelectorAll('[data-projector-swatch]')]){
  const i=swatch.dataset.projectorSwatch;const cell=document.createElement('span');cell.dataset.projectorSwatch=i;cell.className='projector-color-cell';swatch.removeAttribute('data-projector-swatch');swatch.before(cell);cell.append(swatch);
  cell.append(shuffleButton('Randomize color '+i,()=>{const input=swatch.querySelector('input');input.value=randomColor();input.dispatchEvent(new Event('input',{bubbles:true}));}));
 }
 const heading=document.createElement('div');heading.className='projector-palette-heading';heading.textContent='Palette';heading.append(shuffleButton('Randomize palette',()=>{
  const inputs=[...palette.querySelectorAll('[data-projector-swatch]:not([hidden]) input')];
  // One event per changed swatch keeps state, color picker and project saving synced.
  for(const input of inputs){input.value=randomColor();input.dispatchEvent(new Event('input',{bubbles:true}));}
 }));
 const line=palette.parentElement;line.classList.add('projector-palette-line');line.querySelector('.lbl').replaceWith(heading);
 const pause=document.getElementById('projectorPaused').parentElement;pause.classList.add('projector-pause');document.getElementById('projectorSpeed').parentElement.after(pause);
 syncProjectorButtons();
}
