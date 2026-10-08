// Shared collection is stored separately from project and snapshot state.
const KEY='orb-palette-library-v1';
const clone=v=>structuredClone(v),hex=v=>typeof v==='string'&&/^#[0-9a-f]{6}$/i.test(v);
const signature=p=>JSON.stringify(p.colors.map(c=>c.toUpperCase()));
function records(book){return book.palettes.map(p=>({id:p.id,name:p.name,sourceName:p.librarySourceName||p.name,slots:book.slots.slice(0,p.libraryColorCount??book.slots.length).map(s=>s.name),colors:book.slots.slice(0,p.libraryColorCount??book.slots.length).map(s=>p.colors[s.id].toUpperCase())}));}
function valid(p){return p&&typeof p.id==='string'&&typeof p.name==='string'&&p.name.length<=80&&Array.isArray(p.colors)&&p.colors.length<=8&&p.colors.every(hex)&&Array.isArray(p.slots)&&p.slots.length===p.colors.length&&p.slots.every(s=>typeof s==='string'&&s.length>0&&s.length<=80);}
export function createPaletteLibrary(storage){
 if(!storage){try{storage=localStorage;}catch{storage={getItem:()=>null,setItem:()=>{throw Error('Browser storage is unavailable.');}};}}
 let saved=[];try{const value=JSON.parse(storage.getItem(KEY)||'[]');if(Array.isArray(value)&&value.every(valid))saved=value;}catch{}
 function write(next){storage.setItem(KEY,JSON.stringify(next));saved=clone(next);}
 return {
  merge(book,{includeIncoming=true}={}){
   const incoming=records(book),all=clone(saved),mapping=new Map();
   for(const p of includeIncoming?incoming:[]){
    let match=all.find(q=>signature(q)===signature(p)&&(q.name===p.name||q.sourceName===(p.sourceName||p.name)));
    if(!match){
     if(all.length>=100)throw Error('Your palette collection is full (100 palettes). Delete an unused palette before importing more.');
     const original=p.sourceName||p.name;let name=p.name,n=2;
     while(all.some(q=>q.name===name))name=original.slice(0,70)+' ('+(n++)+')';
     match={...p,name,sourceName:original,id:all.some(q=>q.id===p.id)?crypto.randomUUID():p.id};all.push(match);
    }
    mapping.set(p.id,match.id);
   }
   const result=clone(book),count=Math.max(book.slots.length,...all.map(p=>p.colors.length));
   while(result.slots.length<count){const i=result.slots.length;result.slots.push({id:crypto.randomUUID(),name:all.find(p=>p.slots[i])?.slots[i]||'Color '+(i+1)});}
   result.palettes=all.map(p=>({id:p.id,name:p.name,librarySourceName:p.sourceName,libraryColorCount:p.colors.length,colors:Object.fromEntries(result.slots.map((s,i)=>[s.id,p.colors[i]||'#FFFFFF']))}));
   result.active=mapping.get(book.active)||result.palettes[0].id;
   return result;
  },
  save(book){write(records(book));},
  get size(){return saved.length;}
 };
}
