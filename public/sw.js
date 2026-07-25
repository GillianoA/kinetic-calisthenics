const CACHE_NAME = "kinetic-shell-v3";
// Keep precached documents user-neutral. /login can redirect an authenticated
// install request to /dashboard, which must never enter a shared browser cache.
const APP_SHELL = ["/", "/demo", "/manifest.webmanifest"];
const STATIC_DESTINATIONS = new Set(["font", "image", "script", "style"]);

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(APP_SHELL)).catch(() => undefined),
  );
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key))),
      ),
  );
  self.clients.claim();
});

self.addEventListener("fetch", (event) => {
  if (event.request.method !== "GET" || new URL(event.request.url).origin !== self.location.origin) {
    return;
  }

  event.respondWith(
    fetch(event.request)
      .then((response) => {
        const url = new URL(event.request.url);
        const isStaticAsset =
          STATIC_DESTINATIONS.has(event.request.destination) &&
          (url.pathname.startsWith("/_next/static/") ||
            ["/favicon.ico", "/icon", "/og.png"].includes(url.pathname));
        if (response.ok && isStaticAsset) {
          const clone = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone));
        }
        return response;
      })
      .catch(async () => {
        const cached = await caches.match(event.request);
        if (cached) return cached;
        if (event.request.mode === "navigate") {
          return (await caches.match("/")) || Response.error();
        }
        return Response.error();
      }),
  );
});
