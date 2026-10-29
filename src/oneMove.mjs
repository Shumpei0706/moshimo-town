import {moveItem,validateLayoutPlan,layoutMetrics,FLOOR_WIDTH,FLOOR_HEIGHT} from './layout.mjs';
import {simulateLayout} from './layoutEngine.mjs';
import {improvesWalking,routeDifference} from './challenge.mjs';
export function changedItems(before,after){return after.items.filter(item=>{const old=before.items.find(x=>x.id===item.id);return !old||['x','y','rotation','type'].some(k=>item[k]!==old[k])});}
export function singleMove(layout,move,locks={brew:false}){
 if(!move||Object.keys(move).sort().join()!=='rotation,stationId,x,y')throw Error('API_INVALID');
 const next=moveItem(layout,move.stationId,move.x,move.y,move.rotation);validateLayoutPlan(next,{layout,locks});if(changedItems(layout,next).length!==1)throw Error('API_INVALID');return next;
}
export function placementsForStation(layout,stationId,locks,scope){
 if(locks.brew&&stationId==='brew')throw Error('LAYOUT_BREW_LOCKED');if(!layout.items.some(i=>i.id===stationId))throw Error('API_INVALID');
 const entries=[];for(let y=0;y<FLOOR_HEIGHT;y++)for(let x=0;x<FLOOR_WIDTH;x++)for(const rotation of [0,90,180,270]){try{const move={stationId,x,y,rotation},next=singleMove(layout,move,locks);entries.push({id:scope+':'+stationId+':'+x+':'+y+':'+rotation,move,layout:next,loopMeters:layoutMetrics(next).staffDistanceMeters})}catch{}}
 // Geometry-ranked shortlist, not sales predictions; Muse chooses which to actually simulate.
 return entries.sort((a,b)=>a.loopMeters-b.loopMeters||a.id.localeCompare(b.id)).slice(0,36);
}
export function evaluateMove(base,entry,config){const run=simulateLayout({layout:entry.layout,...config},base.seed);return {run,eligible:improvesWalking(base,run),route:routeDifference(base,run)};}
