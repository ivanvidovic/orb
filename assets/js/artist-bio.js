// Isolated artist panel; no garment, lighting, or artwork state changes.
const trigger=document.getElementById('btnArtist');
const dialog=document.getElementById('artistDialog');
const closeButton=document.getElementById('artistClose');
const mark=document.getElementById('mobileMark');
const emblem=new DOMParser().parseFromString("<svg version=\"1.1\" id=\"Layer_2\" xmlns=\"http://www.w3.org/2000/svg\" xmlns:xlink=\"http://www.w3.org/1999/xlink\" x=\"0px\" y=\"0px\"\n\t width=\"1000px\" height=\"1000px\" viewBox=\"-0.1538391 0 1000 1000\" enable-background=\"new 0 0 1000 1000\" xml:space=\"preserve\">\n<circle fill=\"none\" stroke=\"currentColor\" stroke-width=\"80\" stroke-linecap=\"round\" stroke-linejoin=\"round\" stroke-miterlimit=\"10\" cx=\"499.8461609\" cy=\"500\" r=\"460\"/>\n<g>\n\t<path fill=\"none\" stroke=\"currentColor\" stroke-width=\"80\" stroke-linecap=\"round\" stroke-linejoin=\"round\" stroke-miterlimit=\"10\" d=\"\n\t\tM674.6182861,925.295166V674.7720947C674.6182861,578.2481689,596.3701172,500,499.8461609,500\n\t\ts-174.7721252,78.2481689-174.7721252,174.7720947V925.295166\"/>\n\t\n\t\t<circle fill=\"none\" stroke=\"currentColor\" stroke-width=\"80\" stroke-linecap=\"round\" stroke-linejoin=\"round\" stroke-miterlimit=\"10\" cx=\"499.8461609\" cy=\"325.2278748\" r=\"174.7721252\"/>\n</g>\n<g>\n\t\n\t\t<circle fill=\"none\" stroke=\"currentColor\" stroke-width=\"80\" stroke-linecap=\"round\" stroke-linejoin=\"round\" stroke-miterlimit=\"10\" cx=\"499.8461609\" cy=\"616.5148926\" r=\"116.5148926\"/>\n\t\n\t\t<circle fill=\"none\" stroke=\"currentColor\" stroke-width=\"80\" stroke-linecap=\"round\" stroke-linejoin=\"round\" stroke-miterlimit=\"10\" cx=\"499.8461609\" cy=\"383.4851074\" r=\"116.5148926\"/>\n</g>\n</svg>\n",'image/svg+xml').documentElement;
mark.setAttribute('viewBox',emblem.getAttribute('viewBox'));
mark.append(...Array.from(emblem.children));
trigger.addEventListener('click',()=>{
  if(dialog.open)return;
  dialog.showModal();
  closeButton.focus({preventScroll:true});
});
closeButton.addEventListener('click',()=>dialog.close());
let backdropDown=false;
function outside(event){
  const r=dialog.getBoundingClientRect();
  return event.target===dialog && (event.clientX<r.left || event.clientX>r.right || event.clientY<r.top || event.clientY>r.bottom);
}
dialog.addEventListener('pointerdown',event=>{backdropDown=outside(event);});
dialog.addEventListener('click',event=>{
  if(backdropDown && outside(event))dialog.close();
  backdropDown=false;
});
// Retain native Escape and Tab behavior; prevent garment shortcuts in this panel.
dialog.addEventListener('keydown',event=>event.stopPropagation());
dialog.addEventListener('close',()=>{
  backdropDown=false;
  trigger.focus({preventScroll:true});
});
