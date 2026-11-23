// 오프라인 동작용 서비스 워커. 앱 파일은 설치 시 저장, 문제은행 자료는 저장본을 먼저 쓰고 인터넷이 되면 새 버전을 받아 둔다.
const CACHE = "kwanse-20261124003625";
const SHELL = ["./", "index.html", "app.js?v=20261124003625", "style.css?v=20261124003625", "manifest.webmanifest",
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
  e.respondWith(caches.open(CACHE).then(async (c) => {
    const hit = await c.match(req, { ignoreSearch: /\/(bank|exams|laws)\.json/.test(req.url) });
    const net = fetch(req).then((r) => { if (r.ok) c.put(req, r.clone()); return r; }).catch(() => null);
    if (hit) { e.waitUntil(net); return hit; }
    const r = await net;
    return r || (await c.match("index.html")) || new Response("오프라인", { status: 503 });
  }));
});
