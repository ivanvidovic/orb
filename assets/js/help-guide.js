const help=document.getElementById('helpDialog');
help.addEventListener('click',event=>{
  const jump=event.target.closest('[data-help-section]');
  if(jump){
    const section=document.getElementById(jump.dataset.helpSection);
    section.open=true;
    section.querySelector('summary').focus({preventScroll:true});
    section.scrollIntoView({block:'start',behavior:'instant'});
  }
  if(event.target.closest('[data-artist-contact]')){
    help.close();
    document.getElementById('btnArtist').click();
  }
});
