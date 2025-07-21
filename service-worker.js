importScripts('https://storage.googleapis.com/workbox-cdn/releases/5.1.2/workbox-sw.js');

const CACHE = "pwa-cache-v1";
const BASE_PATH = "/mypresensi";
const OFFLINE_PAGE = `${BASE_PATH}/offline.html`;

self.addEventListener("install", (event) => {
  console.log("[SW] Install");
  event.waitUntil(
    caches.open(CACHE).then((cache) => {
      return cache.addAll([
        `${BASE_PATH}/`,
        `${BASE_PATH}/index.html`,
        `${BASE_PATH}/manifest.json`,
        `${BASE_PATH}/offline.html`,
        `${BASE_PATH}/assets/icons/icon-192x192.png`,
        `${BASE_PATH}/assets/icons/icon-512x512.png`,
        `${BASE_PATH}/assets/icons/icon-192x192-maskable.png`,
        `${BASE_PATH}/assets/icons/icon-512x512-maskable.png`
      ]);
    })
  );
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  console.log("[SW] Activate");
  event.waitUntil(
    caches.keys().then((keyList) =>
      Promise.all(
        keyList.map((key) => {
          if (key !== CACHE) return caches.delete(key);
        })
      )
    )
  );
  return self.clients.claim();
});

if (workbox.navigationPreload.isSupported()) {
  workbox.navigationPreload.enable();
}

self.addEventListener("fetch", (event) => {
  if (event.request.mode === "navigate") {
    event.respondWith(
      (async () => {
        try {
          const preloadResp = await event.preloadResponse;
          if (preloadResp) return preloadResp;

          const networkResp = await fetch(event.request);
          return networkResp;
        } catch (error) {
          const cache = await caches.open(CACHE);
          return await cache.match(OFFLINE_PAGE);
        }
      })()
    );
  } else {
    event.respondWith(
      caches.match(event.request).then((response) => {
        return response || fetch(event.request);
      })
    );
  }
});
