// Only page loads and /_next/static/ are handled. API, auth and document
// requests are never cached, so no tenant data or token lands in Cache Storage.

// `yarn assets` replaces __ASSETS_HASH__ with a hash of the files in
// src/assets/public. A change to any of them gives a new name, so browsers
// install the new worker and delete the old cache.
const CACHE = 'mre-__ASSETS_HASH__';
const scope = self.registration.scope;
const OFFLINE_URL = new URL('offline.html', scope).href;
const PRECACHE = [
  OFFLINE_URL,
  new URL('favicon.svg', scope).href,
  new URL('icons/icon-192.png', scope).href
];
const STATIC_PREFIX = new URL('_next/static/', scope).pathname;
const MAX_STATIC_ENTRIES = 300;

function trimCache(cache) {
  return cache.keys().then((keys) => {
    const assets = keys.filter((key) =>
      new URL(key.url).pathname.startsWith(STATIC_PREFIX)
    );
    const extra = assets.length - MAX_STATIC_ENTRIES;
    // cache.keys() returns entries in insertion order: drop the oldest
    return Promise.all(
      assets.slice(0, Math.max(extra, 0)).map((key) => cache.delete(key))
    );
  });
}

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches
      .open(CACHE)
      .then((cache) => cache.addAll(PRECACHE))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(
          keys.filter((key) => key !== CACHE).map((key) => caches.delete(key))
        )
      )
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  const { request } = event;
  if (request.method !== 'GET') {
    return;
  }

  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request).catch(() =>
        caches
          .match(OFFLINE_URL)
          .then((response) => response || Response.error())
      )
    );
    return;
  }

  const url = new URL(request.url);
  if (
    url.origin === self.location.origin &&
    url.pathname.startsWith(STATIC_PREFIX)
  ) {
    event.respondWith(
      caches.open(CACHE).then((cache) =>
        cache.match(request).then(
          (cached) =>
            cached ||
            fetch(request).then((response) => {
              if (response.ok) {
                cache
                  .put(request, response.clone())
                  .then(() => trimCache(cache));
              }
              return response;
            })
        )
      )
    );
  }
});
