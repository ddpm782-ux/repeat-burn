/* Service worker: เปิดใช้งานแบบออฟไลน์ได้ · ข้อมูล (data/*.json) ดึงจากเครือข่ายก่อนเสมอ */
const CACHE='rb-b89ff3a086';
const PRECACHE=['./css/app.css','./css/fonts.css','./fonts/prompt-latin-400-normal.woff2','./fonts/prompt-latin-500-normal.woff2','./fonts/prompt-latin-600-normal.woff2','./fonts/prompt-latin-700-normal.woff2','./fonts/prompt-thai-400-normal.woff2','./fonts/prompt-thai-500-normal.woff2','./fonts/prompt-thai-600-normal.woff2','./fonts/prompt-thai-700-normal.woff2','./fonts/sarabun-latin-400-normal.woff2','./fonts/sarabun-latin-500-normal.woff2','./fonts/sarabun-latin-600-normal.woff2','./fonts/sarabun-thai-400-normal.woff2','./fonts/sarabun-thai-500-normal.woff2','./fonts/sarabun-thai-600-normal.woff2','./icons/icon-180.png','./icons/icon-192.png','./icons/icon-32.png','./icons/icon-512-maskable.png','./icons/icon-512.png','./img/logo-ddpm.png','./img/logo-doae.png','./img/logo-plk.png','./index.html','./js/admin.js','./js/core.js','./js/export.js','./js/map.js','./manifest.webmanifest','./vendor/html-to-image.js','./vendor/jspdf.umd.min.js','./vendor/xlsx.full.min.js','./'];
const DATA=['./data/data.json','./data/geo.json'];
self.addEventListener('install',e=>{e.waitUntil(caches.open(CACHE).then(c=>c.addAll(PRECACHE.concat(DATA))).then(()=>self.skipWaiting()))});
self.addEventListener('activate',e=>{e.waitUntil(caches.keys().then(ks=>Promise.all(ks.filter(k=>k!==CACHE).map(k=>caches.delete(k)))).then(()=>self.clients.claim()))});
self.addEventListener('fetch',e=>{
  const u=new URL(e.request.url);
  if(e.request.method!=='GET'||u.origin!==location.origin)return; // ภาพแผนที่พื้นหลังไม่แคช
  if(u.pathname.includes('/data/')){
    e.respondWith(fetch(e.request,{cache:'no-store'}).then(r=>{const c=r.clone();caches.open(CACHE).then(x=>x.put(e.request,c));return r}).catch(()=>caches.match(e.request,{ignoreSearch:true})));
    return;
  }
  e.respondWith(caches.match(e.request,{ignoreSearch:true}).then(r=>r||fetch(e.request)));
});
