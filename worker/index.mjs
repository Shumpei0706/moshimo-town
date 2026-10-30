import {DurableObject} from 'cloudflare:workers';
import {Anonymous} from './anonymous.mjs';
import {publicInput} from '../src/publicPresets.mjs';
import {Ledger} from './ledger.mjs';
import {configuration,routeAllowed,originAllowed,equal,readSmall,secure,json,scheduleCleanup} from './security.mjs';
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
 constructor(ctx,env){super(ctx,env);this.ledger=new Ledger(ctx.storage);this.running=null;this.anonymous=new Anonymous(env)}
 async alarm(){this.ledger.cleanup();await this.ctx.storage.sync();await this.ctx.storage.setAlarm(Date.now()+3600000)}
 async fetch(req){
 try{
 const c=configuration(this.env);if(!routeAllowed(req,c))return json({error:'API_ORIGIN'},403);
 const url=new URL(req.url),operator=url.pathname.startsWith('/operator/');
 if(operator&&!await equal(req.headers.get('authorization'),'Bearer '+this.env.OPERATOR_SECRET)){if(this.ledger.authBlocked())return json({error:'API_RATE'},429);this.ledger.failure();return json({error:'API_AUTH'},401)}
 if(operator){if(!originAllowed(req,c))return json({error:'API_ORIGIN'},403);if(req.method!=='POST')return json({error:'API_METHOD'},405);let result;
  if(url.pathname==='/operator/status')return json(this.ledger.status());
  if(url.pathname==='/operator/init'){if(!this.env.MODEL_API_KEY)return json({error:'API_CONFIG'},503);result=this.ledger.initialize(c.expiry)}
  else if(url.pathname==='/operator/disable'){this.ledger.disable();this.running?.abort();result=this.ledger.status()}
  else if(url.pathname==='/operator/recover'){result=this.ledger.recover()}
  else return json({error:'API_ROUTE'},404);
  await this.ctx.storage.sync();return json({...this.ledger.status()});
 }

 let reviewer=false;try{await this.anonymous.verify(this.anonymous.cookie(req,'__Host-moshimo-review'),'reviewer');reviewer=true}catch{}
 if(url.pathname==='/api/reviewer-login'){
 if(req.method!=='POST')return json({error:'API_METHOD'},405);if(!originAllowed(req,c))return json({error:'API_ORIGIN'},403);await this.anonymous.rate('login',req.headers.get('cf-connecting-ip')||'unknown',6);const body=await readSmall(req);if(!body||Object.keys(body).sort().join()!=='password,token,username'||typeof body.username!=='string'||typeof body.password!=='string'||body.username.length>100||body.password.length>200)return json({error:'API_AUTH'},401);await this.anonymous.issue(req,body.token,c);const goodUser=await equal(body.username,this.env.ACCESS_USER),goodPassword=await equal(body.password,this.env.ACCESS_PASSWORD);if(!this.env.ACCESS_USER||!this.env.ACCESS_PASSWORD||this.env.ACCESS_PASSWORD.length<24||!goodUser||!goodPassword)return json({error:'API_AUTH'},401);const cookie=await this.anonymous.sign({kind:'reviewer',sid:crypto.randomUUID(),exp:Date.now()+3600000});const response=json({reviewer:true});response.headers.set('Set-Cookie','__Host-moshimo-review='+cookie+'; Path=/; Max-Age=3600; HttpOnly; Secure; SameSite=Strict');return response;
 }
 if(url.pathname==='/api/status')return json({mode:'live',reviewer,publicDemo:true,siteKey:this.env.TURNSTILE_SITE_KEY||null,model:'muse-spark-1.3',...this.ledger.status(Date.now(),reviewer)});
 if(url.pathname==='/api/session'){
 if(req.method!=='POST')return json({error:'API_METHOD'},405);if(!originAllowed(req,c))return json({error:'API_ORIGIN'},403);if(Date.now()>=Math.min(c.expiry,this.ledger.state().expires||c.expiry))return json({error:'API_CLOSED'},403);
 const body=await readSmall(req);if(!body||Object.keys(body).length!==1||!Object.hasOwn(body,'token'))return json({error:'LAYOUT_REQUEST'},400);const issued=await this.anonymous.issue(req,body.token,c);const response=json({ticket:issued.ticket,requestId:issued.id});response.headers.set('Set-Cookie','__Host-moshimo='+issued.cookie+'; Path=/; Max-Age=3600; HttpOnly; Secure; SameSite=Strict');return response;
 }
 if(url.pathname==='/api/cancel'){
  if(req.method!=='POST')return json({error:'API_METHOD'},405);if(!originAllowed(req,c))return json({error:'API_ORIGIN'},403);
  const ticket=await this.anonymous.authorize(req,true),id=ticket.id;
  const active=this.ledger.cancel(id,ticket.exp);if(active)this.running?.abort();await this.ctx.storage.sync();await scheduleCleanup(this.ctx.storage);return json({cancelled:true});
 }
 if(url.pathname==='/api/companion'){
  if(req.method!=='POST')return json({error:'API_METHOD'},405);
  if(!originAllowed(req,c))return json({error:'API_ORIGIN'},403);
  if(!this.env.MODEL_API_KEY)return json({error:'API_CONFIG'},503);
  const ticket=await this.anonymous.authorize(req),id=ticket.id;
  let input;try{input=publicInput(await readSmall(req),reviewer);validateCompanionInput(input)}catch{return json({error:'LAYOUT_REQUEST'},400)}
  if(Date.now()>=c.expiry)throw Error('API_CLOSED');await this.anonymous.admit(req,ticket);this.ledger.reserve(id,Date.now(),ticket.exp,reviewer);await this.ctx.storage.sync();await scheduleCleanup(this.ctx.storage);
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
 }catch(e){const code=['API_CLIENT_RATE','API_CHALLENGE','API_CONFIG','LAYOUT_REQUEST','API_DAILY','API_DUPLICATE','API_BUSY','API_RATE','API_BUDGET','API_CLOSED','INIT_REJECTED','RECOVERY_REJECTED'].includes(e.message)?e.message:'API_UNAVAILABLE';return json({error:code,retryAfter:code==='API_CLIENT_RATE'?3600:code==='API_RATE'?15:code==='API_DAILY'?86400:15},['API_UNAVAILABLE','API_CONFIG'].includes(code)?503:code==='API_CHALLENGE'?403:code==='LAYOUT_REQUEST'?400:409)}
 }
}
