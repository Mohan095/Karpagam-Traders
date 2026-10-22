/* ===================================================================
   Karpagam Traders Sivakasi - Production PWA Service Worker
   Compliant with PWABuilder, W3C Standards & Lighthouse Requirements
   =================================================================== */

const VERSION = 'v1.0.0';
const STATIC_CACHE_NAME = `karpagam-static-${VERSION}`;
const DYNAMIC_CACHE_NAME = `karpagam-dynamic-${VERSION}`;
const OFFLINE_CACHE_NAME = `karpagam-offline-${VERSION}`;

// Precache essential application shell and offline assets
const PRECACHE_ASSETS = [
  '/',
  '/index.html',
  '/offline.html',
  '/manifest.json',
  '/favicon.ico',
  '/apple-touch-icon.png',
  '/icons/icon-192x192.png',
  '/icons/icon-512x512.png',
  '/icons/maskable-icon-192x192.png',
  '/icons/maskable-icon-512x512.png'
];

// Maximum dynamic cache entries to prevent storage bloat
const MAX_DYNAMIC_ITEMS = 60;
async function trimCache(cacheName, maxItems) {
  const cache = await caches.open(cacheName);
  const keys = await cache.keys();
  if (keys.length > maxItems) {
    await cache.delete(keys[0]);
    await trimCache(cacheName, maxItems);
  }
}

/* ---------------------------------------------------------
   1. INSTALL EVENT: Precache offline shell & skip waiting
   --------------------------------------------------------- */
self.addEventListener('install', (event) => {
  event.waitUntil(
    (async () => {
      const cache = await caches.open(STATIC_CACHE_NAME);
      try {
        await cache.addAll(PRECACHE_ASSETS);
      } catch (err) {
        console.warn('PWA Precache warning (some assets may load on-demand):', err);
      }
      // Force the waiting service worker to become active
      return self.skipWaiting();
    })()
  );
});

/* ---------------------------------------------------------
   2. ACTIVATE EVENT: Clean up outdated caches & claim clients
   --------------------------------------------------------- */
self.addEventListener('activate', (event) => {
  event.waitUntil(
    (async () => {
      const cacheNames = await caches.keys();
      const currentCaches = [STATIC_CACHE_NAME, DYNAMIC_CACHE_NAME, OFFLINE_CACHE_NAME];
      
      await Promise.all(
        cacheNames.map((name) => {
          if (!currentCaches.includes(name)) {
            return caches.delete(name);
          }
          return null;
        })
      );
      // Immediately take control of all clients
      return self.clients.claim();
    })()
  );
});

/* ---------------------------------------------------------
   3. FETCH EVENT: Intelligent Caching & Offline Fallbacks
   --------------------------------------------------------- */
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // A. Only handle HTTP/HTTPS GET requests. Skip chrome-extension, POST, PUT, DELETE
  if (request.method !== 'GET' || !url.protocol.startsWith('http')) {
    return;
  }

  // B. Navigation Requests (HTML Pages): Network First -> Cache -> Offline Fallback
  if (request.mode === 'navigate') {
    event.respondWith(
      (async () => {
        try {
          // Attempt network first for freshest content
          const networkResponse = await fetch(request);
          if (networkResponse && networkResponse.status === 200) {
            const cache = await caches.open(DYNAMIC_CACHE_NAME);
            cache.put(request, networkResponse.clone());
          }
          return networkResponse;
        } catch (networkError) {
          // If network fails, try cached copy
          const cachedResponse = await caches.match(request);
          if (cachedResponse) {
            return cachedResponse;
          }
          // Fallback to pre-cached index.html or offline.html
          const offlinePage = await caches.match('/offline.html');
          if (offlinePage) {
            return offlinePage;
          }
          const indexFallback = await caches.match('/index.html');
          return indexFallback || Response.error();
        }
      })()
    );
    return;
  }

  // C. Static Assets (Scripts, CSS, Images, Fonts, Icons): Stale-While-Revalidate
  const isStaticAsset = 
    url.pathname.match(/\.(js|css|png|jpg|jpeg|svg|webp|ico|woff|woff2|ttf|eot)$/i) ||
    url.hostname.includes('fonts.googleapis.com') ||
    url.hostname.includes('fonts.gstatic.com') ||
    url.hostname.includes('cdnjs.cloudflare.com');

  if (isStaticAsset) {
    event.respondWith(
      (async () => {
        const cachedResponse = await caches.match(request);

        const fetchPromise = fetch(request).then(async (networkResponse) => {
          if (networkResponse && networkResponse.status === 200) {
            const cache = await caches.open(STATIC_CACHE_NAME);
            cache.put(request, networkResponse.clone());
            trimCache(STATIC_CACHE_NAME, MAX_DYNAMIC_ITEMS);
          }
          return networkResponse;
        }).catch((err) => {
          // Network failed, nothing to revalidate
          return null;
        });

        // Return cache immediately if found, otherwise wait for network
        return cachedResponse || fetchPromise;
      })()
    );
    return;
  }

  // D. Other GET requests (e.g., API queries): Network First with Cache Fallback
  event.respondWith(
    (async () => {
      try {
        const networkResponse = await fetch(request);
        if (networkResponse && networkResponse.status === 200) {
          const cache = await caches.open(DYNAMIC_CACHE_NAME);
          cache.put(request, networkResponse.clone());
          trimCache(DYNAMIC_CACHE_NAME, MAX_DYNAMIC_ITEMS);
        }
        return networkResponse;
      } catch (err) {
        const cachedResponse = await caches.match(request);
        if (cachedResponse) {
          return cachedResponse;
        }
        return new Response(JSON.stringify({ error: 'Network unavailable', offline: true }), {
          status: 503,
          headers: { 'Content-Type': 'application/json' }
        });
      }
    })()
  );
});

/* ---------------------------------------------------------
   4. MESSAGE EVENT: Listen for SKIP_WAITING signals
   --------------------------------------------------------- */
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});
