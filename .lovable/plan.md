

## Fix Offline Maps for Capacitor/Native iOS

### Problem
The offline maps feature relies entirely on Service Workers, which are **not supported in Capacitor's WKWebView** on iOS. The check `'serviceWorker' in navigator` returns `false`, so the component shows "Offline maps not available in this browser."

### Solution
Implement a **direct Cache API fallback** that works without service workers. The `caches` (Cache Storage API) is available in WKWebView even without service worker support. When service workers aren't available (native app), the hook will cache and retrieve tiles directly from the main thread using the Cache API.

### Changes

**1. `src/hooks/useOfflineMaps.ts`** — Add direct Cache API fallback
- Change `isSupported` to check for either `serviceWorker` OR `caches` API availability
- When service workers aren't available but `caches` is, implement tile caching directly:
  - `downloadRouteArea`: Fetch tiles in batches and store them via `caches.open()` / `cache.put()` directly
  - `checkCacheStatus`: Check cached tiles directly via `cache.match()`
  - `clearCache`: Delete the cache directly via `caches.delete()`
  - `getCacheSize`: Count cached keys directly
- Keep the existing service worker path for web browsers

**2. `src/components/trip/OfflineMapDownload.tsx`** — No changes needed
- The component already works off the hook's `isSupported` / `isReady` flags; once the hook reports support, it will work automatically.

**3. `src/lib/offline-tiles.ts`** — Add a helper to strip access tokens from URLs (same logic the SW uses for cache keys), so the direct cache path uses consistent keys.

### Technical Detail
The key insight is that `window.caches` (CacheStorage API) works independently of service workers in modern WebKit/WKWebView. The service worker was only used as a middleman to batch-fetch and cache tiles. We can do the same directly from the main thread. The fetch-intercept (cache-first on navigation) won't work without a SW, but pre-downloading tiles into the cache is still valuable — Mapbox GL JS can be configured to check the cache first via a custom `transformRequest`.

### Files changed
1. `src/hooks/useOfflineMaps.ts` — Add direct Cache API fallback path
2. `src/lib/offline-tiles.ts` — Export `getCacheKey` helper

