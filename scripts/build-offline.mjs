import { readdir, readFile, writeFile } from "node:fs/promises";
import { createHash } from "node:crypto";
const files = (await readdir("dist-web", { recursive: true })).filter(
  (f) => /\.(html|js|css|wasm|woff2|svg)$/.test(f) && f !== "sw.js",
);
const hash = createHash("sha256");
for (const f of files) hash.update(await readFile("dist-web/" + f));
const cache = "oftly-" + hash.digest("hex").slice(0, 16);
// Cache public application assets only. Collection data never enters the cache.
await writeFile(
  "dist-web/sw.js",
  `const CACHE=${JSON.stringify(cache)},FILES=${JSON.stringify(files.map((f) => "/" + f))};
self.addEventListener('install',e=>e.waitUntil(caches.open(CACHE).then(c=>c.addAll(FILES))));
self.addEventListener('activate',e=>e.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(k=>k.startsWith('oftly-')&&k!==CACHE).map(k=>caches.delete(k)))).then(()=>self.clients.claim())));
self.addEventListener('fetch',e=>{const u=new URL(e.request.url);if(e.request.method!=='GET'||u.origin!==location.origin)return;if(e.request.mode==='navigate'){e.respondWith(fetch(e.request).catch(()=>caches.open(CACHE).then(c=>c.match('/index.html'))));return;}if(FILES.includes(u.pathname))e.respondWith(caches.open(CACHE).then(async c=>(await c.match(u.pathname))||fetch(e.request)));});`,
);
