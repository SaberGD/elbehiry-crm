/* Generated build values. Cache public application files only, never CRM responses. */
const CACHE_NAME = "behery-static-6fad5f271f68f8b2";
const PRECACHE_URLS = ["/assets/AuditLogPage-C5w4Y-2v.js","/assets/BranchesTeamsPage-DbG_E7N1.js","/assets/BrokersPage-B0SjG5rb.js","/assets/CRMContext-BiJUUfR1.js","/assets/DepartmentDashboardPage-CU6FOk91.js","/assets/DeveloperPage-DOWTGKd5.js","/assets/FeedbackPage-Di59IfB_.js","/assets/OverviewPage-Dc_J-QxV.js","/assets/PermissionsPage-BvS7kFnl.js","/assets/ReportsPage-DsfMI26y.js","/assets/SettingsPage-CUbXKqz5.js","/assets/StaffUsersPage-v1W2zNZW.js","/assets/TeamsPage-Dm2aY9wE.js","/assets/briefcase-CRG30c9m.js","/assets/createLucideIcon-Ce_6XG_x.js","/assets/demoData-DU3Mhd29.js","/assets/index-CS4X0bjP.js","/assets/index-Di2Qe57g.css","/assets/initialData-XeJTjNhY.js","/assets/postSale-9mtkua2x.js","/assets/trending-up-DpC16VIb.js","/fonts/fonts.css","/fonts/ibm-plex-sans-arabic-arabic-400-normal.woff2","/fonts/ibm-plex-sans-arabic-arabic-500-normal.woff2","/fonts/ibm-plex-sans-arabic-arabic-600-normal.woff2","/fonts/ibm-plex-sans-arabic-arabic-700-normal.woff2","/fonts/ibm-plex-sans-arabic-latin-400-normal.woff2","/fonts/ibm-plex-sans-arabic-latin-500-normal.woff2","/fonts/ibm-plex-sans-arabic-latin-600-normal.woff2","/fonts/ibm-plex-sans-arabic-latin-700-normal.woff2","/icons/apple-touch-icon.png","/icons/favicon-32.png","/icons/icon-192.png","/icons/icon-512.png","/icons/icon-maskable-512.png","/offline.html"];
const CACHE_PREFIX = "behery-static-";
const STATIC_PATHS = new Set(
  PRECACHE_URLS.map((url) => new URL(url, self.location.origin).pathname),
);

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(PRECACHE_URLS)),
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    (async () => {
      for (const name of await caches.keys()) {
        if (name.startsWith(CACHE_PREFIX) && name !== CACHE_NAME)
          await caches.delete(name);
      }
      await self.clients.claim();
    })(),
  );
});

// The user explicitly accepts an update after saving their work.
self.addEventListener("message", (event) => {
  if (event.data?.type === "ACTIVATE_UPDATE")
    event.waitUntil(self.skipWaiting());
});

self.addEventListener("fetch", (event) => {
  const request = event.request;
  const url = new URL(request.url);
  if (request.method !== "GET" || url.origin !== self.location.origin) return;

  // Reopening the CRM always checks the network. Offline never restores a cached
  // customer screen, local permissions, or an old copy of the application HTML.
  if (request.mode === "navigate") {
    event.respondWith(
      fetch(request).catch(async () => {
        const cache = await caches.open(CACHE_NAME);
        return (
          (await cache.match(
            new URL("offline.html", self.registration.scope).pathname,
          )) || Response.error()
        );
      }),
    );
    return;
  }

  if (url.search || !STATIC_PATHS.has(url.pathname)) return;
  event.respondWith(
    (async () => {
      const cache = await caches.open(CACHE_NAME);
      const cached = await cache.match(url.pathname);
      if (cached) return cached;
      const response = await fetch(request);
      if (response.ok && response.type === "basic")
        await cache.put(url.pathname, response.clone());
      return response;
    })(),
  );
});
