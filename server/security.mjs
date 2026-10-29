import {timingSafeEqual,createHash} from 'node:crypto';
export function deploymentConfig(env=process.env){
 const host=env.HOST||'127.0.0.1',mode=env.AI_MODE||'mock',port=Number(env.PORT||4318);
 if(!['mock','live'].includes(mode)||!Number.isInteger(port)||port<0||port>65535)throw Error('Invalid server configuration');
 const publicLive=mode==='live'&&(env.NODE_ENV==='production'||!['127.0.0.1','::1','localhost'].includes(host)||Boolean(env.PUBLIC_ORIGIN));
 let origin=null;if(env.PUBLIC_ORIGIN){let u;try{u=new URL(env.PUBLIC_ORIGIN)}catch{throw Error('PUBLIC_ORIGIN must be an exact HTTPS origin')};if(u.protocol!=='https:'||u.origin!==env.PUBLIC_ORIGIN||u.username||u.password)throw Error('PUBLIC_ORIGIN must be an exact HTTPS origin');origin=u.origin}
 if(publicLive&&(!origin||!env.ACCESS_USER||env.ACCESS_USER.includes(':')||/[\r\n]/.test(env.ACCESS_USER)||!env.ACCESS_PASSWORD||env.ACCESS_PASSWORD.length<24))throw Error('Public live requires HTTPS PUBLIC_ORIGIN and strong server access credentials');
 if(mode==='live'&&(!env.MODEL_API_KEY||!env.META_BUDGET_FILE))throw Error('Live requires a server key and persistent budget file');
 return {host,port,mode,publicLive,origin,user:env.ACCESS_USER,password:env.ACCESS_PASSWORD};
}
const digest=s=>createHash('sha256').update(s).digest();
export function authenticated(req,config){if(!config.publicLive)return true;const expected='Basic '+Buffer.from(config.user+':'+config.password).toString('base64');return timingSafeEqual(digest(req.headers.authorization||''),digest(expected))}
export function allowedOrigin(req,config){const o=req.headers.origin;return config.publicLive?o===config.origin:!o||o===`http://localhost:${config.port}`||o===`http://127.0.0.1:${config.port}`||o===config.origin}
