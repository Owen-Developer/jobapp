self.addEventListener("install", event => {
  event.waitUntil(
    caches.open("examscope-cache").then(cache => {
      return cache.addAll([
        "/jobapp/",
        "/jobapp/index.html",
        "/jobapp/styles.css",
        "/jobapp/script.js",
        "/jobapp/images/main-logo.png"
      ]);
    })
  );
});

self.addEventListener("fetch", event => {
  event.respondWith(
    caches.match(event.request).then(response => {
      return response || fetch(event.request);
    })
  );
});