/* Generated build values. Cache public application files only, never CRM responses. */
const CACHE_NAME = "behery-static-e204dcf80e13f2e5";
const PRECACHE_URLS = ["/assets/AuditLogPage-CKvdXD9H.js","/assets/BranchesTeamsPage-B7oZbrTu.js","/assets/BrokersPage-DQlD455S.js","/assets/CRMContext-Cx13Mbgm.js","/assets/DepartmentDashboardPage-CkyheLQ6.js","/assets/DeveloperPage-5pWPtXHk.js","/assets/EmployeeRatings-Btk6v4Xs.js","/assets/FeedbackPage-Bixd32GG.js","/assets/OverviewPage-OLzp9QcD.js","/assets/PermissionsPage-L-9fSmAe.js","/assets/ReportsPage-BJtTu6CR.js","/assets/SettingsPage-C9mXyZNJ.js","/assets/StaffUsersPage-CvkmQSS9.js","/assets/TeamsPage-CR2SX6AF.js","/assets/briefcase-DjAcQSRI.js","/assets/createLucideIcon-zmwcfUfb.js","/assets/demoData-C0vo1tl2.js","/assets/index-1g-TJmL1.js","/assets/index-Bms3cc9m.css","/assets/initialData-tH5-RzNa.js","/assets/postSale-BKTS85Mv.js","/assets/trending-down-BfQAZBD4.js","/assets/trending-up-LvJRtjwg.js","/fonts/fonts.css","/fonts/ibm-plex-sans-arabic-arabic-400-normal.woff2","/fonts/ibm-plex-sans-arabic-arabic-500-normal.woff2","/fonts/ibm-plex-sans-arabic-arabic-600-normal.woff2","/fonts/ibm-plex-sans-arabic-arabic-700-normal.woff2","/fonts/ibm-plex-sans-arabic-latin-400-normal.woff2","/fonts/ibm-plex-sans-arabic-latin-500-normal.woff2","/fonts/ibm-plex-sans-arabic-latin-600-normal.woff2","/fonts/ibm-plex-sans-arabic-latin-700-normal.woff2","/icons/apple-touch-icon.png","/icons/favicon-32.png","/icons/icon-192.png","/icons/icon-512.png","/icons/icon-maskable-512.png","/offline.html"];
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
