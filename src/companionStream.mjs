// Parse actual server stages. A truncated stream never becomes a successful proposal.
export async function readCompanionStream(response,onEvent){
 if(!response.ok){let data;try{data=await response.json()}catch{}throw Error(data?.error||'API_UPSTREAM')}
 if(!response.body)throw Error('API_NETWORK');const reader=response.body.getReader(),decoder=new TextDecoder();let buffer='',completed=false,result=null,requestId=null,seq=0;
 const block=text=>{const lines=text.split('\n').filter(line=>line.startsWith('data: '));for(const line of lines){let event;try{event=JSON.parse(line.slice(6))}catch{throw Error('API_INVALID')}if(!event.requestId||!Number.isInteger(event.seq)||event.seq<=seq||(requestId&&event.requestId!==requestId))throw Error('API_INVALID');requestId=event.requestId;seq=event.seq;if(event.stage==='error')throw Error(event.code||'API_UPSTREAM');if(completed)throw Error('API_INVALID');onEvent(event);if(event.stage==='completed'){completed=true;result=event.result}}};
 try{while(true){const {done,value}=await reader.read();if(done)break;buffer+=decoder.decode(value,{stream:true}).replace(/\r\n/g,'\n');let end;while((end=buffer.indexOf('\n\n'))>=0){block(buffer.slice(0,end));buffer=buffer.slice(end+2)}}if(buffer.trim())block(buffer);if(!completed||!result)throw Error('API_NETWORK');return result;}finally{await reader.cancel().catch(()=>{});reader.releaseLock()}
}
