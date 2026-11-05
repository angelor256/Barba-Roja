/* Barba Roja – Service Worker: caché offline + Web Push */
const VERSION = 'br-v3';
const BASE = self.registration.scope;               // p. ej. https://x.github.io/barba-roja/
const abs = (p) => new URL(String(p || '').replace(/^\//, ''), BASE).href;
const SHELL = [BASE, abs('manifest.webmanifest'), abs('favicon.png'), abs('icons/icon-192.png'), abs('icons/logo.png')];

self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(VERSION).then((c) => c.addAll(SHELL)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== VERSION).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (e) => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);

  // Nunca cachear la API de Supabase ni funciones (datos en vivo)
  if (url.hostname.endsWith('supabase.co')) return;

  // Navegación: red primero, caída a la app shell offline
  if (req.mode === 'navigate') {
    e.respondWith(
      fetch(req)
        .then((res) => { caches.open(VERSION).then((c) => c.put(BASE, res.clone())); return res; })
        .catch(() => caches.match(BASE))
    );
    return;
  }

  // Estáticos y fuentes: stale-while-revalidate
  if (url.origin === location.origin || /fonts\.(googleapis|gstatic)\.com$/.test(url.hostname)) {
    e.respondWith(
      caches.match(req).then((hit) => {
        const net = fetch(req)
          .then((res) => { if (res.ok) caches.open(VERSION).then((c) => c.put(req, res.clone())); return res; })
          .catch(() => hit);
        return hit || net;
      })
    );
  }
});

// ---- Push ----
self.addEventListener('push', (e) => {
  let data = {};
  try { data = e.data ? e.data.json() : {}; } catch { data = { body: e.data && e.data.text() }; }
  e.waitUntil(
    self.registration.showNotification(data.title || 'Barba Roja', {
      body: data.body || '',
      icon: abs('icons/icon-192.png'),
      badge: abs('favicon.png'),
      data: { url: abs(data.url) },
      tag: data.tag,
    })
  );
});

self.addEventListener('notificationclick', (e) => {
  e.notification.close();
  const target = (e.notification.data && e.notification.data.url) || BASE;
  e.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontained: true }).then((list) => {
      for (const c of list) { if ('focus' in c) { c.navigate(target); return c.focus(); } }
      return self.clients.openWindow(target);
    })
  );
});
