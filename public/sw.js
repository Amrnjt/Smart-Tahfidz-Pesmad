const CACHE_NAME = 'pesmad-runtime-v1';
const MAX_RUNTIME_ENTRIES = 120;
const CORE_URLS = [
  '/',
  '/manifest.webmanifest',
  '/pesmad-app-icon-v4-192.png',
  '/pesmad-app-icon-v4-512.png',
];

async function trimCache(cache) {
  const keys = await cache.keys();
  const overflow = keys.length - MAX_RUNTIME_ENTRIES;
  if (overflow <= 0) return;
  await Promise.all(keys.slice(0, overflow).map((request) => cache.delete(request)));
}

async function putIfCacheable(cache, request, response) {
  if (!response || !response.ok || response.type === 'opaque') return response;
  await cache.put(request, response.clone());
  await trimCache(cache);
  return response;
}

async function precacheCurrentShell() {
  const cache = await caches.open(CACHE_NAME);

  await Promise.allSettled(
    CORE_URLS.map(async (url) => {
      const response = await fetch(url, { cache: 'no-store' });
      if (!response.ok) return;
      await cache.put(url, response.clone());

      if (url !== '/') return;
      const html = await response.text();
      const assetUrls = Array.from(
        html.matchAll(/(?:src|href)=["'](\/assets\/[^"'?#]+[^"']*)["']/g),
        (match) => match[1]
      );

      await Promise.allSettled(
        assetUrls.map(async (assetUrl) => {
          const assetResponse = await fetch(assetUrl, { cache: 'no-store' });
          if (assetResponse.ok) {
            await cache.put(assetUrl, assetResponse);
          }
        })
      );
    })
  );

  await trimCache(cache);
}

self.addEventListener('install', (event) => {
  event.waitUntil(
    precacheCurrentShell()
      .catch((error) => console.warn('PWA shell precache failed:', error))
      .finally(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim());
});

self.addEventListener('fetch', (event) => {
  const request = event.request;
  if (request.method !== 'GET') return;

  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;

  if (request.mode === 'navigate') {
    event.respondWith((async () => {
      const cache = await caches.open(CACHE_NAME);
      try {
        const network = await fetch(request);
        if (network.ok) {
          await cache.put('/', network.clone());
          await trimCache(cache);
        }
        return network;
      } catch {
        const cachedShell = await cache.match('/');
        if (cachedShell) return cachedShell;
        return new Response(
          '<!doctype html><html lang="id"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><body style="font-family:system-ui;padding:24px;background:#f8fafc;color:#0f172a"><h1 style="font-size:20px">Smart Tahfidz sedang offline</h1><p>Sambungkan internet lalu buka kembali aplikasi.</p></body></html>',
          { headers: { 'Content-Type': 'text/html; charset=utf-8' } }
        );
      }
    })());
    return;
  }

  if (url.pathname.startsWith('/assets/')) {
    event.respondWith((async () => {
      const cache = await caches.open(CACHE_NAME);
      const cached = await cache.match(request);
      if (cached) return cached;

      const network = await fetch(request);
      return putIfCacheable(cache, request, network);
    })());
    return;
  }

  if (
    url.pathname === '/manifest.webmanifest' ||
    url.pathname.startsWith('/pesmad-app-icon-')
  ) {
    event.respondWith((async () => {
      const cache = await caches.open(CACHE_NAME);
      const cached = await cache.match(request);

      const refresh = fetch(request)
        .then((response) => putIfCacheable(cache, request, response))
        .catch(() => undefined);

      if (cached) {
        event.waitUntil(refresh);
        return cached;
      }

      const network = await refresh;
      if (network) return network;
      return new Response('', { status: 503 });
    })());
  }
});
