import http from 'node:http';
import fs from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {randomUUID} from 'node:crypto';
import {companionExperiment,validateCompanionInput,MAX_COMPANION_CALLS} from './companion.mjs';
import {callLimit} from './config.mjs';
import {createCallBudget,createPersistentCallBudget} from './budget.mjs';
import {deploymentConfig,authenticated,allowedOrigin} from './security.mjs';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
if(process.env.NODE_ENV!=='production'){try{process.loadEnvFile(path.join(root,'.env'))}catch{}}
const config=deploymentConfig(),{port,mode,host}=config;
const prod=process.env.NODE_ENV==='production';
if(config.publicLive&&!prod)throw Error('Public live requires production mode');
const limit=callLimit(process.env.META_MAX_CALLS);
const budget=mode==='live'?createPersistentCallBudget(process.env.META_BUDGET_FILE,limit):createCallBudget(limit),recent=new Map();let usageWrites=Promise.resolve(),liveActive=false;
const vite=prod?null:await (await import('vite')).createServer({root,server:{middlewareMode:true},appType:'spa'});
const send=(res,status,data)=>{res.writeHead(status,{'Content-Type':'application/json','Cache-Control':'no-store'});res.end(JSON.stringify(data))};
const errorCode=e=>e.message?.startsWith('API_')||e.message?.startsWith('LAYOUT_')?e.message:'API_INVALID';
const server=http.createServer(async(req,res)=>{
 try{
  res.setHeader('X-Content-Type-Options','nosniff');
  if(!authenticated(req,config)){res.writeHead(401,{'WWW-Authenticate':'Basic realm="Moshimo Town", charset="UTF-8"','Cache-Control':'no-store'});return res.end('Authentication required')}
  if(req.url==='/api/status')return send(res,200,{mode,model:mode==='live'?'muse-spark-1.3':null,...budget.status()});
  if(req.url==='/api/companion'){
   if(req.method!=='POST')return send(res,405,{error:'API_METHOD'});
   if(!allowedOrigin(req,config))return send(res,403,{error:'API_ORIGIN'});
   const ip=req.socket.remoteAddress,now=Date.now();if(now-(recent.get(ip)||0)<1500)return send(res,429,{error:'API_RATE'});recent.set(ip,now);
   let body='';for await(const chunk of req){body+=chunk;if(Buffer.byteLength(body)>8192)return send(res,413,{error:'LAYOUT_REQUEST'})}
   let input;try{input=JSON.parse(body)}catch{return send(res,400,{error:'LAYOUT_REQUEST'})}
   try{validateCompanionInput(input)}catch(e){return send(res,400,{error:errorCode(e)})}
   let lease;try{if(mode==='live'){if(liveActive)return send(res,429,{error:'API_RATE'});lease=budget.reserve(MAX_COMPANION_CALLS);liveActive=true}}catch(e){return send(res,429,{error:'API_BUDGET'})}
    const requestId=randomUUID(),controller=new AbortController();let seq=0;res.on('close',()=>{if(!res.writableEnded)controller.abort()});
    res.writeHead(200,{'Content-Type':'text/event-stream','Cache-Control':'no-store','Connection':'keep-alive','X-Accel-Buffering':'no'});res.flushHeaders();
    const emit=event=>{seq=Math.max(seq,event.seq||0);if(!res.destroyed&&!res.writableEnded)res.write('data: '+JSON.stringify(event)+'\n\n')};
    const heartbeat=setInterval(()=>{if(!res.destroyed&&!res.writableEnded)res.write(': alive\n\n')},12000);
    const onCall=record=>{if(record.phase==='dispatched')lease?.dispatch();if(process.env.META_USAGE_LOG){usageWrites=usageWrites.then(()=>fs.appendFile(process.env.META_USAGE_LOG,JSON.stringify({at:new Date().toISOString(),...record})+'\n')).catch(()=>{console.error('Usage record could not be saved')})}};
    try{await companionExperiment(input,{mode,key:process.env.MODEL_API_KEY,model:process.env.META_MODEL||'muse-spark-1.3',requestId,signal:controller.signal,onEvent:emit,onCall})}catch(e){if(!controller.signal.aborted)emit({requestId,seq:seq+1,stage:'error',code:errorCode(e)})}finally{clearInterval(heartbeat);try{lease?.close()}finally{if(mode==='live')liveActive=false;if(!res.destroyed)res.end()}}
    return;
  }
  if(req.url?.startsWith('/api/'))return send(res,404,{error:'API_ROUTE'});
  if(vite)return vite.middlewares(req,res);
  const pathname=decodeURIComponent(new URL(req.url,'http://localhost').pathname);let file=path.resolve(root,'dist','.'+pathname);if(!file.startsWith(path.join(root,'dist')+path.sep))file=path.join(root,'dist','index.html');
  try{if((await fs.stat(file)).isDirectory())file=path.join(file,'index.html');const data=await fs.readFile(file);res.setHeader('Content-Type',({'.js':'text/javascript','.css':'text/css','.png':'image/png','.webp':'image/webp','.jpg':'image/jpeg','.jpeg':'image/jpeg','.svg':'image/svg+xml','.json':'application/json','.woff2':'font/woff2','.html':'text/html'})[path.extname(file)]||'application/octet-stream');res.end(data)}catch{res.setHeader('Content-Type','text/html');res.end(await fs.readFile(path.join(root,'dist/index.html')))}
 }catch{if(!res.headersSent)send(res,500,{error:'API_INVALID'});else if(!res.destroyed)res.end()}
});
server.listen(port,host,()=>console.log(`Moshimo Town server listening on port ${server.address().port}; mode=${mode}`));
for(const signal of ['SIGTERM','SIGINT'])process.once(signal,()=>{server.close(()=>{budget.release?.();process.exit(0)})});
