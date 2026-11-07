// Service worker: network-first SEM cache HTTP (sempre pega a versão nova quando online); cache só para uso offline.
// A instalação é tolerante: se algum arquivo opcional (ícones) faltar no servidor, o jogo continua funcionando offline.
const CACHE = 'asas-v13';
const CORE = ['./', './index.html', './manifest.webmanifest', './apple-touch-icon.png', './icons/icon-192.png', './icons/icon-512.png', './icons/icon-maskable-512.png'];
self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => Promise.allSettled(CORE.map(u => c.add(new Request(u, { cache: 'reload' }))))).then(() => self.skipWaiting()));
});
self.addEventListener('activate', e => { e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== CACHE).map(k => caches.delete(k)))).then(() => self.clients.claim())); });
self.addEventListener('fetch', e => {
  const r = e.request; if (r.method !== 'GET') return;
  const u = new URL(r.url);
  if (u.hostname.endsWith('fonts.googleapis.com') || u.hostname.endsWith('fonts.gstatic.com')) {   // fontes: cache primeiro
    e.respondWith(caches.match(r).then(m => m || fetch(r).then(res => { const c = res.clone(); caches.open(CACHE).then(ch => ch.put(r, c)); return res; })));
    return;
  }
  if (u.origin !== location.origin) return;
  e.respondWith(fetch(r, { cache: 'no-store' }).then(res => { if (res.ok) { const c = res.clone(); caches.open(CACHE).then(ch => ch.put(r, c)); } return res; })
    .catch(() => caches.match(r, { ignoreSearch: true }).then(m => m || caches.match('./index.html') || caches.match('./'))));
});
