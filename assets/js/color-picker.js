// Persistent, nonmodal color editing shared by every Studio color control.
export function installColorPicker(){
  const panel=document.createElement('section');
  panel.id='colorPopover';panel.hidden=true;panel.setAttribute('role','dialog');
  panel.setAttribute('aria-label','Choose color');
  panel.innerHTML=`<div class="color-pop-head"><strong id="colorPopoverTitle">Color</strong><button type="button" id="colorDone">Done</button></div>
    <div id="colorSV" tabindex="0" role="slider" aria-label="Saturation and brightness" aria-valuemin="0" aria-valuemax="100"><span id="colorCursor"></span></div>
    <label class="color-hue-label" for="colorHue">Hue</label><input id="colorHue" type="range" min="0" max="360" value="0" aria-label="Hue">
    <div class="color-hex-row"><span id="colorPreview"></span><label for="colorHex">Hex</label><input id="colorHex" type="text" maxlength="7" spellcheck="false" autocapitalize="characters" inputmode="text" value="#FFFFFF"></div>`;
  document.body.append(panel);
  const field=panel.querySelector('#colorSV'),cursor=panel.querySelector('#colorCursor');
  const hue=panel.querySelector('#colorHue'),hex=panel.querySelector('#colorHex'),preview=panel.querySelector('#colorPreview');
  let target=null,h=0,s=0,v=1,changed=false;
  function read(value){
    const rgb=value.slice(1).match(/../g).map(c=>parseInt(c,16)/255),[r,g,b]=rgb;
    const max=Math.max(...rgb),min=Math.min(...rgb),d=max-min;v=max;s=max?d/max:0;
    if(d)h=((max===r?(g-b)/d+(g<b?6:0):max===g?(b-r)/d+2:(r-g)/d+4)*60);
  }
  function value(){
    const c=v*s,x=c*(1-Math.abs((h/60)%2-1)),m=v-c;
    const rgb=h<60?[c,x,0]:h<120?[x,c,0]:h<180?[0,c,x]:h<240?[0,x,c]:h<300?[x,0,c]:[c,0,x];
    return '#'+rgb.map(n=>Math.round((n+m)*255).toString(16).padStart(2,'0')).join('').toUpperCase();
  }
  function sync(emit=false){
    const color=value();field.style.backgroundColor=`hsl(${h} 100% 50%)`;
    cursor.style.left=s*100+'%';cursor.style.top=(1-v)*100+'%';hue.value=h;
    hex.value=color;preview.style.background=color;
    field.setAttribute('aria-valuenow',Math.round(s*100));field.setAttribute('aria-valuetext',`Saturation ${Math.round(s*100)}%, brightness ${Math.round(v*100)}%`);
    if(emit&&target&&target.isConnected){target.value=color;changed=true;target.dispatchEvent(new Event('input',{bubbles:true}));}
  }
  function position(){
    if(panel.hidden||!target)return;
    const viewport=window.visualViewport,left=viewport?.offsetLeft||0,top=viewport?.offsetTop||0;
    const width=viewport?.width||innerWidth,height=viewport?.height||innerHeight;
    panel.style.width=Math.min(288,width-24)+'px';
    const r=target.getBoundingClientRect(),ph=panel.offsetHeight,pw=panel.offsetWidth;
    panel.style.left=Math.max(left+12,Math.min(r.right-pw,left+width-pw-12))+'px';
    const below=r.bottom+10;
    panel.style.top=Math.max(top+12,Math.min(below+ph<top+height-12?below:r.top-ph-10,top+height-ph-12))+'px';
  }
  function close(restore=false){
    if(!target)return;
    const previous=target;target=null;panel.hidden=true;previous.setAttribute('aria-expanded','false');
    if(changed)previous.dispatchEvent(new Event('change',{bubbles:true}));
    if(restore&&previous.isConnected)previous.focus({preventScroll:true});
  }
  function open(input){
    if(input.disabled)return;
    if(target===input&&!panel.hidden)return;
    close();target=input;changed=false;h=0;read(input.value);
    panel.querySelector('#colorPopoverTitle').textContent=input.getAttribute('aria-label')||'Color';
    input.setAttribute('aria-controls',panel.id);input.setAttribute('aria-expanded','true');
    panel.hidden=false;sync();position();field.focus({preventScroll:true});
  }
  document.addEventListener('click',event=>{
    const input=event.target.closest('input[type="color"]')||event.target.closest('label')?.querySelector('input[type="color"]');
    if(!input)return;event.preventDefault();open(input);
  },true);
  document.addEventListener('keydown',event=>{
    if(event.target.matches('input[type="color"]')&&['Enter',' '].includes(event.key)){event.preventDefault();open(event.target);}
    else if(event.key==='Escape'&&!panel.hidden){event.preventDefault();event.stopPropagation();close(true);}
  },true);
  document.addEventListener('pointerdown',event=>{
    if(!target||panel.contains(event.target)||event.target===target||target.closest('label')?.contains(event.target))return;
    close();
  },true);
  panel.querySelector('#colorDone').addEventListener('click',()=>close(true));
  let pointer=null;
  function move(event){
    const r=field.getBoundingClientRect();s=Math.max(0,Math.min(1,(event.clientX-r.left)/r.width));v=1-Math.max(0,Math.min(1,(event.clientY-r.top)/r.height));sync(true);
  }
  field.addEventListener('pointerdown',event=>{event.preventDefault();pointer=event.pointerId;field.setPointerCapture(pointer);field.focus({preventScroll:true});move(event);});
  field.addEventListener('pointermove',event=>{if(event.pointerId===pointer)move(event);});
  for(const type of ['pointerup','pointercancel','lostpointercapture'])field.addEventListener(type,()=>{pointer=null;});
  field.addEventListener('keydown',event=>{
    const step=event.shiftKey?.1:.01;
    if(event.key==='ArrowLeft')s-=step;else if(event.key==='ArrowRight')s+=step;else if(event.key==='ArrowUp')v+=step;else if(event.key==='ArrowDown')v-=step;else return;
    event.preventDefault();s=Math.max(0,Math.min(1,s));v=Math.max(0,Math.min(1,v));sync(true);
  });
  hue.addEventListener('input',()=>{h=Number(hue.value);sync(true);});
  hex.addEventListener('input',()=>{let text=hex.value.trim();if(!text.startsWith('#'))text='#'+text;if(/^#[0-9a-f]{6}$/i.test(text)){read(text);sync(true);}});
  hex.addEventListener('blur',()=>{hex.value=value();});
  hex.addEventListener('keydown',event=>{if(event.key==='Enter'){event.preventDefault();field.focus();}});
  window.addEventListener('resize',position);window.addEventListener('scroll',position,true);
  window.visualViewport?.addEventListener('resize',position);window.visualViewport?.addEventListener('scroll',position);
}
