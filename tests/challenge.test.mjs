import test from 'node:test';
import assert from 'node:assert/strict';
import {CHALLENGE,challengeResult,improvesWalking,routeEvidence,routeDifference,routeReplay,describeApiError} from '../src/challenge.mjs';
import {defaultLayout,goodLayout,moveItem} from '../src/layout.mjs';
import {simulateLayout} from '../src/layoutEngine.mjs';
import {staffWalkingMeters} from '../src/layoutVisual.mjs';
const base=simulateLayout({layout:defaultLayout,...CHALLENGE.config}),good=simulateLayout({layout:goodLayout,...CHALLENGE.config});
const reply=value=>({ok:true,json:async()=>({choices:[{message:{content:JSON.stringify(value)}}]})});
test('challenge requires both closing goals and its fixed context, never partial progress',()=>{
 assert.equal(challengeResult(base).won,false);assert.equal(challengeResult(good).won,true);assert.equal(challengeResult(good,100).won,false);
 assert.equal(challengeResult({...good,seed:732}).eligible,false);assert.equal(challengeResult({...good,config:{...good.config,price:1000}}).won,false);
 assert.equal(challengeResult({...good,events:good.events.slice(0,55).map(e=>({...e,status:'served',end:1}))}).won,false);
 // Boundary values must use the unrounded aggregate of actual walking tasks.
 const boundary={...good,events:Array.from({length:56},()=>({status:'served',end:7200})),staffTasks:[{kind:'walk',start:0,end:7200,path:Array.from({length:601})}]};
 assert.equal(challengeResult(boundary).won,true);boundary.staffTasks.push({kind:'walk',start:7199,end:7201,path:[{},{}]});assert.equal(challengeResult(boundary).won,false);
});
test('recommendations cannot save walking by dropping customers, or worsen a compact baseline',()=>{
 const worse=simulateLayout({layout:moveItem(defaultLayout,'cups',3,1),...CHALLENGE.config});assert.equal(worse.sold,55);assert.ok(staffWalkingMeters(worse)>staffWalkingMeters(base));assert.equal(improvesWalking(base,worse),false);assert.equal(improvesWalking(base,good),true);assert.equal(improvesWalking(good,base),false);assert.equal(improvesWalking(base,base),false);assert.equal(improvesWalking(base,{...good,sold:55}),false);
});
test('route difference replay seeks actual paired task logs for the same person',()=>{
 const leg=routeDifference(base,good),replay=routeReplay(base,good,leg.id);assert.ok(leg.meters>leg.after);assert.ok(replay.until>replay.start);assert.ok(base.staffTasks.some(t=>t.kind==='walk'&&t.customerId===replay.id&&t.start>=replay.start&&t.end<=replay.until));assert.ok(good.events.some(e=>e.id===replay.id));
});
test('worsening routes highlight an actual changed leg, and unchanged routes have no story',()=>{
 const worse=simulateLayout({layout:moveItem(defaultLayout,'brew',6,1),...CHALLENGE.config});const diff=routeDifference(base,worse);assert.notEqual(diff.meters,diff.after);assert.ok(diff.after>diff.meters);assert.equal(routeDifference(base,base),null);
});