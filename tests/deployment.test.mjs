import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {spawnSync} from 'node:child_process';
import {createPersistentCallBudget,initializeBudget} from '../server/budget.mjs';
import {deploymentConfig,authenticated,allowedOrigin} from '../server/security.mjs';
function fixture(t){const dir=fs.mkdtempSync(path.join(os.tmpdir(),'moshimo-budget-'));t.after(()=>fs.rmSync(dir,{recursive:true,force:true}));return path.join(dir,'budget.json')}
const live={AI_MODE:'live',HOST:'0.0.0.0',PUBLIC_ORIGIN:'https://demo.example',MODEL_API_KEY:'test-not-a-key',META_BUDGET_FILE:'/state/budget.json',ACCESS_USER:'judge',ACCESS_PASSWORD:'test-only-long-password-123456'};
test('loopback defaults and public live fail-closed configuration',()=>{
 assert.equal(deploymentConfig({}).host,'127.0.0.1');assert.throws(()=>deploymentConfig({NODE_ENV:'production',AI_MODE:'live',HOST:'127.0.0.1',MODEL_API_KEY:'dummy',META_BUDGET_FILE:'/state/budget.json'}));assert.equal(deploymentConfig(live).publicLive,true);
 for(const field of ['PUBLIC_ORIGIN','MODEL_API_KEY','META_BUDGET_FILE','ACCESS_USER','ACCESS_PASSWORD'])assert.throws(()=>deploymentConfig({...live,[field]:''}));
 for(const value of ['http://demo.example','https://demo.example/','https://a:b@demo.example','https://demo.example/path'])assert.throws(()=>deploymentConfig({...live,PUBLIC_ORIGIN:value}));
 assert.throws(()=>deploymentConfig({...live,ACCESS_PASSWORD:'short'}));assert.throws(()=>deploymentConfig({...live,AI_MODE:'typo'}));
});
test('authentication and origin are independent, missing origin rejects public mutations',()=>{
 const config=deploymentConfig(live),req={headers:{origin:live.PUBLIC_ORIGIN}};
 assert.equal(authenticated(req,config),false);req.headers.authorization='Basic '+Buffer.from(live.ACCESS_USER+':'+live.ACCESS_PASSWORD).toString('base64');assert.equal(authenticated(req,config),true);assert.equal(allowedOrigin(req,config),true);
 req.headers.origin='https://evil.example';assert.equal(allowedOrigin(req,config),false);delete req.headers.origin;assert.equal(allowedOrigin(req,config),false);
 req.headers.authorization='Basic garbage';assert.equal(authenticated(req,config),false);
});
test('persistent allowance survives restart; only undispatched work is refunded',t=>{
 const f=fixture(t);initializeBudget(f,6);let b=createPersistentCallBudget(f,6),l=b.reserve(3);l.dispatch();l.close();assert.equal(b.status().remaining,5);b.release();b=createPersistentCallBudget(f,6);assert.equal(b.status().used,1);l=b.reserve(3);l.dispatch();l.close();b.release();assert.equal(JSON.parse(fs.readFileSync(f)).used,2);assert.throws(()=>initializeBudget(f,6));
});
test('reservation is durable before dispatch; crash conservatively consumes all reserved calls',t=>{
 const f=fixture(t);initializeBudget(f,3);const module=new URL('../server/budget.mjs',import.meta.url).href;
 const child=spawnSync(process.execPath,['--input-type=module','-e',`import {createPersistentCallBudget} from ${JSON.stringify(module)};createPersistentCallBudget(${JSON.stringify(f)},3).reserve(3);`]);assert.equal(child.status,0);
 assert.throws(()=>createPersistentCallBudget(f,3)); // stale lock never auto-cleared
 fs.rmdirSync(f+'.lock'); // operator recovery AFTER confirming child exited
 const b=createPersistentCallBudget(f,3);assert.equal(b.status().remaining,0);assert.throws(()=>b.reserve(1));b.release();
});
test('second process cannot acquire budget; missing/corrupt/mismatched state fails closed',t=>{
 const f=fixture(t);assert.throws(()=>createPersistentCallBudget(f,5));initializeBudget(f,5);const b=createPersistentCallBudget(f,5);assert.throws(()=>createPersistentCallBudget(f,5));b.release();assert.throws(()=>createPersistentCallBudget(f,6));fs.writeFileSync(f,'broken');assert.throws(()=>createPersistentCallBudget(f,5));
});
test('failed durable reserve poisons instance before any dispatch',t=>{
 const f=fixture(t);initializeBudget(f,3);const b=createPersistentCallBudget(f,3);fs.unlinkSync(f);fs.mkdirSync(f);assert.throws(()=>b.reserve(3),/API_BUDGET/);assert.throws(()=>b.reserve(1),/API_BUDGET/);b.release();
});

test('production HTTP routes enforce auth and origin before experiment dispatch',async t=>{
 const f=fixture(t);initializeBudget(f,6);
 const {spawn}=await import('node:child_process');
 const child=spawn(process.execPath,['server/index.mjs'],{cwd:new URL('..',import.meta.url),env:{PATH:process.env.PATH,NODE_ENV:'production',...live,HOST:'127.0.0.1',PORT:'0',META_BUDGET_FILE:f,META_MAX_CALLS:'6',META_MODEL:'muse-spark-1.3'},stdio:['ignore','pipe','pipe']});
 let errors='';child.stderr.on('data',d=>errors+=d);
 t.after(async()=>{if(child.exitCode===null){child.kill('SIGTERM');await new Promise(r=>child.once('exit',r))}});
 const port=await new Promise((resolve,reject)=>{const timer=setTimeout(()=>reject(Error('Server did not start')),5000);child.stdout.on('data',d=>{const match=String(d).match(/port (\d+)/);if(match){clearTimeout(timer);resolve(match[1])}});child.once('exit',()=>{clearTimeout(timer);reject(Error('Startup failed: '+errors))})});
 const url='http://127.0.0.1:'+port;assert.equal((await fetch(url+'/api/status')).status,401);
 const authorization='Basic '+Buffer.from(live.ACCESS_USER+':'+live.ACCESS_PASSWORD).toString('base64');
 assert.equal((await fetch(url+'/api/status',{headers:{authorization}})).status,200);
 assert.equal((await fetch(url+'/api/companion',{method:'POST',headers:{authorization},body:'{}'})).status,403);
 assert.equal((await fetch(url+'/api/companion',{method:'POST',headers:{authorization,origin:'https://evil.example'},body:'{}'})).status,403);
 assert.equal((await fetch(url+'/api/companion',{method:'POST',headers:{authorization,origin:live.PUBLIC_ORIGIN},body:'invalid json'})).status,400);
 assert.equal(JSON.parse(fs.readFileSync(f)).used,0);
});
