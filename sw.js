const CACHE = "validades-v2";

const FILES = [
  "./index.html",
  "./app.html",
  "./css/bootstrap.min.css",
  "./js/app.js",
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
        } catch (e) {
          // ignora arquivos que falharem
        }
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

  // NUNCA interceptar API
  if (url.includes("/api/")) {
    return;
  }

  event.respondWith(
    caches.match(event.request).then(resp => {
      return resp || fetch(event.request);
    })
  );
});
