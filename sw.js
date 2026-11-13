/* Espace Conseiller : fonctionnement hors ligne.
   La page est toujours prise sur le réseau en priorité (les mises à jour arrivent tout de suite) ;
   la copie gardée sur l'appareil ne sert que sans connexion. Les comptes (Supabase) ne passent jamais par ici. */
const CACHE = 'ft-conseiller-v3';
const CORE = ['./', './index.html', './manifest.webmanifest', './icons/apple-touch-icon.png', './icons/icon-192.png', './icons/icon-512.png'];
const STATIC_HOSTS = ['fonts.googleapis.com', 'fonts.gstatic.com', 'cdn.jsdelivr.net'];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(CORE)).catch(() => {}).then(() => self.skipWaiting()));
});
self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== CACHE).map(k => caches.delete(k)))).then(() => self.clients.claim()));
});

function keep(req, res) {
  if (res && (res.ok || res.type === 'opaque')) { const copy = res.clone(); caches.open(CACHE).then(c => c.put(req, copy)); }
  return res;
}

self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  const same = url.origin === self.location.origin;

  // Page : réseau d'abord, copie locale si hors ligne
  if (req.mode === 'navigate' || (same && /\/(index\.html)?$/.test(url.pathname))) {
    e.respondWith(
      fetch(req).then(res => { if (res.ok && !url.search) keep(new Request(url.pathname.endsWith('/') ? './' : req.url), res.clone()); return res; })
        .catch(() => caches.match(req, { ignoreSearch: true }).then(r => r || caches.match('./')))
    );
    return;
  }
  // Polices et bibliothèques : copie locale d'abord
  if (STATIC_HOSTS.includes(url.hostname)) {
    e.respondWith(caches.match(req).then(r => r || fetch(req).then(res => keep(req, res))));
    return;
  }
  // Données de veille : toujours le réseau
  if (same && url.pathname.endsWith('.json')) return;
  // Fichiers du site (icônes…) : copie locale, mise à jour en arrière-plan
  if (same) {
    e.respondWith(caches.match(req).then(r => {
      const net = fetch(req).then(res => keep(req, res)).catch(() => r);
      return r || net;
    }));
  }
});
