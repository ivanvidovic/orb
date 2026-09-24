// Read image files from the user's paste event; no clipboard permission needed.
export function installArtworkPaste({blocked,importImages,root=document}){
  const editing=element=>element?.isContentEditable||element?.closest?.('input,textarea,select,[contenteditable]:not([contenteditable="false"]),[role="textbox"]');
  root.addEventListener('paste',event=>{
    if(event.defaultPrevented||editing(event.target)||editing(root.activeElement)||blocked())return;
    const clipboard=event.clipboardData;
    if(!clipboard)return;
    // Items and files usually describe the same image: use only one source.
    let files=Array.from(clipboard.items||[])
      .filter(item=>item.kind==='file'&&item.type.startsWith('image/'))
      .map(item=>item.getAsFile()).filter(Boolean);
    if(!files.length)files=Array.from(clipboard.files||[]).filter(file=>file.type.startsWith('image/'));
    if(!files.length)return;
    event.preventDefault();
    importImages(files);
  });
}
