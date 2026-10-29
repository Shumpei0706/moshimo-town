// Shared language preference for the static legal pages. Original license texts stay untouched.
(()=>{
 const key='moshimo-language';
 const read=()=>{try{return localStorage.getItem(key)==='ja'?'ja':'en'}catch{return 'en'}};
 const apply=lang=>{document.documentElement.lang=lang;document.title=document.documentElement.dataset[lang==='ja'?'titleJa':'titleEn']||document.title;document.querySelectorAll('[data-language]').forEach(button=>button.setAttribute('aria-pressed',String(button.dataset.language===lang)))};
 document.querySelectorAll('[data-language]').forEach(button=>button.addEventListener('click',()=>{const lang=button.dataset.language==='ja'?'ja':'en';try{localStorage.setItem(key,lang)}catch{}apply(lang)}));
 window.addEventListener('storage',event=>{if(event.key===key||event.key===null)apply(read())});
 apply(read());
})();
