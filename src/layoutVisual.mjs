import {CELL_METERS,ENTRANCES} from './layout.mjs';
import {taskPosition} from './layoutEngine.mjs';

const coats=['#668a91','#c48a50','#9c6c77','#7e915f','#586b8a','#c4b698','#8c7395','#bd7255'];
const trousers=['#394d60','#74614f','#526b65','#5e5364'];
const skins=['#e5b897','#c7916f','#9f6a4e','#f0cfb1','#784b36'];
const hair=['#343b3d','#67503e','#b47c4a','#ded4bd','#51453e'];
function hash(value){let n=value>>>0;n=Math.imul(n^(n>>>16),0x7feb352d);n=Math.imul(n^(n>>>15),0x846ca68b);return(n^(n>>>16))>>>0;}
// Appearance never depends on layout, time, arrival order or service outcome.
export function visitorAppearance(id,seed=731){
 const n=hash(Math.imul(id,2654435761)^seed),m=hash(n+17);
 return {coat:coats[n%coats.length],pants:trousers[(n>>>4)%trousers.length],skin:skins[(n>>>8)%skins.length],hair:hair[(n>>>12)%hair.length],hairStyle:['short','bob','bun','curly'][(n>>>16)%4],outfit:['jacket','sweater','shirt','coat'][(n>>>20)%4],hat:m%7===0,glasses:m%5===0,bag:m%3===0,height:1.55+(m%7)*.045,width:.88+((m>>>8)%5)*.055};
}
export function stationHeading(item,customer=false){return -(item.rotation+(customer?180:0))*Math.PI/180;}
export function taskHeading(task,time,layout,customer=false){
 if(task.path.length>1&&(task.kind==='walk'||task.kind==='exit')){
  const progress=Math.max(0,Math.min(1,(time-task.start)/Math.max(.001,task.end-task.start)));
  const i=Math.min(task.path.length-2,Math.floor(progress*(task.path.length-1)));
  const a=task.path[i],b=task.path[i+1];
  return Math.atan2(b.x-a.x,b.y-a.y);
 }
 const item=layout.items.find(item=>item.type===task.station);
 return item?stationHeading(item,customer):0;
}
export function layoutActors(run,time){
 const cash=run.layout.items.find(item=>item.type==='cash');
 const staff=Array.from({length:run.config.staff},(_,id)=>{
  const tasks=run.staffTasks.filter(task=>task.worker===id),active=tasks.find(task=>time>=task.start&&time<task.end),previous=tasks.filter(task=>task.end<=time).at(-1);
  return {id,position:active?taskPosition(active,time):previous?.path.at(-1)||ENTRANCES.staff,active,walking:active?.kind==='walk',yaw:active?taskHeading(active,time,run.layout):stationHeading(cash),time};
 });
 const customers=run.events.map(event=>{
  const task=run.customerTasks.find(task=>task.customerId===event.id&&time>=task.start&&time<task.end);
  return task?{id:event.id,position:taskPosition(task,time),walking:task.kind==='walk'||task.kind==='exit',yaw:taskHeading(task,time,run.layout,true),time,cup:event.status==='served'&&time>=event.end,appearance:visitorAppearance(event.id,run.seed)}:null;
 }).filter(Boolean);
 return {staff,customers};
}
export function staffWalkingMeters(run,time=7200){
 return run.staffTasks.filter(task=>task.kind==='walk').reduce((total,task)=>{
  const fraction=Math.max(0,Math.min(1,(time-task.start)/Math.max(.001,task.end-task.start)));
  return total+(task.path.length-1)*CELL_METERS*fraction;
 },0);
}
