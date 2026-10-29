import test from 'node:test';
import assert from 'node:assert/strict';
import {defaultLayout,goodLayout} from '../src/layout.mjs';
import {simulateLayout} from '../src/layoutEngine.mjs';
import {visitorAppearance,stationHeading,taskHeading,layoutActors,staffWalkingMeters} from '../src/layoutVisual.mjs';
const config={demand:92,stock:70,staff:2,price:500};
const near=(a,b)=>assert.ok(Math.abs(a-b)<1e-8,`${a} != ${b}`);

test('appearance varies across people and remains stable across paired mornings and seeks',()=>{
 const a=simulateLayout({layout:defaultLayout,...config}),b=simulateLayout({layout:goodLayout,...config});
 const profiles=a.events.map(person=>visitorAppearance(person.id,a.seed));
 for(const [key,min] of [['coat',6],['hairStyle',4],['skin',4],['height',5]])assert.ok(new Set(profiles.map(p=>p[key])).size>=min);
 for(const time of [2000,3800,5000,2000])for(const person of [...layoutActors(a,time).customers,...layoutActors(b,time).customers])assert.deepEqual(person.appearance,visitorAppearance(person.id,731));
});
test('walking faces the current path leg through corners, not the overall start-to-end diagonal',()=>{
 const task={kind:'walk',start:10,end:40,path:[{x:0,y:0},{x:1,y:0},{x:1,y:1},{x:0,y:1}]};
 near(taskHeading(task,15,defaultLayout),Math.PI/2);near(taskHeading(task,25,defaultLayout),0);near(taskHeading(task,35,defaultLayout),-Math.PI/2);near(taskHeading(task,40,defaultLayout),-Math.PI/2);
});
test('staff and waiting customers face opposite sides of the actual station in all four rotations',()=>{
 for(const rotation of [0,90,180,270]){
  const item={type:'cash',rotation},layout={items:[item]},task={kind:'wait',station:'cash',start:0,end:10,path:[{x:0,y:0}]};
  const a=taskHeading(task,3,layout),b=taskHeading(task,3,layout,true);
  near(Math.sin(a),Math.sin(stationHeading(item)));near(Math.cos(a),Math.cos(stationHeading(item)));
  near(Math.sin(a),-Math.sin(b));near(Math.cos(a),-Math.cos(b));
 }
});
test('real work logs drive equipment-facing staff and customer-facing waits without changing simulation',()=>{
 const run=simulateLayout({layout:defaultLayout,...config}),snapshot=JSON.stringify(run);
 for(const task of run.staffTasks.filter(t=>t.kind==='work').slice(0,25)){
  const actor=layoutActors(run,(task.start+task.end)/2).staff.find(p=>p.id===task.worker);
  assert.deepEqual(actor.position,task.path[0]);near(actor.yaw,stationHeading(run.layout.items.find(i=>i.type===task.station)));
 }
 for(const task of run.customerTasks.filter(t=>t.kind==='wait').slice(0,25)){
  const actor=layoutActors(run,(task.start+task.end)/2).customers.find(p=>p.id===task.customerId);
  near(actor.yaw,stationHeading(run.layout.items.find(i=>i.type===task.station),true));
 }
 assert.equal(JSON.stringify(run),snapshot);
});
test('cumulative staff walking counts only elapsed walk segments across workers, including partial paths',()=>{
 const run={staffTasks:[{kind:'walk',start:10,end:14,path:[{}, {}, {}, {}, {}]},{kind:'work',start:14,end:30,path:[{}]},{kind:'walk',start:11,end:15,path:[{}, {}, {}]}]};
 near(staffWalkingMeters(run,0),0);near(staffWalkingMeters(run,12),1.25);near(staffWalkingMeters(run,15),3);near(staffWalkingMeters(run),3);
 const actual=simulateLayout({layout:defaultLayout,...config});
 const total=actual.staffTasks.filter(t=>t.kind==='walk').reduce((s,t)=>s+(t.path.length-1)*.5,0);
 near(staffWalkingMeters(actual,Infinity),total);assert.ok(staffWalkingMeters(actual,3800)<staffWalkingMeters(actual,7200));
});
