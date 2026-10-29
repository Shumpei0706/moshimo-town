import React,{useRef,useState} from 'react';
import {itemDimensions,accessPoint,moveItem,rotateItem,ENTRANCES,CELL_METERS} from './layout.mjs';
import {useI18n} from './i18n.jsx';

export const stationNames={en:{cash:'Register',brew:'Coffee machine',cups:'Cups',stock:'Ingredients',pickup:'Pickup'},ja:{cash:'レジ',brew:'抽出機',cups:'カップ',stock:'材料棚',pickup:'受取口'}};
export const layoutErrors={en:{LAYOUT_FORMAT:'This layout could not be read.',LAYOUT_ITEM:'Select one of the five stations.',LAYOUT_BOUNDS:'Keep the station inside the floor.',LAYOUT_OVERLAP:'These stations overlap. Try another square.',LAYOUT_ENTRANCE:'Keep the entrances clear.',LAYOUT_UNREACHABLE:'Leave a clear route to both sides of each service station.',LAYOUT_CONFIG:'Check the morning settings.'},ja:{LAYOUT_FORMAT:'配置を読み取れませんでした。',LAYOUT_ITEM:'5つの設備から選んでください。',LAYOUT_BOUNDS:'設備を床の内側に置いてください。',LAYOUT_OVERLAP:'設備が重なっています。別のマスへ移動してください。',LAYOUT_ENTRANCE:'入口と出口は空けてください。',LAYOUT_UNREACHABLE:'作業面と接客面へ通れる経路を残してください。',LAYOUT_CONFIG:'営業条件を確認してください。'}};
export function describeLayoutError(error,lang){return layoutErrors[lang]?.[error?.message||error]||(lang==='ja'?'この配置は使えません。':'This arrangement is not available.');}
const colors={cash:'#7e9b8c',brew:'#d87845',cups:'#c5a16e',stock:'#97a97c',pickup:'#587e78'};

export default function LayoutEditor({proposal=null,highlightLeg=null,layout,onChange,onPreview,selected='brew',onSelect,metrics,showPaths=true,pathMode='staff',onError}){
  const {lang}=useI18n(),names=stationNames[lang],svg=useRef(null),drag=useRef(null);
  const [ghost,setGhost]=useState(null),[invalid,setInvalid]=useState(false);
  const text=(en,ja)=>lang==='ja'?ja:en;
  const point=e=>{const p=svg.current.createSVGPoint();p.x=e.clientX;p.y=e.clientY;return p.matrixTransform(svg.current.getScreenCTM().inverse());};
  const apply=(candidate)=>{onError?.('');onPreview?.(null);onChange(candidate);};
  const attempt=fn=>{try{apply(fn());}catch(error){onError?.(describeLayoutError(error,lang));}};
  const start=(event,item)=>{if(event.button!==0)return;event.preventDefault();event.stopPropagation();onSelect(item.id);event.currentTarget.focus();onError?.('');const p=point(event);drag.current={id:item.id,source:layout,dx:p.x/60-item.x,dy:p.y/60-item.y,x:item.x,y:item.y};svg.current.setPointerCapture(event.pointerId);};
  const move=event=>{if(!drag.current)return;const p=point(event),d=drag.current,x=Math.round(p.x/60-d.dx),y=Math.round(p.y/60-d.dy);if(x===d.x&&y===d.y)return;d.x=x;d.y=y;const original=d.source.items.find(i=>i.id===d.id);setGhost({...original,x,y});try{const next=moveItem(d.source,d.id,x,y);setInvalid(false);onPreview?.(next);}catch{setInvalid(true);onPreview?.(null);}};
  const end=event=>{const d=drag.current;if(!d)return;drag.current=null;try{svg.current.releasePointerCapture(event.pointerId);}catch{}setGhost(null);setInvalid(false);onPreview?.(null);if(d.x!==d.source.items.find(i=>i.id===d.id).x||d.y!==d.source.items.find(i=>i.id===d.id).y)attempt(()=>moveItem(d.source,d.id,d.x,d.y));};
  const cancel=()=>{drag.current=null;setGhost(null);setInvalid(false);onPreview?.(null);};
  const key=(event,item)=>{const offsets={ArrowLeft:[-1,0],ArrowRight:[1,0],ArrowUp:[0,-1],ArrowDown:[0,1]};if(offsets[event.key]){event.preventDefault();onSelect(item.id);const[dx,dy]=offsets[event.key];attempt(()=>moveItem(layout,item.id,item.x+dx,item.y+dy));}else if(event.key.toLowerCase()==='r'){event.preventDefault();attempt(()=>rotateItem(layout,item.id));}else if(event.key==='Escape')cancel();};
  const floorWidth=layout.width*60,floorHeight=layout.height*60;
  const active=layout.items.find(i=>i.id===selected);
  return <div className="mt-editor" data-testid="layout-editor">
    <div className="mt-editor-heading"><div><h2>{text('Your floor plan','お店の配置図')}</h2><p>{text('Drag a station. Watch your shop take shape.','設備を動かすと、お店に反映されます。')}</p></div><span className="mt-scale">{layout.width*CELL_METERS} × {layout.height*CELL_METERS} m</span></div>
    <div className="mt-grid-wrap">
      <svg ref={svg} viewBox={`-10 -27 ${floorWidth+20} ${floorHeight+57}`} role="group" aria-label={text('Editable floor plan. Select a station, use arrow keys to move, R to rotate.','編集できる配置図。設備を選び、矢印キーで移動、Rで回転。')} onPointerMove={move} onPointerUp={end} onPointerCancel={cancel} style={{touchAction:'none',display:'block',width:'100%'}}>
        <defs><pattern id="layout-grid" width="60" height="60" patternUnits="userSpaceOnUse"><path d="M60 0H0V60" fill="none" stroke="#cbd5c8" strokeWidth="1"/></pattern></defs>
        <rect width={floorWidth} height={floorHeight} rx="3" fill="#f1f0e6" stroke="#aabcb0" strokeWidth="2"/><rect width={floorWidth} height={floorHeight} fill="url(#layout-grid)"/>
        {showPaths&&(pathMode==='customer'?metrics?.customerPaths:metrics?.staffPaths)?.map((route,i)=><polyline key={i} points={route.path.map(p=>`${(p.x+.5)*60},${(p.y+.5)*60}`).join(' ')} fill="none" stroke={pathMode==='customer'?'#507d91':'#bb7648'} strokeWidth={highlightLeg===route.from+'-'+route.to?7:3} strokeDasharray="5 5" opacity={!highlightLeg||highlightLeg===route.from+'-'+route.to?.85:.13} pointerEvents="none"/>)}
        {Object.entries(ENTRANCES).map(([type,p])=><g key={type} pointerEvents="none"><rect x={p.x*60+8} y={p.y*60+8} width="44" height="44" rx="22" fill={type==='staff'?'#e9cfab':'#d8e6de'}/><path d={`M${p.x*60+20} ${p.y*60+30}h20m-7-7 7 7-7 7`} fill="none" stroke="#526f63" strokeWidth="2"/></g>)}
        <text x="3" y="-9" fill="#6b7f70" fontSize="12">{text('STAFF ENTRY','店員入口')}</text><text x="3" y={floorHeight+23} fill="#6b7f70" fontSize="12">{text('CUSTOMER ENTRY','お客さん入口')}</text><text x={floorWidth-3} y={floorHeight+23} textAnchor="end" fill="#6b7f70" fontSize="12">{text('EXIT','出口')}</text>
        {layout.items.map(item=>{const{width,height}=itemDimensions(item),a=accessPoint(item);return <g key={item.id} role="button" tabIndex="0" aria-label={`${names[item.type]}, ${item.x+1}, ${item.y+1}. ${text('Arrow keys move, R rotates.','矢印キーで移動、Rで回転。')}`} aria-pressed={selected===item.id} data-testid={`station-${item.id}`} onPointerDown={e=>start(e,item)} onFocus={()=>onSelect(item.id)} onKeyDown={e=>key(e,item)} onClick={()=>onSelect(item.id)} style={{cursor:'grab'}}>
          <rect x={item.x*60+3} y={item.y*60+3} width={width*60-6} height={height*60-6} rx="8" fill={colors[item.type]} stroke={selected===item.id?'#263f42':'#ffffff'} strokeWidth={selected===item.id?3:1}/>
          <text x={(item.x+width/2)*60} y={(item.y+height/2)*60+5} textAnchor="middle" fill={item.type==='pickup'?'#fff':'#1c3436'} fontSize={lang==='ja'?15:12} fontWeight="600" pointerEvents="none" transform={height>width?`rotate(-90 ${(item.x+width/2)*60} ${(item.y+height/2)*60})`:undefined}>{names[item.type]}</text>
          <circle cx={(a.x+.5)*60} cy={(a.y+.5)*60} r="5" fill={colors[item.type]} stroke="#f8f7ed" strokeWidth="2" pointerEvents="none"/>
        </g>})}
        {proposal&&<g pointerEvents="none" aria-label={text('Proposed station, not yet applied','未適用の設備案')}><rect x={proposal.x*60+3} y={proposal.y*60+3} width={itemDimensions(proposal).width*60-6} height={itemDimensions(proposal).height*60-6} rx="8" fill="#e1a56f" fillOpacity=".35" stroke="#a94725" strokeWidth="4" strokeDasharray="8 5"/><text x={(proposal.x+itemDimensions(proposal).width/2)*60} y={(proposal.y+itemDimensions(proposal).height/2)*60+5} textAnchor="middle" fill="#7d3219" fontSize="12" fontWeight="700">{text('TRY','提案')}</text></g>}
        {ghost&&<rect x={ghost.x*60+3} y={ghost.y*60+3} width={itemDimensions(ghost).width*60-6} height={itemDimensions(ghost).height*60-6} rx="8" fill={invalid?'#b9553c':'#4b7e6b'} fillOpacity=".35" stroke={invalid?'#9e3f2b':'#356453'} strokeWidth="3" strokeDasharray="6 4" pointerEvents="none"/>}
      </svg>
    </div>
    <div className="mt-station-controls"><strong>{active?names[active.type]:text('Select a station','設備を選択')}</strong><span>{text('Each square is 0.5 m','1マス 0.5 m')}</span><button type="button" disabled={!active} onClick={()=>attempt(()=>rotateItem(layout,selected))} aria-label={text('Rotate selected station','選択した設備を回転')}>↻ {text('Rotate','回転')}</button></div>
    <p className="mt-edit-hint">{text('Dots mark the working side. Keep entrances and access clear. Arrow keys move · R rotates.','丸印は作業側です。入口と作業側を空けて配置。矢印キーで移動・Rで回転。')}</p>
  </div>;
}
