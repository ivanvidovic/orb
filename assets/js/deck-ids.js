import {metadata,reference} from './deck-metadata.js?v=0.9.81';
const solids=['#F3F1EC','#E1DCD2','#ADA79D','#60615E','#252628'];
import {preferredFabricCode} from './deck-fabric-codes.js?v=0.9.81';
export function fabricKey(doc){const s=doc.settings||{};return s.camoId?'camo:'+s.camoId:'hex:'+(s.blank==='custom'?s.garmentCustom:solids[s.blank??0]||s.garmentCustom||'#FFFFFF').toUpperCase();}
export function fabricCode(doc,name=metadata(doc).fabric){return preferredFabricCode(name);}
export function canonicalReference(m){return [m.prefix.trim().toUpperCase(),String(Number(m.number)),m.code.trim().toUpperCase()].join('|');}
export function identityConflicts(rows){const seen=new Map(),errors=[];for(const row of rows){if(!row.metadata.number)continue;const key=canonicalReference(row.metadata);if(seen.has(key)){const old=seen.get(key);errors.push(`${reference(row.metadata)}: “${old.name}” (${old.metadata.fabric}) and “${row.name}” (${row.metadata.fabric})`);}else seen.set(key,row);}return errors;}
const stable=v=>Array.isArray(v)?v.map(stable):v&&typeof v==='object'?Object.fromEntries(Object.keys(v).sort().filter(k=>v[k]!==undefined).map(k=>[k,stable(v[k])])):typeof v==='number'?Math.round(v*1e6)/1e6:v;
export function artworkSignature(entry){const d=entry.doc,s=d.settings||{},palette=s.paletteBook?.palettes?.find(p=>p.id===s.paletteBook.active),groups=s.lockupGroups||[];
 const ignore=new Set(['id','name','sourceName','thumb','autoName','nameEdited','defaultSlot','defaultMode','defaultScale','defaultSolidInvert','paletteSlot','groupId','visible']);
 const layers=(d.layers||[]).filter(l=>l.visible!==false&&groups.find(g=>g.id===l.groupId)?.visible!==false).map(l=>{const v=Object.fromEntries(Object.entries(l).filter(([k])=>!ignore.has(k)));if(l.mode==='original'){delete v.inkCustom;delete v.tintCustom;}else{const c=palette?.colors?.[l.paletteSlot];if(l.mode==='ink'){v.inkCustom=c||l.inkCustom;delete v.tintCustom;}else{v.tintCustom=c||l.tintCustom;delete v.inkCustom;}}return v;});
 return JSON.stringify(stable({garment:d.garmentId,model:entry.modelKey,customFlipped:d.customFlipped,layers,artGlossiness:s.artGlossiness}));
}
// Return proposals only. Persisting remains an explicit Apply Names & IDs action.
export function suggestIdentities(entries,picked,drafts,prefix='',regenerateCodes=false){
 const pickedIds=new Set(picked.map(e=>e.id)),result=new Map(),used=new Map(),groups=new Map(),fabricCodes=new Map(),codeOwners=new Map();let next=Math.max(0,...entries.map(e=>Number(metadata(e.doc).number)||0),...picked.map(e=>Number(drafts.get(e.id)?.number)||0));
 for(const e of entries){const m={...metadata(e.doc)};if(m.number){const sig=artworkSignature(e),scope=m.prefix.toUpperCase()+'|'+sig;if(!groups.has(scope))groups.set(scope,m.number);if(!pickedIds.has(e.id))used.set(canonicalReference(m),{entry:e,metadata:m});const fk=fabricKey(e.doc);if(!fabricCodes.has(fk))fabricCodes.set(fk,m.code);if(!codeOwners.has(m.code.toUpperCase()))codeOwners.set(m.code.toUpperCase(),fk);}}
 for(const e of picked){const m={...(drafts.get(e.id)||metadata(e.doc))};m.prefix=prefix||m.prefix;const scope=m.prefix.toUpperCase()+'|'+artworkSignature(e),fk=fabricKey(e.doc);if(!m.number)m.number=groups.get(scope)||String(++next).padStart(3,'0');if(!groups.has(scope))groups.set(scope,m.number);
 if(regenerateCodes)m.code=fabricCode(e.doc,m.fabric);else if(!e.doc.settings?.deckIdentity?.code&&!(drafts.get(e.id)?.code&&drafts.get(e.id).code!==metadata(e.doc).code))m.code=fabricCodes.get(fk)||fabricCode(e.doc,m.fabric);
 const uniqueShadeCode=()=>{const base=fabricCode(e.doc,m.fabric);let candidate=base,n=2;while(codeOwners.has(candidate.toUpperCase())&&codeOwners.get(candidate.toUpperCase())!==fk)candidate=base+'-'+String(n++).padStart(2,'0');return candidate;};
 if((regenerateCodes||!e.doc.settings?.deckIdentity?.code)&&codeOwners.has(m.code.toUpperCase())&&codeOwners.get(m.code.toUpperCase())!==fk)m.code=uniqueShadeCode();
 if(used.has(canonicalReference(m))){const other=used.get(canonicalReference(m));if(fabricKey(other.entry.doc)!==fk)m.code=uniqueShadeCode();if(used.has(canonicalReference(m)))m.number=String(++next).padStart(3,'0');}
 used.set(canonicalReference(m),{entry:e,metadata:m});fabricCodes.set(fk,m.code);codeOwners.set(m.code.toUpperCase(),fk);result.set(e.id,m);
 }
 return result;
}
