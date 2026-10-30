export function configuration(env){
 let url;try{url=new URL(env.PUBLIC_ORIGIN)}catch{throw Error('CONFIG')}
 if(url.protocol!=='https:'||url.origin!==env.PUBLIC_ORIGIN||url.username||url.password)throw Error('CONFIG');
 const expiry=Date.parse(env.REVIEW_EXPIRES_AT);if(!Number.isFinite(expiry))throw Error('CONFIG');
 if(!env.OPERATOR_SECRET||env.OPERATOR_SECRET.length<32)throw Error('CONFIG');
 return {origin:url.origin,host:url.host,expiry};
}
export function routeAllowed(req,c){const u=new URL(req.url);return u.origin===c.origin&&u.protocol==='https:'&&req.headers.get('host')===c.host}
export function originAllowed(req,c){return req.headers.get('origin')===c.origin}
export async function equal(a,b){const encode=s=>new TextEncoder().encode(s);const [x,y]=await Promise.all([crypto.subtle.digest('SHA-256',encode(a||'')),crypto.subtle.digest('SHA-256',encode(b||''))]);const aa=new Uint8Array(x),bb=new Uint8Array(y);let diff=0;for(let i=0;i<32;i++)diff|=aa[i]^bb[i];return diff===0}
export async function readSmall(req){const reader=req.body?.getReader();if(!reader)throw Error('LAYOUT_REQUEST');let size=0,parts=[];let timer;const timeout=new Promise((_,reject)=>{timer=setTimeout(()=>{reader.cancel().catch(()=>{});reject(Error('LAYOUT_REQUEST'))},10000)});try{while(true){const {done,value}=await Promise.race([reader.read(),timeout]);if(done)break;size+=value.byteLength;if(size>8192)throw Error('LAYOUT_REQUEST');parts.push(value)}const all=new Uint8Array(size);let at=0;for(const x of parts){all.set(x,at);at+=x.length}return JSON.parse(new TextDecoder('utf-8',{fatal:true}).decode(all))}finally{clearTimeout(timer);reader.cancel().catch(()=>{})}}
export function secure(response){const r=new Response(response.body,response);r.headers.set('Cache-Control','no-store');r.headers.set('X-Content-Type-Options','nosniff');r.headers.set('Referrer-Policy','no-referrer');r.headers.set('X-Frame-Options','DENY');r.headers.set('Strict-Transport-Security','max-age=31536000');r.headers.set('Content-Security-Policy',"default-src 'self'; script-src 'self' https://challenges.cloudflare.com; style-src 'self' 'unsafe-inline'; font-src 'self'; frame-src https://challenges.cloudflare.com; img-src 'self' data: blob:; connect-src 'self' https://challenges.cloudflare.com; worker-src 'self' blob:; object-src 'none'; base-uri 'none'; frame-ancestors 'none'; form-action 'self'");return r}
export const json=(data,status=200)=>new Response(JSON.stringify(data),{status,headers:{'Content-Type':'application/json'}});

export async function scheduleCleanup(storage,now=Date.now()){if(await storage.getAlarm()===null)await storage.setAlarm(now+3600000)}
