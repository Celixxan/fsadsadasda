const CACHE = "verdensbordet-world-v8-full-3.1-shopping";
const APP_SHELL = [
  "/",
  "/index.html",
  "/assets/styles.css",
  "/js/app.js",
  "/js/data.js",
  "/js/db.js",
  "/js/cloud.js",
  "/js/globe.js",
  "/js/book-export.js",
  "/js/shopping.js",
  "/config.js",
  "/manifest.webmanifest",
  "/icons/icon.svg",
  "/icons/icon-192.png",
  "/icons/icon-512.png",
  "/icons/apple-touch-icon.png"
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE)
      .then((cache) => cache.addAll(APP_SHELL))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((key) => key !== CACHE).map((key) => caches.delete(key))))
      .then(() => self.clients.claim())
  );
});

async function networkFirst(request) {
  try {
    const response = await fetch(request);
    const cache = await caches.open(CACHE);
    cache.put(request, response.clone());
    return response;
  } catch {
    return (await caches.match(request)) || caches.match("/index.html");
  }
}

async function staleWhileRevalidate(request) {
  const cached = await caches.match(request);
  const network = fetch(request)
    .then(async (response) => {
      const cache = await caches.open(CACHE);
      await cache.put(request, response.clone());
      return response;
    })
    .catch(() => null);
  return cached || network || caches.match("/index.html");
}

self.addEventListener("fetch", (event) => {
  const { request } = event;
  if (request.method !== "GET") return;
  const url = new URL(request.url);
  if (url.origin !== location.origin) return;

  if (request.mode === "navigate") {
    event.respondWith(networkFirst(request));
    return;
  }
  event.respondWith(staleWhileRevalidate(request));
});
