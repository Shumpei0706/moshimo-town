// Synthetic reproducible visitor arrivals; not observed demand.
export function customers(demand,seed=731){let s=seed>>>0;const rand=()=>{s=(1664525*s+1013904223)>>>0;return s/4294967296};return Array.from({length:demand},(_,i)=>({id:i+1,arrival:Math.round((rand()+rand())/2*7000),patience:90+Math.round(rand()*210)})).sort((a,b)=>a.arrival-b.arrival||a.id-b.id);}
