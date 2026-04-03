// SmartBasket Service Worker — Caching & Offline Support

const CACHE_NAME = 'smartbasket-v2';
const STATIC_ASSETS = [
  '/',
  '/manifest.json',
  '/logo.png',
  '/icons/icon-192.png',
  '/icons/icon-512.png',
];

const API_CACHE_NAME = 'smartbasket-api-v1';
const API_CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

const IMAGE_CACHE_NAME = 'smartbasket-images-v1';
const IMAGE_CACHE_DURATION = 24 * 60 * 60 * 1000; // 24 hours

// Install: Pre-cache critical static assets
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => cache.addAll(STATIC_ASSETS))
      .then(() => self.skipWaiting())
  );
});

// Activate: Clean up old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(
        keys
          .filter((key) => key !== CACHE_NAME && key !== API_CACHE_NAME && key !== IMAGE_CACHE_NAME)
          .map((key) => caches.delete(key))
      ))
      .then(() => self.clients.claim())
  );
});

// Fetch: Network-first for API, Cache-first for images, Network-first for pages
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip non-GET requests
  if (request.method !== 'GET') return;

  // Skip download/source-code endpoints — never cache these
  if (
    url.pathname.includes('download') ||
    url.pathname.includes('source-code') ||
    url.pathname.includes('get-source')
  ) {
    return; // Let browser handle directly, bypass service worker
  }

  // API requests: Network-first with API cache
  if (url.pathname.startsWith('/api/')) {
    event.respondWith(networkFirstWithApiCache(request));
    return;
  }

  // Image requests: Cache-first with expiry
  if (
    url.pathname.startsWith('/products/') ||
    url.pathname.startsWith('/cat-') ||
    url.pathname.startsWith('/hero-') ||
    url.pathname.startsWith('/icons/')
  ) {
    event.respondWith(cacheFirstWithExpiry(request, IMAGE_CACHE_NAME, IMAGE_CACHE_DURATION));
    return;
  }

  // Static assets & pages: Stale-while-revalidate
  event.respondWith(staleWhileRevalidate(request));
});

// Strategy: Network-first with API cache fallback
async function networkFirstWithApiCache(request) {
  try {
    const response = await fetch(request);
    if (response.ok) {
      const cache = await caches.open(API_CACHE_NAME);
      cache.put(request, response.clone());
    }
    return response;
  } catch (error) {
    const cached = await caches.match(request);
    if (cached) {
      return cached;
    }
    // Return offline fallback for API calls
    return new Response(
      JSON.stringify({ error: 'You are offline. Please check your internet connection.' }),
      {
        status: 503,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }
}

// Strategy: Cache-first with expiry
async function cacheFirstWithExpiry(request, cacheName, maxAge) {
  const cache = await caches.open(cacheName);
  const cached = await cache.match(request);

  if (cached) {
    const cachedTime = cached.headers.get('sw-cache-time');
    if (cachedTime && Date.now() - parseInt(cachedTime) < maxAge) {
      return cached;
    }
    // Cache expired, remove it
    cache.delete(request);
  }

  try {
    const response = await fetch(request);
    if (response.ok) {
      const clonedResponse = response.clone();
      // Add cache timestamp header
      const headers = new Headers(clonedResponse.headers);
      headers.set('sw-cache-time', Date.now().toString());
      const body = await clonedResponse.blob();
      const timestampedResponse = new Response(body, { headers });
      cache.put(request, timestampedResponse);
    }
    return response;
  } catch (error) {
    if (cached) return cached; // Return stale if network fails
    return new Response('', { status: 408, statusText: 'Request timeout' });
  }
}

// Strategy: Stale-while-revalidate
async function staleWhileRevalidate(request) {
  const cache = await caches.open(CACHE_NAME);
  const cached = await cache.match(request);

  const fetchPromise = fetch(request)
    .then((response) => {
      if (response.ok) {
        cache.put(request, response.clone());
      }
      return response;
    })
    .catch(() => {
      // Network failed, return cached if available
      if (cached) return cached;
      return new Response('Offline', { status: 503 });
    });

  return cached || fetchPromise;
}
