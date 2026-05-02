const CACHE = 'private-chat-v1';

// キャッシュするアセット（アプリシェル）
const ASSETS = ['/', '/manifest.json', '/icon-192.png', '/icon-512.png'];

self.addEventListener('install', (e) => {
  e.waitUntil(
    caches.open(CACHE).then((c) => c.addAll(ASSETS)).then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)))
    ).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (e) => {
  const { request } = e;
  const url = new URL(request.url);

  // API・WebSocket・外部リクエストはキャッシュしない
  if (url.pathname.startsWith('/api/') || url.pathname.startsWith('/socket.io')) return;

  e.respondWith(
    caches.match(request).then((cached) => cached || fetch(request))
  );
});
