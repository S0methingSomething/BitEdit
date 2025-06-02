// sw.js - Service Worker for BitEdit

// GITHUB_ACTION_MARKER_SW_CACHE_NAME (Do not remove or alter this line)
const CACHE_NAME = '1.4.3'; // Increment version to force update
const PRECACHE_ASSETS = [
    './', // Alias for index.html
    './index.html',
    './manifest.json',
    // Tailwind CSS (CDN)
    'https://cdn.tailwindcss.com',
    // Google Fonts CSS
    'https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap',
    // Default PFP image
    'https://avatars.githubusercontent.com/S0methingSomething?v=4&s=128',
];

// URLs that should always go to the network
const NETWORK_ONLY_PATTERNS = [
    /api\.github\.com/, // GitHub API calls
    /Get_Bitlife_Version\/version\.txt/, // Specific path for BitLife version
    /S0methingSomething\/BitEdit\/main\/BitEdit\/BitEdit_version\.txt/, // App's own version file from GitHub raw.
];


self.addEventListener('install', event => {
    console.log('[ServiceWorker] Install');
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then(cache => {
                console.log('[ServiceWorker] Pre-caching app shell');
                const requests = PRECACHE_ASSETS.map(url => {
                    if (url.startsWith('http')) {
                        return new Request(url, { mode: 'cors' });
                    }
                    return url;
                });
                return cache.addAll(requests)
                    .catch(error => {
                        console.error('[ServiceWorker] Failed to pre-cache one or more resources:', error);
                        requests.forEach(req => {
                            const urlToFetch = (typeof req === 'string') ? req : req.url;
                            fetch(req).catch(fetchError => console.error(`[ServiceWorker] Pre-cache check failed for ${urlToFetch}:`, fetchError));
                        });
                    });
            })
            .then(() => {
                console.log('[ServiceWorker] Skip waiting on install');
                return self.skipWaiting();
            })
    );
});

self.addEventListener('activate', event => {
    console.log('[ServiceWorker] Activate');
    event.waitUntil(
        caches.keys().then(cacheNames => {
            return Promise.all(
                cacheNames.map(cacheName => {
                    if (cacheName !== CACHE_NAME) {
                        console.log('[ServiceWorker] Deleting old cache:', cacheName);
                        return caches.delete(cacheName);
                    }
                })
            );
        }).then(() => {
            console.log('[ServiceWorker] Clients claimed');
            return self.clients.claim();
        })
    );
});

self.addEventListener('fetch', event => {
    const requestUrl = new URL(event.request.url);

    if (event.request.method !== 'GET') {
        event.respondWith(fetch(event.request));
        return;
    }

    if (NETWORK_ONLY_PATTERNS.some(pattern => pattern.test(requestUrl.href))) {
        // console.log('[ServiceWorker] Network-only fetch (pattern matched):', requestUrl.href);
        event.respondWith(
            fetch(event.request).catch(error => {
                console.error('[ServiceWorker] Network-only fetch failed:', error, requestUrl.href);
                throw error; 
            })
        );
        return;
    }

    event.respondWith(
        caches.match(event.request)
            .then(cachedResponse => {
                if (cachedResponse) {
                    // console.log('[ServiceWorker] Serving from cache:', event.request.url);
                    return cachedResponse;
                }

                // console.log('[ServiceWorker] Fetching from network and caching:', event.request.url);
                return fetch(event.request).then(networkResponse => {
                    if (networkResponse && networkResponse.status === 200 && networkResponse.type !== 'opaque') {
                        const responseToCache = networkResponse.clone();
                        caches.open(CACHE_NAME)
                            .then(cache => {
                                cache.put(event.request, responseToCache);
                            });
                    } else if (networkResponse && networkResponse.type === 'opaque') {
                        const responseToCache = networkResponse.clone();
                        caches.open(CACHE_NAME)
                            .then(cache => {
                                cache.put(event.request, responseToCache);
                            });
                    }
                    return networkResponse;
                }).catch(error => {
                    console.warn('[ServiceWorker] Network fetch failed, no cache hit:', error, event.request.url);
                    if (event.request.mode === 'navigate') {
                        // Consider returning a generic offline page if you have one:
                        // return caches.match('./offline.html');
                    }
                    throw error;
                });
            })
    );
});

self.addEventListener('message', event => {
    if (event.data && event.data.type === 'SKIP_WAITING') {
        console.log('[ServiceWorker] Received SKIP_WAITING message, skipping wait...');
        self.skipWaiting();
    }
});
