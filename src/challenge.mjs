import {CELL_METERS} from './layout.mjs';
import {staffWalkingMeters} from './layoutVisual.mjs';
export const CHALLENGE={config:{demand:92,stock:70,staff:1,price:500},seed:731,cups:56,meters:300};
export function challengeResult(run,time=7200){
 const eligible=run.seed===CHALLENGE.seed&&Object.entries(CHALLENGE.config).every(([k,v])=>run.config[k]===v);
 const meters=staffWalkingMeters(run,time),cups=run.events.filter(e=>e.status==='served'&&e.end<=time).length;
 return {eligible,complete:time>=7200,cups,meters,won:eligible&&time>=7200&&cups>=CHALLENGE.cups&&meters<=CHALLENGE.meters};
}
// A shorter morning must not be achieved by serving fewer customers.
export function improvesWalking(base,next){return next.sold>=base.sold&&staffWalkingMeters(next)<staffWalkingMeters(base)-1e-6;}
export function routeEvidence(run){return run.metrics.staffPaths.map(route=>({id:route.from+'-'+route.to,from:route.from,to:route.to,meters:(route.path.length-1)*CELL_METERS}));}
export function routeDifference(base,next){
 const before=routeEvidence(base),after=routeEvidence(next);
 return before.map(a=>({...a,after:after.find(b=>b.id===a.id).meters})).filter(a=>Math.abs(a.meters-a.after)>1e-6).sort((a,b)=>Math.abs(b.meters-b.after)-Math.abs(a.meters-a.after))[0]||null;
}
export function routeReplay(base,next,leg){
 const route=base.metrics.staffPaths.find(p=>p.from+'-'+p.to===leg);if(!route)return null;
 const equal=(a,b)=>a.x===b.x&&a.y===b.y;
 const find=run=>{const own=run.metrics.staffPaths.find(p=>p.from+'-'+p.to===leg);return run.staffTasks.find(t=>t.kind==='walk'&&equal(t.path[0],own.path[0])&&equal(t.path.at(-1),own.path.at(-1)))};
 const first=find(base),person=first?.customerId;if(!first)return null;
 const other=next.staffTasks.find(t=>t.kind==='walk'&&t.customerId===person&&(()=>{const own=next.metrics.staffPaths.find(p=>p.from+'-'+p.to===leg);return equal(t.path[0],own.path[0])&&equal(t.path.at(-1),own.path.at(-1))})());
 return {id:person,start:Math.max(0,Math.min(first.start,other?.start??first.start)-3),until:Math.min(7200,Math.max(first.end,other?.end??first.end)+10)};
}
export const apiMessages={
 en:{API_CHALLENGE:'The security check could not be verified. Please try again; manual rehearsal still works.',API_CLIENT_RATE:'Your security allowance is cooling down. Please try again later.',API_DAILY:'Today’s shared Muse allowance has been used. Manual rehearsal still works.',API_BUSY:'Another experiment is running. Please wait briefly.',API_CLOSED:'Muse access is closed. Manual rehearsal still works.',API_AUTH:'Reviewer access could not be verified.',API_UNAVAILABLE:'Muse is temporarily unavailable. Your layout is unchanged.',API_DUPLICATE:'This experiment ticket has already been used. Please start a new check.',LAYOUT_REQUEST:'The request could not be accepted. Use a listed preference, or a short reviewer instruction without control characters.',API_BUDGET:'The shared API call limit has been reached. Keep experimenting by hand; your layout is safe.',API_TIMEOUT:'Muse took too long. Your layout is safe; retry when you are ready.',API_UPSTREAM:'Meta could not complete the request. Your layout is safe.',API_RATE:'Please wait a moment before asking Muse again.',API_INVALID:'Muse returned an invalid proposal. It was not applied.',API_CONFIG:'Muse is not configured. You can continue by hand.',API_NETWORK:'Cannot reach the server. Your layout is safe.'},
 ja:{API_CHALLENGE:'アクセス確認ができませんでした。再試行してください。手動の配置は試せます。',API_CLIENT_RATE:'不正利用防止の待機時間です。時間を置いて再試行してください。',API_DAILY:'本日の共有利用枠に達しました。手動の配置は試せます。',API_BUSY:'別の実験が進行中です。少し待って再試行してください。',API_CLOSED:'Museの利用期間は終了しました。手動の配置は試せます。',API_AUTH:'審査者アクセスを確認できませんでした。',API_UNAVAILABLE:'Museを一時的に利用できません。配置は変更していません。',API_DUPLICATE:'この実験チケットは使用済みです。新しくアクセス確認してください。',LAYOUT_REQUEST:'入力を確認してください。選択肢、または制御文字のない短い審査者用相談を使えます。',API_BUDGET:'共有のAPI回数上限に達しました。配置は保持されています。手動で試せます。',API_TIMEOUT:'Museの応答が時間切れになりました。配置は保持されています。必要なら再試行してください。',API_UPSTREAM:'Meta側で処理を完了できませんでした。配置は保持されています。',API_RATE:'少し待ってからMuseに相談してください。',API_INVALID:'Museの案が検証を通らなかったため、適用していません。',API_CONFIG:'Museの接続設定を確認してください。手動操作は続けられます。',API_NETWORK:'サーバーへ接続できません。配置は保持されています。'}
};
export const describeApiError=(code,lang)=>apiMessages[lang]?.[code]||apiMessages[lang]?.API_INVALID;

export const goalWalkingLabel=meters=>meters>300&&meters<300.05?'>300.0':meters.toFixed(1);
