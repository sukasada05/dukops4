// sw.js - Service Worker untuk DUKOPS
const CACHE_NAME = 'dukops-v30';

const urlsToCache = [
    'index.html',
    'app.js',
    'thankyou.html',
    'js/indonesian-voice.js',
    'header/header-background.png',
    'kamuflase.png',
    'css/main.css',
    'icons/favicon-96x96.png',
    'icons/favicon.svg',
    'site.webmanifest'
];

function isNavigationRequest(request) {
    return request.mode === 'navigate' || request.headers.get('accept')?.includes('text/html');
}

function isStaticAssetRequest(url) {
    const pathname = url.pathname.toLowerCase();
    return pathname.endsWith('.js') ||
        pathname.endsWith('.css') ||
        pathname.endsWith('.png') ||
        pathname.endsWith('.svg') ||
        pathname.endsWith('.webp') ||
        pathname.endsWith('.manifest') ||
        pathname.endsWith('.html');
}

// ============================================================
// INSTALL - Caching assets
// ============================================================
self.addEventListener('install', event => {
    console.log('🔧 SW Install event triggered');
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then(cache => {
                console.log('📦 Caching DUKOPS assets...');
                return cache.addAll(urlsToCache)
                    .then(() => {
                        console.log('✅ All assets cached successfully!');
                    })
                    .catch(err => {
                        console.error('❌ Failed to cache some assets:', err);
                    });
            })
            .then(() => {
                console.log('✅ SW Install complete, skipWaiting...');
                return self.skipWaiting();
            })
    );
});

// ============================================================
// ACTIVATE - Clean old caches
// ============================================================
self.addEventListener('activate', event => {
    console.log('🔧 SW Activate event triggered');
    event.waitUntil(
        caches.keys().then(cacheNames => {
            return Promise.all(
                cacheNames.map(cacheName => {
                    if (cacheName !== CACHE_NAME) {
                        console.log('🗑️ Deleting old cache:', cacheName);
                        return caches.delete(cacheName);
                    }
                    return null;
                })
            );
        }).then(() => {
            console.log('✅ SW Activated, claiming clients...');
            return self.clients.claim();
        })
    );
});

self.addEventListener('message', event => {
    if (event.data && event.data.type === 'SKIP_WAITING') {
        self.skipWaiting();
    }
});

// ============================================================
// FETCH - Stale-safe caching strategy
// ============================================================
self.addEventListener('fetch', event => {
    const request = event.request;
    const url = new URL(request.url);

    if (request.method !== 'GET') return;
    if (url.origin !== self.location.origin) return;

    if (isNavigationRequest(request)) {
        event.respondWith(
            fetch(request)
                .then(response => {
                    if (response && response.ok) {
                        const copy = response.clone();
                        caches.open(CACHE_NAME).then(cache => cache.put(request, copy));
                    }
                    return response;
                })
                .catch(() => caches.match(request).then(cached => {
                    if (cached) return cached;
                    return new Response(`<!DOCTYPE html><html><body><h1>DUKOPS Offline</h1><p>Anda sedang offline.</p></body></html>`, {
                        status: 200,
                        headers: { 'Content-Type': 'text/html; charset=utf-8' }
                    });
                }))
        );
        return;
    }

    if (isStaticAssetRequest(url) || request.destination === 'script' || request.destination === 'style' || request.destination === 'image') {
        event.respondWith(
            caches.match(request)
                .then(cached => {
                    const fetchPromise = fetch(request)
                        .then(response => {
                            if (response && response.ok) {
                                const copy = response.clone();
                                caches.open(CACHE_NAME).then(cache => cache.put(request, copy));
                            }
                            return response;
                        })
                        .catch(() => cached);

                    return cached || fetchPromise;
                })
        );
        return;
    }

    // fallback default: network-first for data / runtime content
    event.respondWith(
        fetch(request)
            .then(response => {
                if (response && response.ok) {
                    const copy = response.clone();
                    caches.open(CACHE_NAME).then(cache => cache.put(request, copy));
                }
                return response;
            })
            .catch(() => caches.match(request))
    );
});

console.log('📱 DUKOPS Service Worker loaded (v30)');
console.log('📦 Cache name:', CACHE_NAME);
