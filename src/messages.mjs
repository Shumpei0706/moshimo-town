export const LANGUAGE_KEY='moshimo-language';
export const messages={
 "title": [
  "Moshimo Town — Rehearse a better morning",
  "もしも、この店で。— 配置を動かして、朝を変える"
 ],
 "moneyTitle": [
  "Where the morning’s money goes",
  "朝のお金の流れ"
 ],
 "revenue": [
  "Sales",
  "売上"
 ],
 "ingredients": [
  "Ingredients",
  "仕入費"
 ],
 "labor": [
  "Labor",
  "人件費"
 ],
 "space": [
  "Space",
  "場所代"
 ],
 "preparation": [
  "Preparation",
  "準備費"
 ],
 "surplus": [
  "Balance",
  "収支"
 ],
 "positiveBalance": [
  "Positive balance",
  "黒字"
 ],
 "negativeBalance": [
  "Negative balance",
  "赤字"
 ],
 "zeroBalance": [
  "Break-even",
  "収支ゼロ"
 ],
 "chartStock": [
  "Stock",
  "仕入費"
 ],
 "chartPrep": [
  "Prep",
  "準備費"
 ],
 "closeDialog": [
  "Close details",
  "詳細を閉じる"
 ]
};
export function readLanguage(storage){try{return storage?.getItem(LANGUAGE_KEY)==='ja'?'ja':'en'}catch{return 'en'}}
export function saveLanguage(storage,lang){try{storage?.setItem(LANGUAGE_KEY,lang==='ja'?'ja':'en')}catch{}}
export function translate(lang,key,values={}){const pair=messages[key];if(!pair)throw Error(`Missing translation: ${key}`); return (pair[lang==='ja'?1:0]).replace(/\{(\w+)\}/g,(_,k)=>String(values[k]??`{${k}}`));}
export const formatYen=(lang,n)=>new Intl.NumberFormat(lang==='ja'?'ja-JP':'en-US',{style:'currency',currency:lang==='ja'?'JPY':'USD',minimumFractionDigits:lang==='en'&&n!==0&&Math.abs(n)<150?2:0,maximumFractionDigits:lang==='en'&&n!==0&&Math.abs(n)<150?2:0}).format(lang==='ja'?n:n/150);
export const formatUnitPrice=(lang,n)=>new Intl.NumberFormat(lang==='ja'?'ja-JP':'en-US',{style:'currency',currency:lang==='ja'?'JPY':'USD',minimumFractionDigits:lang==='en'?2:0,maximumFractionDigits:lang==='en'?2:0}).format(lang==='ja'?n:n/150);
