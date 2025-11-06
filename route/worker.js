// /route/worker.js
let G = null, INDEX = null;

self.onmessage = (e)=>{
  const msg = e.data;
  if (msg.kind === 'load'){
    // msg.graph = { sha, graph, indexes, bbox }
    G = msg.graph.graph;
    INDEX = msg.graph.indexes;
    // ensure adjacency
    if (!G._adj){
      const maxId = G.nodes.reduce((m,n)=> Math.max(m, n.id), -1);
      const N = maxId + 1;
      const adj = Array.from({length:N}, ()=>[]);
      for (const e of G.edges){
        adj[e.a].push({ to: e.b, w: e.w });
        adj[e.b].push({ to: e.a, w: e.w });
      }
      G._adj = adj;
    }
    self.postMessage({ kind:'ready' });
  } else if (msg.kind === 'route'){
    const path = routeByNames(msg.startName, msg.endName, msg.mode);
    const distance = pathDistance(path);
    self.postMessage({ kind:'route', path, distance, hops: Math.max(0, path.length-1) });
  }
};

function idsForName(name){
  return INDEX.nameIndex.get(String(name).toLowerCase()) || [];
}

function neighbors(id){ return G._adj[id] || []; }

function routeByNames(sName, tName, mode){
  const sids = idsForName(sName), tids = idsForName(tName);
  if (!sids.length || !tids.length) return [];
  return dijkstra(sids[0], tids[0], mode === 'fewest_hops');
}

function dijkstra(src, dst, fewest){
  const N = G._adj.length;
  const dist = new Float64Array(N).fill(Infinity);
  const prev = new Int32Array(N).fill(-1);
  const seen = new Uint8Array(N);
  dist[src] = 0;

  for (let iter=0; iter<N; iter++){
    let u=-1, best=Infinity;
    for (let i=0;i<N;i++) if (!seen[i] && dist[i]<best){ best=dist[i]; u=i; }
    if (u===-1) break;
    if (u===dst) break;
    seen[u]=1;
    for (const {to, w} of neighbors(u)){
      const cost = fewest ? 1 : (w ?? 1);
      const alt = dist[u] + cost;
      if (alt < dist[to]){ dist[to]=alt; prev[to]=u; }
    }
  }
  if (prev[dst]===-1 && src!==dst) return [];
  const out = [];
  for (let v=dst; v!==-1; v=prev[v]) out.push(v);
  return out.reverse();
}

function pathDistance(path){
  let d=0;
  for (let i=1;i<path.length;i++){
    const a = G.nodes[path[i-1]], b = G.nodes[path[i]];
    d += Math.hypot(a.x-b.x, a.y-b.y);
  }
  return d;
}