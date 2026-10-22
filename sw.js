/* Generated build values. Cache public application files only, never CRM responses. */
const CACHE_NAME = "behery-static-7f76bf9f766fa835";
const PRECACHE_URLS = ["/assets/AuditLogPage-aDeJLxHd.js","/assets/BranchesTeamsPage-DiGSXgfj.js","/assets/BrokersPage-DBIQXgmN.js","/assets/CRMContext-DinAdRdr.js","/assets/DepartmentDashboardPage-CjFcDazO.js","/assets/DeveloperPage-C1MQDoUR.js","/assets/EmployeeRatings-C-TaoRCU.js","/assets/FeedbackPage-BRy9Y4I9.js","/assets/OverviewPage-BaJkDAGy.js","/assets/PermissionsPage-C-xWXLWg.js","/assets/ReportsPage-DQnSGMzc.js","/assets/SettingsPage-CgOZtgvI.js","/assets/StaffUsersPage-DIa_RxoU.js","/assets/TeamsPage-BFotyzGy.js","/assets/briefcase-q3yZOkX4.js","/assets/createLucideIcon-h4s0-4S1.js","/assets/demoData-eRjUcscM.js","/assets/index-CCMZJuyB.css","/assets/index-T0iSfvqR.js","/assets/initialData-tH5-RzNa.js","/assets/postSale-DNMM2X3j.js","/assets/trending-down-cSZV4c6-.js","/assets/trending-up-D-SYkbbf.js","/fonts/fonts.css","/fonts/ibm-plex-sans-arabic-arabic-400-normal.woff2","/fonts/ibm-plex-sans-arabic-arabic-500-normal.woff2","/fonts/ibm-plex-sans-arabic-arabic-600-normal.woff2","/fonts/ibm-plex-sans-arabic-arabic-700-normal.woff2","/fonts/ibm-plex-sans-arabic-latin-400-normal.woff2","/fonts/ibm-plex-sans-arabic-latin-500-normal.woff2","/fonts/ibm-plex-sans-arabic-latin-600-normal.woff2","/fonts/ibm-plex-sans-arabic-latin-700-normal.woff2","/icons/apple-touch-icon.png","/icons/favicon-32.png","/icons/icon-192.png","/icons/icon-512.png","/icons/icon-maskable-512.png","/offline.html"];
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
