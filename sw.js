// 오프라인 동작용 서비스 워커.
// 인터넷이 되면 새 파일을 먼저 받아(최대 3초) 저장해 두고, 안 되면 저장본으로 동작한다.
// → GitHub에 새 파일을 올리면 앱을 한 번 다시 열 때 바로 반영된다.
const CACHE = "kwanse-20261127190931";
const SHELL = ["./", "index.html", "app.js?v=20261127190931", "style.css?v=20261127190931", "manifest.webmanifest",
  "apple-touch-icon.png", "icon-192.png", "icon-512.png", "bank.json", "exams.json", "laws.json"];
self.addEventListener("install", (e) => {
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(SHELL)).then(() => self.skipWaiting()));
});
self.addEventListener("activate", (e) => {
  e.waitUntil(caches.keys().then((ks) => Promise.all(ks.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
    .then(() => self.clients.claim()));
});
self.addEventListener("fetch", (e) => {
  const req = e.request;
  if (req.method !== "GET" || new URL(req.url).origin !== location.origin) return;
  const isData = /\/(bank|exams|laws)\.json/.test(req.url);
  e.respondWith(caches.open(CACHE).then(async (c) => {
    const net = fetch(req, { cache: "no-cache" }).then((r) => { if (r.ok) c.put(req, r.clone()); return r; }).catch(() => null);
    const timeout = new Promise((res) => setTimeout(() => res(null), 3000));
    const r = await Promise.race([net, timeout]);
    if (r && r.ok) return r;
    e.waitUntil(net);
    const hit = await c.match(req, { ignoreSearch: isData });
    if (hit) return hit;
    return (await net) || (await c.match("index.html")) || new Response("오프라인", { status: 503 });
  }));
});
