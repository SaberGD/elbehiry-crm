/* Generated build values. Cache public application files only, never CRM responses. */
const CACHE_NAME = "behery-static-529ca0f941a435e3";
const PRECACHE_URLS = ["/assets/AuditLogPage-pKw57aB8.js","/assets/BranchesTeamsPage-WV83nD_H.js","/assets/BrokersPage-Dx4AWaLr.js","/assets/CRMContext-DPWJSKzf.js","/assets/DepartmentDashboardPage-BwUwxjt5.js","/assets/DeveloperPage-BdC7JzNj.js","/assets/EmployeeRatings-DttXfEjS.js","/assets/FeedbackPage-DnbdolH4.js","/assets/OverviewPage--w6FezP0.js","/assets/PermissionsPage-CSz7-WDV.js","/assets/ReportsPage-XkW-QGdY.js","/assets/SettingsPage-D-Xu9Oco.js","/assets/StaffUsersPage-B5ZyUxj8.js","/assets/TeamsPage-B_9uvKRs.js","/assets/briefcase-cbf1dNhm.js","/assets/createLucideIcon-0lsz62cM.js","/assets/demoData-B5bepnuo.js","/assets/index-BiTKuRvj.css","/assets/index-C8DTmFc4.js","/assets/initialData-tH5-RzNa.js","/assets/postSale-DpkFN8n5.js","/assets/trending-down-D8dyXsH6.js","/assets/trending-up-DkK4cEA1.js","/fonts/fonts.css","/fonts/ibm-plex-sans-arabic-arabic-400-normal.woff2","/fonts/ibm-plex-sans-arabic-arabic-500-normal.woff2","/fonts/ibm-plex-sans-arabic-arabic-600-normal.woff2","/fonts/ibm-plex-sans-arabic-arabic-700-normal.woff2","/fonts/ibm-plex-sans-arabic-latin-400-normal.woff2","/fonts/ibm-plex-sans-arabic-latin-500-normal.woff2","/fonts/ibm-plex-sans-arabic-latin-600-normal.woff2","/fonts/ibm-plex-sans-arabic-latin-700-normal.woff2","/icons/apple-touch-icon.png","/icons/favicon-32.png","/icons/icon-192.png","/icons/icon-512.png","/icons/icon-maskable-512.png","/offline.html"];
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
