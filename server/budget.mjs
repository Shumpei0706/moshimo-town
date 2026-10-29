export function createCallBudget(limit){let used=0,reserved=0;return {status:()=>({limit,used,reserved,remaining:Math.max(0,limit-used-reserved)}),reserve(max){if(!Number.isSafeInteger(max)||max<0||used+reserved+max>limit)throw Error('API_BUDGET');reserved+=max;let pending=max,closed=false;return {dispatch(){if(closed||pending<=0)throw Error('API_BUDGET');pending--;reserved--;used++},close(){if(!closed){reserved-=pending;pending=0;closed=true}}}}};}

// A local persistent volume and one server process are required. Never auto-unlock.
import fs from 'node:fs';
import path from 'node:path';
import {randomUUID} from 'node:crypto';
export function initializeBudget(file,limit){
 if(!path.isAbsolute(file)||!Number.isSafeInteger(limit)||limit<0||limit>100)throw Error('Invalid budget initialization');
 const fd=fs.openSync(file,'wx',0o600);try{fs.writeFileSync(fd,JSON.stringify({version:1,limit,used:0})+'\n');fs.fsyncSync(fd)}finally{fs.closeSync(fd)}
 const dir=fs.openSync(path.dirname(file),'r');try{fs.fsyncSync(dir)}finally{fs.closeSync(dir)}
}
export function createPersistentCallBudget(file,limit){
 if(!path.isAbsolute(file))throw Error('Budget path must be absolute');
 const lock=file+'.lock';fs.mkdirSync(lock,{mode:0o700});let state,poisoned=false,reserved=0,released=false;
 try{state=JSON.parse(fs.readFileSync(file,'utf8'));if(state.version!==1||state.limit!==limit||!Number.isSafeInteger(state.used)||state.used<0||state.used>limit)throw Error('Invalid budget state')}catch{fs.rmdirSync(lock);throw Error('Budget state missing, corrupt or limit mismatched')}
 function save(next){if(poisoned||released)throw Error('API_BUDGET');const temp=file+'.'+randomUUID()+'.tmp';let fd;try{fd=fs.openSync(temp,'wx',0o600);fs.writeFileSync(fd,JSON.stringify(next)+'\n');fs.fsyncSync(fd);fs.closeSync(fd);fd=undefined;fs.renameSync(temp,file);const dir=fs.openSync(path.dirname(file),'r');try{fs.fsyncSync(dir)}finally{fs.closeSync(dir)}state=next}catch{poisoned=true;if(fd!==undefined)fs.closeSync(fd);throw Error('API_BUDGET')}}
 return {status:()=>({limit,used:state.used-reserved,reserved,remaining:Math.max(0,limit-state.used)}),reserve(max){
  if(poisoned||released||!Number.isSafeInteger(max)||max<1||state.used+max>limit)throw Error('API_BUDGET');
  save({...state,used:state.used+max});reserved+=max;let pending=max,closed=false;
  return {dispatch(){if(poisoned||released||closed||pending<1)throw Error('API_BUDGET');pending--;reserved--},close(){if(closed)return;closed=true;if(pending){const refund=pending;save({...state,used:state.used-refund});reserved-=refund;pending=0}}};
 },release(){if(!released){released=true;fs.rmdirSync(lock)}}};
}
