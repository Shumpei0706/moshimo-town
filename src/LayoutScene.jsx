import React,{Component,useMemo,useEffect,useRef} from 'react';
import {Canvas,useThree,useFrame} from '@react-three/fiber';
import {RoundedBox,Billboard,Line} from '@react-three/drei';
import * as THREE from 'three';
import {itemDimensions,itemCells,accessPoint,CELL_METERS,ENTRANCES} from './layout.mjs';
import {layoutActors} from './layoutVisual.mjs';
import {useI18n} from './i18n.jsx';
const palette={cash:'#7e9b8c',brew:'#d87845',cups:'#c5a16e',stock:'#97a97c',pickup:'#587e78'};
const names={en:{cash:'Order',brew:'Brew',cups:'Cups',stock:'Stock',pickup:'Pickup'},ja:{cash:'注文',brew:'抽出',cups:'カップ',stock:'材料',pickup:'受取'}};
const world=p=>[(p.x+.5)*CELL_METERS,(p.y+.5)*CELL_METERS];
function Block({position,size,color,radius=.035,...props}){return <RoundedBox position={position} args={size} radius={radius} smoothness={2} castShadow receiveShadow {...props}><meshStandardMaterial color={color} roughness={.85}/></RoundedBox>}
function Cup({position}){return <group position={position}><mesh castShadow><cylinderGeometry args={[.055,.042,.11,12]}/><meshStandardMaterial color="#f5e7c8"/></mesh><mesh position={[0,.052,0]}><cylinderGeometry args={[.053,.053,.012,12]}/><meshStandardMaterial color="#5f4333"/></mesh></group>}
function Tag({text,at,width=.6,background='#faf9ef',color='#37554b'}){
 const texture=useMemo(()=>{const canvas=document.createElement('canvas');canvas.width=512;canvas.height=112;const ctx=canvas.getContext('2d');ctx.fillStyle=background;ctx.fillRect(0,0,512,112);ctx.fillStyle=color;ctx.font='500 58px "Noto Sans JP", sans-serif';ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillText(text,256,58,480);const map=new THREE.CanvasTexture(canvas);map.colorSpace=THREE.SRGBColorSpace;return map},[text,background,color]);
 useEffect(()=>()=>texture.dispose(),[texture]);
 return <Billboard position={at}><mesh renderOrder={5}><planeGeometry args={[width,.15]}/><meshBasicMaterial map={texture} transparent depthTest={false} toneMapped={false}/></mesh></Billboard>;
}
function Device({item,selected,onSelect,label}){const dims=itemDimensions(item),w=dims.width*.5,d=dims.height*.5,x=item.x*.5+w/2,z=item.y*.5+d/2;const rotated=item.rotation%180!==0;return <group position={[x,0,z]} onClick={e=>{e.stopPropagation();onSelect?.(item.id)}}><Block position={[0,.32,0]} size={[w-.025,.64,d-.025]} color={selected?'#e49a64':palette[item.type]}/><Block position={[0,.66,0]} size={[w,.065,d]} color="#eddfc5"/><Block position={[0,.08,0]} size={[w-.09,.09,d-.06]} color="#66776e"/>{item.type==='brew'?<group rotation={[0,Math.PI-item.rotation*Math.PI/180,0]}><Block position={[0,.86,-.02]} size={[.62,.35,.28]} color="#aebbb5"/><Block position={[0,.85,.13]} size={[.55,.19,.025]} color="#4d6468"/>{[-.16,.16].map(a=><group key={a}><Block position={[a,.76,.17]} size={[.04,.045,.15]} color="#425757"/><Cup position={[a,.71,.18]}/></group>)}<mesh position={[.36,.87,0]} castShadow><cylinderGeometry args={[.08,.06,.37,12]}/><meshStandardMaterial color="#4f6562"/></mesh></group>:item.type==='cash'?<><Block position={[0,.81,0]} size={[.27,.23,.055]} color="#38545b" rotation={[-.2,-item.rotation*Math.PI/180,0]}/><Block position={[0,.7,.02]} size={[.21,.045,.17]} color="#768e86"/><Block position={[.25,.72,0]} size={[.16,.055,.13]} color="#ba8654"/></>:item.type==='stock'?<>{[-.2,.12].map(a=><Block key={a} position={[rotated?0:a,.81,rotated?a:0]} size={[.23,.25,.2]} color="#c3a06c"/>)}<Block position={[0,.97,0]} size={[.27,.08,.2]} color="#8fa376"/></>:item.type==='cups'?<>{[-.22,0,.22].map(a=><group key={a}>{[0,1,2].map(i=><Cup key={i} position={[rotated?0:a,.75+i*.045,rotated?a:0]}/>)}</group>)}</>:<><Block position={[0,.71,0]} size={[w*.75,.035,d*.6]} color="#54766b"/><Cup position={[0,.78,0]}/></>}<Tag text={label} at={[0,1.27,0]} width={.34+label.length*.045}/></group>}
function MovingDevice({item,fromItem,...props}){const ref=useRef(),invalidate=useThree(s=>s.invalidate),reduced=window.matchMedia('(prefers-reduced-motion: reduce)').matches;const offset=useRef(fromItem&&!reduced?[(fromItem.x-item.x)*CELL_METERS,0,(fromItem.y-item.y)*CELL_METERS]:[0,0,0]);useEffect(()=>{invalidate()},[invalidate]);useFrame((state,dt)=>{if(!ref.current||ref.current.position.length()<.001)return;ref.current.position.multiplyScalar(Math.exp(-dt*8));invalidate()});return <group ref={ref} position={offset.current}><Device item={item} {...props}/></group>}
function Proposal({item,lang}){const dims=itemDimensions(item),width=dims.width*CELL_METERS,depth=dims.height*CELL_METERS;return <group position={[item.x*CELL_METERS+width/2,0,item.y*CELL_METERS+depth/2]}><RoundedBox args={[width-.02,.7,depth-.02]} position={[0,.35,0]} radius={.03}><meshStandardMaterial color="#d98952" transparent opacity={.3} depthWrite={false}/></RoundedBox><lineSegments position={[0,.35,0]}><edgesGeometry args={[new THREE.BoxGeometry(width,.7,depth)]}/><lineBasicMaterial color="#a94725"/></lineSegments><Tag text={lang==='ja'?'提案':'TRY'} at={[0,1.05,0]} background="#a94725" color="#fff"/></group>}
function Person({position,staff=false,selected=false,count=1,label,cup=false,walking=false,yaw=0,time=0,appearance}){
 const [x,z]=world(position),swing=walking?Math.sin(time*3)*.32:0;
 const look=appearance||{coat:'#d77945',pants:'#40535b',skin:'#e3b58e',hair:'#42575a',hairStyle:'short',outfit:'shirt',height:1.75,width:1};
 const face='#273e42',coat=look.coat;
 return <group position={[x,.045,z]} rotation={[0,yaw,0]}>
  <group scale={[look.height*look.width,look.height,look.height*look.width]}>
   {[-1,1].map(side=><group key={side}><mesh position={[side*.075,.19,0]} rotation={[side*swing,0,0]} castShadow><cylinderGeometry args={[.055,.06,.32,10]}/><meshStandardMaterial color={look.pants}/></mesh><Block position={[side*.075,.035,.045]} size={[.125,.07,.19]} color="#34494d"/></group>)}
   <mesh position={[0,.47,0]} castShadow><cylinderGeometry args={[.13,.155,.34,12]}/><meshStandardMaterial color={coat} roughness={.85}/></mesh>
   {look.outfit==='coat'&&<Block position={[0,.35,0]} size={[.28,.2,.22]} color={coat}/>}
   {look.outfit==='jacket'&&<><Block position={[-.045,.5,.137]} size={[.04,.25,.02]} color="#eee6cd"/><Block position={[.045,.5,.137]} size={[.04,.25,.02]} color="#eee6cd"/></>}
   {look.outfit==='sweater'&&<Block position={[0,.51,.14]} size={[.24,.055,.015]} color="#e6d7b5"/>}
   {[-1,1].map(side=><group key={side} position={[side*.18,.46,0]} rotation={[side*swing,0,side*.15]}><mesh castShadow><cylinderGeometry args={[.045,.05,.28,10]}/><meshStandardMaterial color={coat}/></mesh><mesh position={[0,-.16,0]}><sphereGeometry args={[.048,10,8]}/><meshStandardMaterial color={look.skin}/></mesh></group>)}
   {staff&&<Block position={[0,.45,.13]} size={[.20,.25,.025]} color="#446759"/>}
   {look.bag&&<><Block position={[-.17,.4,-.015]} size={[.1,.20,.17]} color="#a57c52"/><Block position={[-.14,.55,.06]} size={[.025,.26,.018]} color="#c5a16f" rotation={[0,0,.1]}/></>}
   <mesh position={[0,.76,0]} castShadow><sphereGeometry args={[.13,16,12]}/><meshStandardMaterial color={look.skin} roughness={.9}/></mesh>
   <mesh position={[0,.81,-.015]} castShadow><sphereGeometry args={[.137,16,10,0,Math.PI*2,0,Math.PI*.57]}/><meshStandardMaterial color={look.hair}/></mesh>
   {look.hairStyle==='bob'&&<Block position={[0,.745,-.08]} size={[.27,.20,.15]} color={look.hair} radius={.065}/>}
   {look.hairStyle==='bun'&&<mesh position={[0,.80,-.16]} castShadow><sphereGeometry args={[.075,12,10]}/><meshStandardMaterial color={look.hair}/></mesh>}
   {look.hairStyle==='curly'&&[-.09,0,.09].map((v,i)=><mesh key={i} position={[v,.87+(i===1?.025:0),.005]} castShadow><sphereGeometry args={[.073,10,8]}/><meshStandardMaterial color={look.hair}/></mesh>)}
   {look.hat&&<><mesh position={[0,.88,0]}><cylinderGeometry args={[.09,.14,.10,12]}/><meshStandardMaterial color={look.coat}/></mesh><mesh position={[0,.84,.04]}><cylinderGeometry args={[.17,.17,.025,16]}/><meshStandardMaterial color={look.coat}/></mesh></>}
   {[-1,1].map(side=><group key={side}><mesh position={[side*.045,.775,.117]}><sphereGeometry args={[.014,8,6]}/><meshStandardMaterial color={face}/></mesh>{look.glasses&&<Block position={[side*.047,.775,.123]} size={[.066,.048,.015]} color={face} radius={.012}/>}</group>)}
   <mesh position={[0,.748,.135]}><sphereGeometry args={[.023,10,8]}/><meshStandardMaterial color={look.skin}/></mesh>
   <mesh position={[0,.711,.119]}><boxGeometry args={[.035,.008,.008]}/><meshStandardMaterial color="#9e6b58"/></mesh>
   {cup&&<Cup position={[.2,.49,.12]}/>}
  </group>
  <mesh rotation={[-Math.PI/2,0,0]} position={[0,.012,0]}><ringGeometry args={[.25,.31,24]}/><meshBasicMaterial color={selected?'#d46730':staff?'#c49c65':'#7da896'}/></mesh>
  {(selected||staff||count>1)&&<Tag text={`${label}${count>1?` ×${count}`:''}`} at={[0,look.height*1.04,0]} width={.65+label.length*.025+(count>1?.18:0)} background={selected?'#b75e2f':'#42665c'} color="#fff"/>}
 </group>;
}
function Camera({width,depth}){
 const {camera,size,invalidate}=useThree();
 useEffect(()=>{camera.position.set(width/2+6,8,depth/2+7);camera.lookAt(width/2,.6,depth/2);camera.zoom=Math.min(size.width/(width+depth*.65+1),size.height/(width*.48+depth*.38+2.1));camera.updateProjectionMatrix();invalidate()},[camera,size.width,size.height,width,depth]);
 return null;
}
function Interior({proposal,fromLayout,highlightLeg,run,time,selected,onSelect,showPaths,pathMode,selectedItem,onItemSelect,lang}){
 const {staff,customers}=layoutActors(run,time),width=run.layout.width*CELL_METERS,depth=run.layout.height*CELL_METERS;
 const occupied=new Set(run.layout.items.flatMap(itemCells).map(p=>`${p.x},${p.y}`)),groups=new Map();
 for(const person of customers){const key=`${person.position.x.toFixed(2)},${person.position.y.toFixed(2)}`;if(!groups.has(key))groups.set(key,[]);groups.get(key).push(person)}
 return <><Camera width={width} depth={depth}/><color attach="background" args={['#e6ece4']}/><ambientLight intensity={1.5}/><directionalLight position={[-3,8,5]} intensity={2.7} castShadow shadow-mapSize={[1024,1024]}/>
  <Block position={[width/2,-.1,depth/2]} size={[width+.2,.2,depth+.2]} color="#aebeb7"/>
  {Array.from({length:run.layout.width*run.layout.height},(_,i)=>{const x=i%run.layout.width,y=Math.floor(i/run.layout.width);return <Block key={i} position={[(x+.5)*CELL_METERS,.015,(y+.5)*CELL_METERS]} size={[CELL_METERS-.01,.025,CELL_METERS-.01]} radius={.005} color={occupied.has(`${x},${y}`)?'#d5d9c9':(x+y)%2?'#ece6d5':'#e5dfcd'}/>})}
  <Block position={[width/2,.17,-.075]} size={[width+.1,.34,.12]} color="#b1c1ad"/><Block position={[-.075,.17,depth/2]} size={[.12,.34,depth+.1]} color="#c1cdb7"/>
  {showPaths&&(pathMode==='customer'?run.metrics.customerPaths:run.metrics.staffPaths).map((route,i)=><Line key={i} points={route.path.map(p=>{const[x,z]=world(p);return[x,.055,z]})} color={pathMode==='customer'?'#507d91':'#cb8052'} lineWidth={highlightLeg===route.from+'-'+route.to?6:2} transparent opacity={!highlightLeg||highlightLeg===route.from+'-'+route.to?.85:.13}/>)}
  {run.layout.items.map(item=><React.Fragment key={item.id}><MovingDevice fromItem={fromLayout?.items.find(old=>old.id===item.id)} item={item} label={names[lang][item.type]} selected={selectedItem===item.id} onSelect={onItemSelect}/><mesh position={[(accessPoint(item).x+.5)*CELL_METERS,.05,(accessPoint(item).y+.5)*CELL_METERS]} rotation={[-Math.PI/2,0,0]}><circleGeometry args={[.06,12]}/><meshBasicMaterial color="#b9784f"/></mesh></React.Fragment>)}
  {proposal&&<Proposal item={proposal} lang={lang}/>}
  {staff.map(person=><Person key={`s${person.id}`} {...person} staff selected={person.active?.customerId===selected} label={`${lang==='ja'?'店員':'Staff'} ${person.id+1}`}/>)}
  {[...groups.values()].map(group=>{const person=group.find(p=>p.id===selected)||group[0];return <group key={group.map(p=>p.id).join('-')} onClick={e=>{e.stopPropagation();onSelect?.(person.id)}}><Person {...person} count={group.length} selected={person.id===selected} label={`#${person.id}`}/></group>})}
  <mesh rotation={[-Math.PI/2,0,0]} position={[width/2,-.22,depth/2]} receiveShadow><planeGeometry args={[20,20]}/><shadowMaterial opacity={.15}/></mesh>
 </>;
}
class Boundary extends Component{state={failed:false};componentDidCatch(error){console.error('Shop scene failed:',error.message)};static getDerivedStateFromError(){return {failed:true}}render(){return this.state.failed?this.props.fallback:this.props.children}}
export default function LayoutScene({proposal=null,fromLayout=null,highlightLeg=null,run,time=0,selected=null,onSelect,showPaths=true,pathMode='staff',selectedItem=null,onItemSelect,height=420,showCaption=true,sceneLabel}){const {lang}=useI18n();const fallback=<p style={{padding:24}}>{lang==='ja'?'3Dを表示できません。平面配置と計算結果をご利用ください。':'3D is unavailable. The floor plan and computed results remain available.'}</p>;return <section aria-label={sceneLabel||(lang==='ja'?'店舗レイアウトの営業再生':'Shop layout replay')} style={{background:'#e6ece4',border:'1px solid #ccd8cd'}}><div style={{height}}><Boundary fallback={fallback}><Canvas orthographic shadows="basic" frameloop="demand" dpr={[1,1.5]} camera={{position:[7,7,8],zoom:60,near:.1,far:50}} fallback={fallback}><Interior {...{proposal,fromLayout,highlightLeg,run,time,selected,onSelect,showPaths,pathMode,selectedItem,onItemSelect,lang}}/></Canvas></Boundary></div>{showCaption&&<p style={{margin:0,padding:'10px 15px',fontSize:11,lineHeight:1.6,color:'#496354'}}>{lang==='ja'?'1マス0.5m。道具と作業点を結ぶ実計算の経路です。通路の身体衝突は計算対象外。同じ場所の客は人数をまとめて表示。':'0.5 m grid. Paths and motion follow the simulation log. Body collisions are not modeled; customers at the same point are grouped.'}</p>}</section>}
