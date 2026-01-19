// Offline Maps Service Worker
// Caches Mapbox tiles for offline use during trips

const CACHE_NAME = 'roadtribe-offline-maps-v1';
const TILE_CACHE_NAME = 'roadtribe-map-tiles-v1';
const MAX_CACHE_AGE_MS = 7 * 24 * 60 * 60 * 1000; // 7 days

// Mapbox tile URL patterns to intercept
const MAPBOX_PATTERNS = [
  /api\.mapbox\.com\/v4\//,
  /api\.mapbox\.com\/styles\/v1\//,
  /api\.mapbox\.com\/fonts\//,
  /api\.mapbox\.com\/sprites\//,
];

// Check if URL should be cached
function shouldCacheRequest(url) {
  return MAPBOX_PATTERNS.some(pattern => pattern.test(url));
}

// Generate cache key from URL (strip access token for consistent keys)
function getCacheKey(url) {
  const urlObj = new URL(url);
  urlObj.searchParams.delete('access_token');
  return urlObj.toString();
}

// Install event - set up caches
self.addEventListener('install', (event) => {
  console.log('[SW] Installing offline maps service worker');
  self.skipWaiting();
});

// Activate event - clean old caches
self.addEventListener('activate', (event) => {
  console.log('[SW] Activating offline maps service worker');
  event.waitUntil(
    Promise.all([
      self.clients.claim(),
      cleanExpiredTiles(),
    ])
  );
});

// Fetch event - intercept tile requests
self.addEventListener('fetch', (event) => {
  const url = event.request.url;
  
  if (!shouldCacheRequest(url)) {
    return;
  }

  event.respondWith(
    cacheFirst(event.request)
  );
});

// Cache-first strategy for tiles
async function cacheFirst(request) {
  const cacheKey = getCacheKey(request.url);
  
  try {
    const cache = await caches.open(TILE_CACHE_NAME);
    const cachedResponse = await cache.match(cacheKey);
    
    if (cachedResponse) {
      // Return cached tile
      return cachedResponse;
    }
    
    // Fetch from network
    const networkResponse = await fetch(request);
    
    if (networkResponse.ok) {
      // Clone and cache the response
      const responseToCache = networkResponse.clone();
      cache.put(cacheKey, responseToCache);
    }
    
    return networkResponse;
  } catch (error) {
    // Network failed, try cache again
    const cache = await caches.open(TILE_CACHE_NAME);
    const cachedResponse = await cache.match(cacheKey);
    
    if (cachedResponse) {
      return cachedResponse;
    }
    
    // Return offline fallback or error
    console.error('[SW] Tile fetch failed:', error);
    return new Response('Offline', { status: 503 });
  }
}

// Clean expired tiles from cache
async function cleanExpiredTiles() {
  try {
    const cache = await caches.open(TILE_CACHE_NAME);
    const keys = await cache.keys();
    const now = Date.now();
    
    for (const request of keys) {
      const response = await cache.match(request);
      if (response) {
        const dateHeader = response.headers.get('date');
        if (dateHeader) {
          const cacheTime = new Date(dateHeader).getTime();
          if (now - cacheTime > MAX_CACHE_AGE_MS) {
            await cache.delete(request);
          }
        }
      }
    }
  } catch (error) {
    console.error('[SW] Error cleaning cache:', error);
  }
}

// Message handler for manual cache operations
self.addEventListener('message', async (event) => {
  const { type, payload } = event.data || {};
  
  switch (type) {
    case 'CACHE_TILES':
      await cacheTiles(payload.urls, event.source);
      break;
      
    case 'CLEAR_CACHE':
      await clearCache(payload?.routeId);
      event.source?.postMessage({ type: 'CACHE_CLEARED' });
      break;
      
    case 'GET_CACHE_SIZE':
      const size = await getCacheSize();
      event.source?.postMessage({ type: 'CACHE_SIZE', payload: size });
      break;
      
    case 'CHECK_CACHED':
      const cached = await checkCached(payload.urls);
      event.source?.postMessage({ type: 'CACHED_STATUS', payload: cached });
      break;
  }
});

// Pre-cache tiles for offline use
async function cacheTiles(urls, client) {
  const cache = await caches.open(TILE_CACHE_NAME);
  const total = urls.length;
  let completed = 0;
  let failed = 0;
  
  // Process in batches of 10 to avoid overwhelming the network
  const batchSize = 10;
  
  for (let i = 0; i < urls.length; i += batchSize) {
    const batch = urls.slice(i, i + batchSize);
    
    await Promise.all(
      batch.map(async (url) => {
        try {
          const cacheKey = getCacheKey(url);
          
          // Check if already cached
          const existing = await cache.match(cacheKey);
          if (existing) {
            completed++;
            return;
          }
          
          // Fetch and cache
          const response = await fetch(url);
          if (response.ok) {
            await cache.put(cacheKey, response);
          } else {
            failed++;
          }
          completed++;
        } catch (error) {
          console.error('[SW] Failed to cache tile:', url, error);
          failed++;
          completed++;
        }
      })
    );
    
    // Report progress
    if (client) {
      client.postMessage({
        type: 'CACHE_PROGRESS',
        payload: {
          completed,
          total,
          failed,
          progress: Math.round((completed / total) * 100),
        },
      });
    }
  }
  
  // Report completion
  if (client) {
    client.postMessage({
      type: 'CACHE_COMPLETE',
      payload: { total: completed, failed },
    });
  }
}

// Clear cache
async function clearCache(routeId) {
  try {
    await caches.delete(TILE_CACHE_NAME);
    await caches.open(TILE_CACHE_NAME); // Recreate empty cache
  } catch (error) {
    console.error('[SW] Error clearing cache:', error);
  }
}

// Get cache size estimate
async function getCacheSize() {
  try {
    if ('storage' in navigator && 'estimate' in navigator.storage) {
      const estimate = await navigator.storage.estimate();
      return {
        used: estimate.usage || 0,
        quota: estimate.quota || 0,
      };
    }
    
    // Fallback: count cached items
    const cache = await caches.open(TILE_CACHE_NAME);
    const keys = await cache.keys();
    return {
      tileCount: keys.length,
      estimatedSize: keys.length * 20 * 1024, // ~20KB per tile estimate
    };
  } catch (error) {
    console.error('[SW] Error getting cache size:', error);
    return { tileCount: 0, estimatedSize: 0 };
  }
}

// Check which URLs are already cached
async function checkCached(urls) {
  try {
    const cache = await caches.open(TILE_CACHE_NAME);
    const results = await Promise.all(
      urls.map(async (url) => {
        const cacheKey = getCacheKey(url);
        const cached = await cache.match(cacheKey);
        return !!cached;
      })
    );
    
    const cachedCount = results.filter(Boolean).length;
    return {
      total: urls.length,
      cached: cachedCount,
      percentage: Math.round((cachedCount / urls.length) * 100),
    };
  } catch (error) {
    console.error('[SW] Error checking cache:', error);
    return { total: urls.length, cached: 0, percentage: 0 };
  }
}
