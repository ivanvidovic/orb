export const PRESENT_LIGHTS=['softbox','studio','day','night','uv','runway','afterglow','projector'];
export const PRESENT_NAMES=['Neutral','Studio','Day','Night','UV','Runway','Afterglow','Projector'];
export function defaultPresentation(){return {cycle:false,order:[...PRESENT_LIGHTS],selected:[],hold:10,fade:3,background:false,bg:'#181818',graphic:null,graphicName:'',graphicMode:'original',graphicColor:'#ffffff',opacity:20,size:65,x:50,y:50,camera:'current',rotate:true,speed:100};}
export function validPresentation(p){
 const color=v=>typeof v==='string'&&/^#[a-f\d]{6}$/i.test(v);
 const number=(key,min,max)=>typeof p[key]==='number'&&Number.isFinite(p[key])&&p[key]>=min&&p[key]<=max;
 return !!p&&typeof p==='object'&&['cycle','background','rotate'].every(k=>typeof p[k]==='boolean')&&
 Array.isArray(p.order)&&p.order.length===8&&new Set(p.order).size===8&&p.order.every(id=>PRESENT_LIGHTS.includes(id))&&
 Array.isArray(p.selected)&&p.selected.length<=8&&new Set(p.selected).size===p.selected.length&&p.selected.every(id=>PRESENT_LIGHTS.includes(id))&&
 number('hold',1,600)&&number('fade',0,30)&&number('opacity',0,100)&&number('size',5,200)&&number('x',0,100)&&number('y',0,100)&&number('speed',0,300)&&
 color(p.bg)&&color(p.graphicColor)&&['original','solid'].includes(p.graphicMode)&&['current','front','angle','side','backangle','back'].includes(p.camera)&&
 (p.graphic===null||typeof p.graphic==='string'&&/^[a-zA-Z\d-]{1,100}$/.test(p.graphic))&&typeof p.graphicName==='string'&&p.graphicName.length<=512;
}
export function presentationPhase(settings,elapsed,fallback){
 const list=settings.cycle?settings.order.filter(id=>settings.selected.includes(id)):[];
 if(!list.length)return {from:fallback,to:fallback,mix:0};
 if(list.length===1)return {from:list[0],to:list[0],mix:0};
 const span=settings.hold+settings.fade,index=Math.floor(elapsed/span)%list.length,phase=elapsed%span;
 const t=settings.fade?Math.max(0,(phase-settings.hold)/settings.fade):0;
 return {from:list[index],to:list[(index+1)%list.length],mix:t*t*(3-2*t)};
}

export function resetPresentationSection(settings,section){
 const fields={lighting:['cycle','order','selected','hold','fade'],background:['background','bg','graphic','graphicName','graphicMode','graphicColor','opacity','size','x','y'],motion:['camera','rotate','speed']}[section];
 if(!fields)throw new Error('Unknown presentation section');
 const defaults=defaultPresentation();return {...settings,...Object.fromEntries(fields.map(key=>[key,defaults[key]]))};
}
