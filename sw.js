const CACHE = "validades-v1";

const FILES = [
  "/",
  "/index.html",
  "/app.html",
  "/css/style.css",
  "/css/bootstrap.min.css",
  "/js/app.js",
  "/js/login.js",
  "/js/alertify.js"
];

self.addEventListener("install", e => {
  e.waitUntil(
    caches.open(CACHE).then(cache => cache.addAll(FILES))
  );
});

self.addEventListener("fetch", e => {
  e.respondWith(
    caches.match(e.request).then(resp => resp || fetch(e.request))
  );
});
