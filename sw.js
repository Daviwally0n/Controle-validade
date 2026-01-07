const CACHE = "validades-v3";

const FILES = [
  "./index.html",
  "./app.html",
  "./css/bootstrap.min.css",
  "./js/login.js"
];

// INSTALL
self.addEventListener("install", event => {
  event.waitUntil(
    caches.open(CACHE).then(async cache => {
      for (const file of FILES) {
        try {
          const response = await fetch(file, { cache: "no-cache" });
          if (response.ok) {
            await cache.put(file, response);
          }
        } catch {}
      }
    })
  );
  self.skipWaiting();
});

// ACTIVATE
self.addEventListener("activate", event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(
        keys.map(key => {
          if (key !== CACHE) {
            return caches.delete(key);
          }
        })
      )
    )
  );
  self.clients.claim();
});

// FETCH
self.addEventListener("fetch", event => {
  const url = event.request.url;

  if (url.endsWith("/js/app.js")) {
    return; // SEMPRE da rede
  }

  event.respondWith(
    caches.match(event.request).then(resp => {
      return resp || fetch(event.request);
    })
  );
});


