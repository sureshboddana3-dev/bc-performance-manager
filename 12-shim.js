/* Local storage replacement for the hosted /api/state backend. Data stays in this browser (localStorage) on this phone. */
(function(){
const P='bcpm-state:';const real=window.fetch.bind(window);
window.fetch=async function(input,init){
 const url=typeof input==='string'?input:input.url;
 if(!/\/api\/state\?/.test(url))return real(input,init);
 const key=decodeURIComponent(url.split('key=')[1]||'');const m=(init&&init.method)||'GET';
 const cur=JSON.parse(localStorage.getItem(P+key)||'null')||{value:null,revision:0};
 const J=(o,st=200)=>new Response(JSON.stringify(o),{status:st,headers:{'content-type':'application/json'}});
 if(m==='PUT'){const b=JSON.parse(init.body);if((b.revision||0)!==cur.revision)return J({error:'conflict'},409);
  const n={value:b.value,revision:cur.revision+1};try{localStorage.setItem(P+key,JSON.stringify(n))}catch(e){return J({error:'storage full'},500)}return J(n)}
 return J(cur);
};
window.bcpmRestoreBackup=function(text){let d;try{d=JSON.parse(text)}catch(e){throw Error('This is not a valid JSON file.')}
 if(!d||!Array.isArray(d['bc-database']))throw Error('This file is not a backup from the BC Performance Manager "Export backup" button (no bc-database found). Nothing was changed.');
 let n=0;for(const k of ['bc-database','app-settings','upload-log'])if(k in d&&d[k]!==null){const c=JSON.parse(localStorage.getItem(P+k)||'null')||{revision:0};localStorage.setItem(P+k,JSON.stringify({value:d[k],revision:c.revision+1}));n++}return n};
if('serviceWorker' in navigator)navigator.serviceWorker.register('./sw.js').catch(()=>{});
})();
