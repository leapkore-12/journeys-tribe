import { useState, useEffect, useCallback, useRef } from 'react';
import {
  registerOfflineMapsSW,
  postMessageToSW,
  addSWMessageListener,
} from '@/lib/service-worker-init';
import {
  getRouteTiles,
  generateTileUrls,
  estimateDownloadSize,
  calculateRouteDistanceKm,
  getCacheKey,
} from '@/lib/offline-tiles';

const CACHE_NAME = 'offline-mapbox-tiles';
const BATCH_SIZE = 20;

interface CacheStatus {
  total: number;
  cached: number;
  percentage: number;
}

interface CacheSize {
  used?: number;
  quota?: number;
  tileCount?: number;
  estimatedSize?: number;
}

interface UseOfflineMapsReturn {
  isSupported: boolean;
  isReady: boolean;
  isDownloading: boolean;
  downloadProgress: number;
  downloadFailed: number;
  estimatedSize: string;
  cacheStatus: CacheStatus | null;
  cacheSize: CacheSize | null;
  downloadRouteArea: (routeCoords: [number, number][], paddingKm?: number) => Promise<void>;
  checkCacheStatus: (routeCoords: [number, number][]) => Promise<CacheStatus | null>;
  clearCache: () => Promise<void>;
  getCacheSize: () => Promise<CacheSize | null>;
  estimateTiles: (routeCoords: [number, number][], paddingKm?: number) => {
    tileCount: number;
    estimatedSize: string;
    routeDistanceKm: number;
  };
}

// Detect environment capabilities
const hasSW = typeof navigator !== 'undefined' && 'serviceWorker' in navigator;
const hasCaches = typeof window !== 'undefined' && 'caches' in window;

export const useOfflineMaps = (): UseOfflineMapsReturn => {
  const [isSupported, setIsSupported] = useState(false);
  const [isReady, setIsReady] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const [downloadProgress, setDownloadProgress] = useState(0);
  const [downloadFailed, setDownloadFailed] = useState(0);
  const [estimatedSize, setEstimatedSize] = useState('');
  const [cacheStatus, setCacheStatus] = useState<CacheStatus | null>(null);
  const [cacheSize, setCacheSize] = useState<CacheSize | null>(null);

  const resolveDownloadRef = useRef<(() => void) | null>(null);
  const rejectDownloadRef = useRef<((error: Error) => void) | null>(null);

  // Determine which backend to use: SW or direct Cache API
  const useSW = hasSW;
  const useDirect = !hasSW && hasCaches;

  // Initialize
  useEffect(() => {
    const supported = hasSW || hasCaches;
    setIsSupported(supported);

    if (!supported) {
      console.warn('[OfflineMaps] Neither Service Workers nor Cache API available');
      return;
    }

    if (useSW) {
      registerOfflineMapsSW().then((registration) => {
        if (registration) setIsReady(true);
      });
    } else if (useDirect) {
      // Direct Cache API is available immediately
      setIsReady(true);
    }
  }, []);

  // Listen for SW messages (only when using SW path)
  useEffect(() => {
    if (!useSW) return;

    const cleanup = addSWMessageListener((event) => {
      const { type, payload } = event.data || {};

      switch (type) {
        case 'CACHE_PROGRESS':
          setDownloadProgress(payload.progress);
          setDownloadFailed(payload.failed);
          break;
        case 'CACHE_COMPLETE':
          setIsDownloading(false);
          setDownloadProgress(100);
          setDownloadFailed(payload.failed);
          resolveDownloadRef.current?.();
          resolveDownloadRef.current = null;
          break;
        case 'CACHE_CLEARED':
          setCacheStatus(null);
          setCacheSize(null);
          break;
        case 'CACHE_SIZE':
          setCacheSize(payload);
          break;
        case 'CACHED_STATUS':
          setCacheStatus(payload);
          break;
      }
    });

    return cleanup;
  }, [useSW]);

  // Estimate tiles for a route
  const estimateTiles = useCallback((
    routeCoords: [number, number][],
    paddingKm: number = 5
  ) => {
    if (routeCoords.length === 0) {
      return { tileCount: 0, estimatedSize: '0 KB', routeDistanceKm: 0 };
    }
    const tiles = getRouteTiles(routeCoords, paddingKm);
    const { formatted } = estimateDownloadSize(tiles.length);
    const routeDistanceKm = calculateRouteDistanceKm(routeCoords);
    return {
      tileCount: tiles.length,
      estimatedSize: formatted,
      routeDistanceKm: Math.round(routeDistanceKm),
    };
  }, []);

  // ── Direct Cache API helpers ──────────────────────────────────

  const directDownload = useCallback(async (urls: string[]) => {
    const cache = await caches.open(CACHE_NAME);
    let completed = 0;
    let failed = 0;
    const total = urls.length;

    for (let i = 0; i < total; i += BATCH_SIZE) {
      const batch = urls.slice(i, i + BATCH_SIZE);
      const results = await Promise.allSettled(
        batch.map(async (url) => {
          const key = getCacheKey(url);
          const existing = await cache.match(key);
          if (existing) return; // already cached
          const resp = await fetch(url);
          if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
          await cache.put(key, resp);
        })
      );
      results.forEach((r) => {
        if (r.status === 'fulfilled') completed++;
        else failed++;
      });
      const progress = Math.round(((completed + failed) / total) * 100);
      setDownloadProgress(progress);
      setDownloadFailed(failed);
    }

    return { completed, failed };
  }, []);

  const directCheckCached = useCallback(async (urls: string[]): Promise<CacheStatus> => {
    const cache = await caches.open(CACHE_NAME);
    let cached = 0;
    for (const url of urls) {
      const match = await cache.match(getCacheKey(url));
      if (match) cached++;
    }
    const total = urls.length;
    return { total, cached, percentage: total > 0 ? Math.round((cached / total) * 100) : 0 };
  }, []);

  // ── Public actions ────────────────────────────────────────────

  const downloadRouteArea = useCallback(async (
    routeCoords: [number, number][],
    paddingKm: number = 5
  ): Promise<void> => {
    if (!isReady) throw new Error('Not ready');
    if (routeCoords.length === 0) throw new Error('No route coordinates provided');

    const tiles = getRouteTiles(routeCoords, paddingKm);
    const urls = generateTileUrls(tiles);
    const { formatted } = estimateDownloadSize(tiles.length);

    setEstimatedSize(formatted);
    setIsDownloading(true);
    setDownloadProgress(0);
    setDownloadFailed(0);

    if (useDirect) {
      try {
        await directDownload(urls);
        setIsDownloading(false);
        setDownloadProgress(100);
      } catch (err) {
        setIsDownloading(false);
        throw err;
      }
      return;
    }

    // SW path
    return new Promise((resolve, reject) => {
      resolveDownloadRef.current = resolve;
      rejectDownloadRef.current = reject;

      postMessageToSW({ type: 'CACHE_TILES', payload: { urls } });

      setTimeout(() => {
        if (resolveDownloadRef.current) {
          setIsDownloading(false);
          rejectDownloadRef.current?.(new Error('Download timeout'));
          rejectDownloadRef.current = null;
          resolveDownloadRef.current = null;
        }
      }, 5 * 60 * 1000);
    });
  }, [isReady, useDirect, directDownload]);

  const checkCacheStatus = useCallback(async (
    routeCoords: [number, number][]
  ): Promise<CacheStatus | null> => {
    if (!isReady || routeCoords.length === 0) return null;

    const tiles = getRouteTiles(routeCoords, 5);
    const urls = generateTileUrls(tiles);

    if (useDirect) {
      const status = await directCheckCached(urls);
      setCacheStatus(status);
      return status;
    }

    // SW path
    return new Promise((resolve) => {
      const cleanup = addSWMessageListener((event) => {
        if (event.data?.type === 'CACHED_STATUS') {
          cleanup();
          setCacheStatus(event.data.payload);
          resolve(event.data.payload);
        }
      });
      postMessageToSW({ type: 'CHECK_CACHED', payload: { urls } });
      setTimeout(() => { cleanup(); resolve(null); }, 10000);
    });
  }, [isReady, useDirect, directCheckCached]);

  const clearCache = useCallback(async (): Promise<void> => {
    if (!isReady) return;

    if (useDirect) {
      await caches.delete(CACHE_NAME);
      setCacheStatus(null);
      setCacheSize(null);
      return;
    }

    return new Promise((resolve) => {
      const cleanup = addSWMessageListener((event) => {
        if (event.data?.type === 'CACHE_CLEARED') {
          cleanup();
          resolve();
        }
      });
      postMessageToSW({ type: 'CLEAR_CACHE' });
      setTimeout(() => { cleanup(); resolve(); }, 5000);
    });
  }, [isReady, useDirect]);

  const getCacheSizeAction = useCallback(async (): Promise<CacheSize | null> => {
    if (!isReady) return null;

    if (useDirect) {
      try {
        const cache = await caches.open(CACHE_NAME);
        const keys = await cache.keys();
        const size: CacheSize = { tileCount: keys.length };
        setCacheSize(size);
        return size;
      } catch {
        return null;
      }
    }

    return new Promise((resolve) => {
      const cleanup = addSWMessageListener((event) => {
        if (event.data?.type === 'CACHE_SIZE') {
          cleanup();
          setCacheSize(event.data.payload);
          resolve(event.data.payload);
        }
      });
      postMessageToSW({ type: 'GET_CACHE_SIZE' });
      setTimeout(() => { cleanup(); resolve(null); }, 5000);
    });
  }, [isReady, useDirect]);

  return {
    isSupported,
    isReady,
    isDownloading,
    downloadProgress,
    downloadFailed,
    estimatedSize,
    cacheStatus,
    cacheSize,
    downloadRouteArea,
    checkCacheStatus,
    clearCache,
    getCacheSize: getCacheSizeAction,
    estimateTiles,
  };
};
