// ============================================================
// sw.js - Service Worker untuk DUKOPS BABINSA
// VERSI LENGKAP - DIPERBAIKI
// ============================================================

const CACHE_NAME = 'dukops-v2';
const ASSETS_CACHE = 'dukops-assets-v2';
const DYNAMIC_CACHE = 'dukops-dynamic-v2';

// ============================================================
// 1. FILE YANG DI-CACHE SAAT INSTALL
// ============================================================
const urlsToCache = [
    // HTML
    'index.html',
    
    // CSS
    'styles.css',
    'css/main.css',  // Fallback jika ada
    
    // JavaScript Utama
    'app.js',
    
    // Icons
    'icons/favicon-96x96.png',
    'icons/favicon.svg',
    'icons/favicon.ico',
    'icons/apple-touch-icon.png',
    
    // PWA
    'site.webmanifest',
    
    // Logo
    'LOGO KOREM163 Wirasatya.png',
    'army.gif',
    
    // Header Background
    'header/header-background.png'
];

// ============================================================
// 2. INSTALL - Cache assets
// ============================================================
self.addEventListener('install', event => {
    console.log('📦 Installing DUKOPS Service Worker...');
    
    event.waitUntil(
        caches.open(ASSETS_CACHE)
            .then(cache => {
                console.log('📦 Caching DUKOPS assets...');
                // Cache each file individually to avoid failing all if one fails
                const cachePromises = urlsToCache.map(url => {
                    return cache.add(url).catch(err => {
                        console.warn('⚠️ Failed to cache:', url, err);
                    });
                });
                return Promise.all(cachePromises);
            })
            .then(() => {
                console.log('✅ Assets cached successfully');
                return self.skipWaiting();
            })
    );
});

// ============================================================
// 3. ACTIVATE - Clean old caches
// ============================================================
self.addEventListener('activate', event => {
    console.log('🚀 Activating DUKOPS Service Worker...');
    
    const cacheWhitelist = [ASSETS_CACHE, DYNAMIC_CACHE];
    
    event.waitUntil(
        caches.keys().then(cacheNames => {
            return Promise.all(
                cacheNames.map(cacheName => {
                    if (!cacheWhitelist.includes(cacheName)) {
                        console.log('🗑️ Deleting old cache:', cacheName);
                        return caches.delete(cacheName);
                    }
                })
            );
        })
        .then(() => {
            console.log('✅ Service Worker activated');
            return self.clients.claim();
        })
    );
});

// ============================================================
// 4. FETCH - Cache-first strategy with network fallback
// ============================================================
self.addEventListener('fetch', event => {
    const request = event.request;
    const url = new URL(request.url);
    
    // Skip cross-origin requests
    if (url.origin !== location.origin) {
        return;
    }
    
    // Skip non-GET requests
    if (request.method !== 'GET') {
        return;
    }
    
    // Skip analytics/telemetry
    if (request.url.includes('analytics') || request.url.includes('telemetry')) {
        return;
    }
    
    event.respondWith(
        caches.match(request)
            .then(cachedResponse => {
                // Return cached response if available
                if (cachedResponse) {
                    // Update cache in background for HTML and JS files
                    if (request.url.endsWith('.html') || 
                        request.url.endsWith('.js') || 
                        request.url.includes('app.js')) {
                        fetchAndCache(request);
                    }
                    return cachedResponse;
                }
                
                // For data files, try network first then cache
                if (request.url.includes('/data/') || 
                    request.url.includes('/coordinates/') ||
                    request.url.includes('/profile/')) {
                    return networkFirstStrategy(request);
                }
                
                // For everything else, network with cache fallback
                return networkWithCacheFallback(request);
            })
            .catch(() => {
                // Offline fallback
                return getOfflineResponse(request);
            })
    );
});

// ============================================================
// 5. NETWORK FIRST STRATEGY (for data)
// ============================================================
async function networkFirstStrategy(request) {
    try {
        const networkResponse = await fetch(request);
        if (networkResponse && networkResponse.status === 200) {
            const cache = await caches.open(DYNAMIC_CACHE);
            cache.put(request, networkResponse.clone());
            return networkResponse;
        }
        throw new Error('Network response not valid');
    } catch (error) {
        const cachedResponse = await caches.match(request);
        if (cachedResponse) {
            return cachedResponse;
        }
        throw error;
    }
}

// ============================================================
// 6. NETWORK WITH CACHE FALLBACK
// ============================================================
async function networkWithCacheFallback(request) {
    try {
        const networkResponse = await fetch(request);
        if (networkResponse && networkResponse.status === 200) {
            const cache = await caches.open(DYNAMIC_CACHE);
            cache.put(request, networkResponse.clone());
            return networkResponse;
        }
        throw new Error('Network response not valid');
    } catch (error) {
        const cachedResponse = await caches.match(request);
        if (cachedResponse) {
            return cachedResponse;
        }
        throw error;
    }
}

// ============================================================
// 7. FETCH AND CACHE (background update)
// ============================================================
async function fetchAndCache(request) {
    try {
        const response = await fetch(request);
        if (response && response.status === 200) {
            const cache = await caches.open(ASSETS_CACHE);
            cache.put(request, response.clone());
        }
    } catch (error) {
        // Silently fail - background updates shouldn't affect user
    }
}

// ============================================================
// 8. OFFLINE RESPONSE
// ============================================================
async function getOfflineResponse(request) {
    const url = new URL(request.url);
    const path = url.pathname;
    
    // HTML pages - show offline page
    if (path.endsWith('.html') || path === '/') {
        return new Response(`
            <!DOCTYPE html>
            <html lang="id">
            <head>
                <meta charset="UTF-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <title>DUKOPS - Offline</title>
                <style>
                    * { margin:0; padding:0; box-sizing:border-box; }
                    body {
                        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Arial, sans-serif;
                        background: #0a1a0a;
                        color: #e0e8e0;
                        display: flex;
                        align-items: center;
                        justify-content: center;
                        min-height: 100vh;
                        padding: 20px;
                        text-align: center;
                    }
                    .offline-box {
                        background: #1a2a1a;
                        border: 2px solid #4CAF50;
                        border-radius: 16px;
                        padding: 40px;
                        max-width: 400px;
                        width: 100%;
                        box-shadow: 0 8px 32px rgba(0,0,0,0.5);
                    }
                    .offline-icon {
                        font-size: 64px;
                        margin-bottom: 20px;
                    }
                    h1 {
                        color: #4CAF50;
                        font-size: 24px;
                        margin-bottom: 10px;
                    }
                    p {
                        color: #889988;
                        font-size: 14px;
                        line-height: 1.6;
                        margin-bottom: 20px;
                    }
                    .btn-retry {
                        background: #4CAF50;
                        color: #0a1a0a;
                        border: none;
                        padding: 12px 30px;
                        border-radius: 8px;
                        font-size: 16px;
                        font-weight: bold;
                        cursor: pointer;
                        transition: background 0.2s;
                    }
                    .btn-retry:hover {
                        background: #66bb6a;
                    }
                    .btn-retry:active {
                        transform: scale(0.95);
                    }
                    .status {
                        font-size: 12px;
                        color: #556655;
                        margin-top: 15px;
                    }
                </style>
            </head>
            <body>
                <div class="offline-box">
                    <div class="offline-icon">📡</div>
                    <h1>DUKOPS BABINSA</h1>
                    <p>
                        Anda sedang <strong>offline</strong>.<br>
                        Silakan periksa koneksi internet Anda.
                    </p>
                    <button class="btn-retry" onclick="location.reload()">
                        🔄 COBA LAGI
                    </button>
                    <div class="status">KORAMIL 1609-05/SUKASADA</div>
                </div>
            </body>
            </html>
        `, {
            status: 200,
            headers: { 'Content-Type': 'text/html' }
        });
    }
    
    // Images - return placeholder
    if (path.match(/\.(png|jpg|jpeg|gif|svg|ico)$/)) {
        const cache = await caches.open(ASSETS_CACHE);
        const cachedIcon = await cache.match('icons/favicon-96x96.png');
        if (cachedIcon) {
            return cachedIcon;
        }
        // Simple placeholder SVG
        return new Response(`
            <svg xmlns="http://www.w3.org/2000/svg" width="96" height="96" viewBox="0 0 96 96">
                <rect width="96" height="96" fill="#1a2a1a"/>
                <text x="48" y="52" font-family="Arial" font-size="40" text-anchor="middle" fill="#4CAF50">📋</text>
            </svg>
        `, {
            status: 200,
            headers: { 'Content-Type': 'image/svg+xml' }
        });
    }
    
    // CSS - return minimal
    if (path.endsWith('.css')) {
        return new Response(`
            /* Minimal CSS for offline */
            body { background: #0a1a0a; color: #e0e8e0; font-family: Arial, sans-serif; }
            .container { max-width: 600px; margin: 40px auto; padding: 20px; }
        `, {
            status: 200,
            headers: { 'Content-Type': 'text/css' }
        });
    }
    
    // Default fallback
    return new Response('Offline - Please check your connection', {
        status: 200,
        headers: { 'Content-Type': 'text/plain' }
    });
}

// ============================================================
// 9. MESSAGE HANDLER
// ============================================================
self.addEventListener('message', event => {
    if (event.data && event.data.type === 'SKIP_WAITING') {
        self.skipWaiting();
    }
});

// ============================================================
// 10. LOGGING
// ============================================================
console.log('📱 DUKOPS Service Worker loaded');
console.log('📦 Cache name:', CACHE_NAME);
console.log('📦 Assets cached:', urlsToCache.length, 'files');
