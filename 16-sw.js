const C='bcpm-v1';
const ALLOW=new Set(['index.html','shim.js','state-merge.js','performance-core.js','manager-insights.js','target-plan.js','master-contacts.js','siri-data.js','siri-commands.js','xlsx.full.min.js','manager-ui.css','manifest.webmanifest','icon-192.png','icon-512.png','icon-512-maskable.png']);
const BASE=new URL('./',self.location).pathname;
const allowed=u=>{const x=new URL(u);if(x.origin!==self.location.origin||!x.pathname.startsWith(BASE))return false;const p=x.pathname.slice(BASE.length)||'index.html';return ALLOW.has(p)};
self.addEventListener('install',e=>e.waitUntil(caches.open(C).then(c=>c.addAll([...ALLOW].map(f=>'./'+f)))));
self.addEventListener('activate',e=>e.waitUntil(caches.keys().then(ks=>Promise.all(ks.filter(k=>k!==C).map(k=>caches.delete(k))))));
self.addEventListener('fetch',e=>{const r=e.request;if(r.method!=='GET'||!allowed(r.url))return;
 e.respondWith(fetch(r).then(res=>{if(res.ok){const x=res.clone();caches.open(C).then(c=>c.put(r,x))}return res}).catch(()=>caches.match(r,{ignoreSearch:true}).then(m=>m||(r.mode==='navigate'?caches.match('./index.html'):undefined))))});
