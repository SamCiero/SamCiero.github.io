// /route/sw.js
const MANIFEST = './assets/tn.manifest.json';

self.addEventListener('install', (evt) => {
  evt.waitUntil((async ()=>{
    const m = await fetch(MANIFEST, { cache:'no-cache' }).then(r=>r.json()).catch(()=>null);
    const cache = await caches.open(cacheName(m?.sha || 'bootstrap'));
    const urls = [MANIFEST];
    if (m?.graph_url) urls.push(m.graph_url);
    await cache.addAll(urls);
    self.skipWaiting();
  })());
});

self.addEventListener('activate', (evt) => {
  evt.waitUntil((async ()=>{
    const m = await fetch(MANIFEST, { cache:'no-cache' }).then(r=>r.json()).catch(()=>null);
    const keep = cacheName(m?.sha || 'bootstrap');
    const names = await caches.keys();
    await Promise.all(names.map(n => n===keep ? null : caches.delete(n)));
    self.clients.claim();
  })());
});

self.addEventListener('fetch', (evt) => {
  const url = new URL(evt.request.url);
  if (!url.pathname.startsWith(self.registration.scope)) return;

  if (url.pathname.endsWith('/assets/tn.manifest.json')) {
    evt.respondWith(staleWhileRevalidate(evt.request));
    return;
  }
  if (url.pathname.includes('/assets/tn.graph.v1.')) {
    evt.respondWith(cacheFirstThenUpdate(evt.request));
    return;
  }
});

function cacheName(sha){ return `route-cache-v1-${sha}`; }

async function staleWhileRevalidate(req){
  const c = await caches.open('manifest-cache');
  const cached = await c.match(req);
  const net = fetch(req).then(res=>{ c.put(req, res.clone()); return res; }).catch(()=>null);
  return cached || net || fetch(req);
}

async function cacheFirstThenUpdate(req){
  const m = await fetch(MANIFEST, { cache:'no-cache' }).then(r=>r.json()).catch(()=>null);
  const c = await caches.open(cacheName(m?.sha || 'bootstrap'));
  const cached = await c.match(req);
  const net = fetch(req).then(async res=>{ await c.put(req, res.clone()); return res; }).catch(()=>null);
  return cached || net || fetch(req);
}