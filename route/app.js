// /route/app.js
// --- tiny IDB (no deps)
const DB_NAME = 'ac-route', STORE = 'kv';
const idb = (method, ...args) => new Promise((resolve, reject) => {
  const open = indexedDB.open(DB_NAME, 1);
  open.onupgradeneeded = () => open.result.createObjectStore(STORE);
  open.onerror = () => reject(open.error);
  open.onsuccess = () => {
    const tx = open.result.transaction(STORE, 'readwrite');
    const st = tx.objectStore(STORE);
    const req = st[method](...args);
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  };
});
const idbGet = (k) => idb('get', k);
const idbSet = (k, v) => idb('put', v, k);

const STATE_KEY = 'tn:graph';
const GATE_HOURS = 6;

let WORKER = null;
let STATE = null; // { sha, graph, indexes, bbox }

const canvas = document.getElementById('map');
const ctx = canvas.getContext('2d');

function prebuild(graph){
  // name index + nodesById + ensure adjacency exists
  const nameIndex = new Map();
  const nodesById = [];
  let maxId = -1;
  for (const n of graph.nodes){
    const key = n.name.toLowerCase();
    const arr = nameIndex.get(key) || [];
    arr.push(n.id);
    nameIndex.set(key, arr);
    nodesById[n.id] = n;
    if (n.id > maxId) maxId = n.id;
  }
  if (!graph._adj){
    const N = maxId + 1;
    const adj = Array.from({length: N}, () => []);
    for (const e of graph.edges){
      adj[e.a].push({ to: e.b, w: e.w });
      adj[e.b].push({ to: e.a, w: e.w });
    }
    graph._adj = adj;
  }
  return { nameIndex, nodesById };
}

function fitAndDraw(path){
  ctx.clearRect(0,0,canvas.width,canvas.height);
  if (!path || !path.length) return;
  const [xmin,ymin,xmax,ymax] = STATE.bbox || STATE.graph.bbox || [0,0,200,200];
  const sx = canvas.width/(xmax-xmin), sy = canvas.height/(ymax-ymin);
  const s = Math.min(sx, sy), ox = -xmin, oy = -ymin;

  ctx.beginPath();
  for (let i=0;i<path.length;i++){
    const n = STATE.indexes.nodesById[path[i]];
    const x = (n.x+ox)*s, y = (n.y+oy)*s;
    if (i===0) ctx.moveTo(x,y); else ctx.lineTo(x,y);
  }
  ctx.lineWidth = 3;
  ctx.strokeStyle = '#1a7f37';
  ctx.stroke();
}

async function ensureWorker(){
  if (WORKER) return;
  WORKER = new Worker('./worker.js'); // classic worker for max compat
  await new Promise(res => {
    WORKER.onmessage = (e)=>{ if (e.data?.kind==='ready') res(); };
    WORKER.postMessage({ kind: 'load', graph: STATE });
  });
}

function requestRoute(startName, endName, mode){
  return new Promise((resolve) => {
    WORKER.onmessage = (e)=>{ if (e.data?.kind==='route') resolve(e.data); };
    WORKER.postMessage({ kind:'route', startName, endName, mode });
  });
}

async function boot(){
  // render instantly from cache if present
  const cached = await idbGet(STATE_KEY);
  if (cached){
    STATE = cached;
    await ensureWorker();
  }

  // staleness gate before hitting the network
  const last = Number(localStorage.getItem('tn_last_check') || 0);
  const stale = (Date.now() - last) > GATE_HOURS*3600*1000;
  if (stale || !cached){
    try {
      const manifest = await fetch('./assets/tn.manifest.json', { cache:'no-cache' }).then(r=>r.json());
      localStorage.setItem('tn_last_check', String(Date.now()));
      if (!cached || cached.sha !== manifest.sha){
        const graph = await fetch(manifest.graph_url).then(r=>r.json());
        const bundle = {
          sha: manifest.sha,
          graph,
          indexes: prebuild(graph),
          bbox: graph.bbox || manifest.bbox
        };
        await idbSet(STATE_KEY, bundle);
        STATE = bundle;
        await ensureWorker();
        console.info('Graph updated to', manifest.sha);
      }
    } catch (err){
      console.warn('Manifest/graph fetch failed', err);
    }
  }

  // Permalink prefill + autorun
  const u = new URL(location.href);
  const s = u.searchParams.get('start');
  const e = u.searchParams.get('end');
  const m = u.searchParams.get('mode');
  if (s) document.getElementById('start').value = s;
  if (e) document.getElementById('end').value = e;
  if (m) document.getElementById('mode').value = m;
  if (s && e) document.getElementById('go').click();
}

document.getElementById('go').addEventListener('click', async ()=>{
  const s = document.getElementById('start').value.trim();
  const e = document.getElementById('end').value.trim();
  const m = document.getElementById('mode').value;
  if (!s || !e || !STATE){ return; }
  const result = await requestRoute(s, e, m); // {path, distance, hops, ms?}
  fitAndDraw(result.path);
  const km = result.distance.toFixed(1);
  document.getElementById('stats').textContent =
    result.path.length ? `Distance: ${km} · Hops: ${result.hops}` : 'No route found';
});

boot();