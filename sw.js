/* Generated build values. Cache public application files only, never CRM responses. */
const CACHE_NAME = "behery-static-4b97f23d2aa684ac";
const PRECACHE_URLS = ["/assets/AuditLogPage-Csk2XOvo.js","/assets/BranchesTeamsPage-CnpgvAtm.js","/assets/BrokersPage-DOXBCghJ.js","/assets/CRMContext-CGktT-NR.js","/assets/DepartmentDashboardPage-BhOVtEQT.js","/assets/DeveloperPage-D14Ey3FU.js","/assets/FeedbackPage-n_CWBxjv.js","/assets/OverviewPage-BHYrxW-x.js","/assets/PermissionsPage-B3qMSg4L.js","/assets/ReportsPage-DcekKqBP.js","/assets/SettingsPage-SiRRHkos.js","/assets/StaffUsersPage-JojMSqEM.js","/assets/TeamsPage-D3-A4VIm.js","/assets/briefcase-DNvKaWcq.js","/assets/createLucideIcon-__4-CoAm.js","/assets/demoData-CBVELCCc.js","/assets/index-5O3iTo84.js","/assets/index-tso3h-Td.css","/assets/initialData-XeJTjNhY.js","/assets/postSale-DA5_bQYf.js","/assets/trending-up-DJ61MQzI.js","/fonts/fonts.css","/fonts/ibm-plex-sans-arabic-arabic-400-normal.woff2","/fonts/ibm-plex-sans-arabic-arabic-500-normal.woff2","/fonts/ibm-plex-sans-arabic-arabic-600-normal.woff2","/fonts/ibm-plex-sans-arabic-arabic-700-normal.woff2","/fonts/ibm-plex-sans-arabic-latin-400-normal.woff2","/fonts/ibm-plex-sans-arabic-latin-500-normal.woff2","/fonts/ibm-plex-sans-arabic-latin-600-normal.woff2","/fonts/ibm-plex-sans-arabic-latin-700-normal.woff2","/icons/apple-touch-icon.png","/icons/favicon-32.png","/icons/icon-192.png","/icons/icon-512.png","/icons/icon-maskable-512.png","/offline.html"];
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
