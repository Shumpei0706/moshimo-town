import {DurableObject} from 'cloudflare:workers';
import {Ledger} from './ledger.mjs';
import {configuration,routeAllowed,originAllowed,equal,readSmall,secure,json} from './security.mjs';
import {companionExperiment,validateCompanionInput} from '../server/companion.mjs';
const FIXED_ID='moshimo-review-global-v1';
export default {async fetch(req,env){
 try{const c=configuration(env);if(!routeAllowed(req,c))return secure(json({error:'API_ORIGIN'},403));
 const stub=env.REVIEW_GATE.get(env.REVIEW_GATE.idFromName(FIXED_ID));
 const response=await stub.fetch(req);
 if(response.status===204&&response.headers.get('x-review-asset')==='allowed')return secure(await env.ASSETS.fetch(req));
 return secure(response);
 }catch{return secure(json({error:'API_UNAVAILABLE'},503))}
}};
export class ReviewGate extends DurableObject {
 constructor(ctx,env){super(ctx,env);this.ledger=new Ledger(ctx.storage);this.running=null}
 async fetch(req){
 try{
 const c=configuration(this.env);if(!routeAllowed(req,c))return json({error:'API_ORIGIN'},403);
 const url=new URL(req.url),operator=url.pathname.startsWith('/operator/');
 const expected=operator?'Bearer '+this.env.OPERATOR_SECRET:'Basic '+btoa(this.env.ACCESS_USER+':'+this.env.ACCESS_PASSWORD);
 if(!await equal(req.headers.get('authorization'),expected)){if(this.ledger.authBlocked())return json({error:'API_RATE'},429);this.ledger.failure();return new Response('Authentication required',{status:401,headers:operator?{}:{'WWW-Authenticate':'Basic realm="Moshimo review", charset="UTF-8"'}})}
 if(operator){if(!originAllowed(req,c))return json({error:'API_ORIGIN'},403);if(req.method!=='POST')return json({error:'API_METHOD'},405);let result;
  if(url.pathname==='/operator/status')return json(this.ledger.status());
  if(url.pathname==='/operator/init'){if(!this.env.MODEL_API_KEY)return json({error:'API_CONFIG'},503);result=this.ledger.initialize(c.expiry)}
  else if(url.pathname==='/operator/disable'){this.ledger.disable();this.running?.abort();result=this.ledger.status()}
  else if(url.pathname==='/operator/recover'){result=this.ledger.recover()}
  else return json({error:'API_ROUTE'},404);
  await this.ctx.storage.sync();return json({...this.ledger.status()});
 }
 if(Date.now()>=Math.min(c.expiry,this.ledger.state().expires||c.expiry))return json({error:'API_CLOSED'},403);
 if(url.pathname==='/api/status')return json({mode:'live',model:'muse-spark-1.3',...this.ledger.status()});
 if(url.pathname==='/api/cancel'){
  if(req.method!=='POST')return json({error:'API_METHOD'},405);if(!originAllowed(req,c))return json({error:'API_ORIGIN'},403);
  const id=req.headers.get('x-request-id');if(!/^[a-f0-9-]{36}$/.test(id||''))return json({error:'LAYOUT_REQUEST'},400);
  const active=this.ledger.cancel(id);if(active)this.running?.abort();await this.ctx.storage.sync();return json({cancelled:true});
 }
 if(url.pathname==='/api/companion'){
  if(req.method!=='POST')return json({error:'API_METHOD'},405);
  if(!originAllowed(req,c))return json({error:'API_ORIGIN'},403);
  if(!this.env.MODEL_API_KEY)return json({error:'API_CONFIG'},503);
  const id=req.headers.get('x-request-id');if(!/^[a-f0-9-]{36}$/.test(id||''))return json({error:'LAYOUT_REQUEST'},400);
  let input;try{input=await readSmall(req);validateCompanionInput(input)}catch{return json({error:'LAYOUT_REQUEST'},400)}
  this.ledger.reserve(id);await this.ctx.storage.sync();
  const abort=new AbortController();this.running=abort;const timer=setTimeout(()=>abort.abort(),90000);let seq=0,finished=false;
  const encoder=new TextEncoder(),stream=new TransformStream(),writer=stream.writable.getWriter();let output=Promise.resolve();
  writer.closed.catch(()=>abort.abort());abort.signal.addEventListener('abort',()=>{writer.close().catch(()=>{})},{once:true});req.signal.addEventListener('abort',()=>abort.abort(),{once:true});
  const emit=e=>{seq=Math.max(seq,e.seq||0);if(abort.signal.aborted)return;output=output.then(()=>writer.write(encoder.encode('data: '+JSON.stringify(e)+'\n\n')));output.catch(()=>abort.abort())};
  const work=async()=>{try{await companionExperiment(input,{mode:'live',key:this.env.MODEL_API_KEY,model:'muse-spark-1.3',requestId:id,signal:abort.signal,onEvent:emit,onCall:async record=>{if(record.phase==='dispatched'){await output;if(abort.signal.aborted)throw Error('API_CANCELLED');this.ledger.dispatch(id);await this.ctx.storage.sync();if(abort.signal.aborted)throw Error('API_CANCELLED')}}});finished=true}catch{emit({requestId:id,seq:seq+1,stage:'error',code:abort.signal.aborted?'API_CANCELLED':'API_UPSTREAM'})}finally{clearTimeout(timer);if(this.running===abort)this.running=null;this.ledger.finish(id,finished?'completed':'unknown');await this.ctx.storage.sync();try{await output;await writer.close()}catch{}}};
  this.ctx.waitUntil(work());return new Response(stream.readable,{headers:{'Content-Type':'text/event-stream','Cache-Control':'no-store'}});
 }
 if(url.pathname.startsWith('/api/')||url.pathname.startsWith('/operator'))return json({error:'API_ROUTE'},404);
 if(!['GET','HEAD'].includes(req.method))return json({error:'API_METHOD'},405);
 return new Response(null,{status:204,headers:{'x-review-asset':'allowed'}});
 }catch(e){const code=['API_DUPLICATE','API_BUSY','API_RATE','API_BUDGET','API_CLOSED','INIT_REJECTED','RECOVERY_REJECTED'].includes(e.message)?e.message:'API_UNAVAILABLE';return json({error:code},code==='API_UNAVAILABLE'?503:409)}
 }
}
