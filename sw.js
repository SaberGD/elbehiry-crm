/* Generated build values. Cache public application files only, never CRM responses. */
const CACHE_NAME = "behery-static-8e1e00a62823c8b4";
const PRECACHE_URLS = ["/assets/AuditLogPage-Bo1A9ZNY.js","/assets/BranchesTeamsPage-D0vJgvSg.js","/assets/BrokersPage-Cpidh9Qx.js","/assets/CRMContext-DcYjF9mZ.js","/assets/DepartmentDashboardPage-DJ0Rf_Cu.js","/assets/DeveloperPage-B0C6H0C_.js","/assets/FeedbackPage-DBuwyTNh.js","/assets/OverviewPage-ByoGxlMC.js","/assets/PermissionsPage-BDwyDTwi.js","/assets/ReportsPage-rJA39vnK.js","/assets/SettingsPage-BxJ0zRtw.js","/assets/StaffUsersPage-Bje669zT.js","/assets/TeamsPage-BsC3PAua.js","/assets/briefcase-3ITgq7fq.js","/assets/createLucideIcon-CcyXkRYo.js","/assets/demoData-DU3Mhd29.js","/assets/index-BOXS4Zl6.css","/assets/index-CbnZcuJc.js","/assets/initialData-XeJTjNhY.js","/assets/postSale-9mtkua2x.js","/assets/trending-up-MSqKhsgr.js","/fonts/fonts.css","/fonts/ibm-plex-sans-arabic-arabic-400-normal.woff2","/fonts/ibm-plex-sans-arabic-arabic-500-normal.woff2","/fonts/ibm-plex-sans-arabic-arabic-600-normal.woff2","/fonts/ibm-plex-sans-arabic-arabic-700-normal.woff2","/fonts/ibm-plex-sans-arabic-latin-400-normal.woff2","/fonts/ibm-plex-sans-arabic-latin-500-normal.woff2","/fonts/ibm-plex-sans-arabic-latin-600-normal.woff2","/fonts/ibm-plex-sans-arabic-latin-700-normal.woff2","/icons/apple-touch-icon.png","/icons/favicon-32.png","/icons/icon-192.png","/icons/icon-512.png","/icons/icon-maskable-512.png","/offline.html"];
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
