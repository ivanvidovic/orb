import {preferredFabricCode} from './deck-fabric-codes.js?v=0.9.81';
import {CAMO_LIBRARY} from './camo.js?v=0.9.81';
import {colorName} from './color-name.js?v=0.9.81';
export const FONT_STYLES=['Regular','Square','Circle','Grid','Triangle','Line'];
const garments={'mens-tee':"Men's T-Shirt",'womens-tee':"Women's T-Shirt",'mens-crewneck':"Men's Crewneck",'womens-crewneck':"Women's Crewneck",'mens-hoodie':"Men's Hoodie",'womens-hoodie':"Women's Hoodie"};
const fabrics=['Chalk','Ecru','Greige','Graphite','Washed Black'];
export const deckDefaults={collection:'Merch Exploration',prefix:'',subtitle:'Round 01',closingNote:'Thank you',width:1920,primary:'Regular',secondary:'Regular',background:'#FFFFFF',text:'#202020',accent:'#202020',coverBackground:'#000000',coverText:'#FFFFFF',cover:true,overview:true,closing:false,details:true,colors:true,pageNumbers:true,overviewView:'back'};
export function metadata(doc){const s=doc.settings||{},m=s.deckIdentity||{},fabric=CAMO_LIBRARY.find(c=>c.id===s.camoId)?.name||(s.blank==='custom'?colorName(s.garmentCustom||'#FFFFFF'):fabrics[s.blank]||'Custom Fabric');return {collection:'',prefix:'',number:'',title:doc.layers?.find(l=>l.visible!==false&&['back','front'].includes(l.slot))?.name||doc.name||'Untitled',fabric,code:preferredFabricCode(fabric),...m,garment:garments[doc.garmentId]||'Custom Garment'};}
export function reference(m){if(!m.number)return '';return [m.prefix,m.number,m.code].filter(Boolean).join('-');}
export function snapshotName(m){return [reference(m),m.title].filter(Boolean).join(' · ').slice(0,80);}
export function validIdentity(m){return m&&typeof m==='object'&&!Array.isArray(m)&&['collection','prefix','number','title','fabric','code'].every(k=>typeof m[k]==='string'&&m[k].length<=80)&&(!m.prefix||/^[A-Z0-9-]+$/.test(m.prefix))&&(!m.number||/^\d{1,6}$/.test(m.number))&&(!m.code||/^[A-Z0-9-]+$/.test(m.code));}
export function artworkColors(identity){return [...new Set((identity.artwork||[]).filter(a=>a.visible!==false&&a.mode!=='original'&&a.color&&/^#[a-f\d]{6}$/i.test(a.color)).map(a=>a.color.toUpperCase()))];}
