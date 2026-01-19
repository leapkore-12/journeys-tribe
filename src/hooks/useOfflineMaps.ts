import { useState, useEffect, useCallback, useRef } from 'react';
import {
  registerOfflineMapsSW,
  postMessageToSW,
  addSWMessageListener,
  getServiceWorker,
} from '@/lib/service-worker-init';
import {
  getRouteTiles,
  generateTileUrls,
  estimateDownloadSize,
  calculateRouteDistanceKm,
} from '@/lib/offline-tiles';

interface CacheProgress {
  completed: number;
  total: number;
  failed: number;
  progress: number;
}

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
  // State
  isSupported: boolean;
  isReady: boolean;
  isDownloading: boolean;
  downloadProgress: number;
  downloadFailed: number;
  estimatedSize: string;
  cacheStatus: CacheStatus | null;
  cacheSize: CacheSize | null;
  
  // Actions
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

  // Initialize service worker
  useEffect(() => {
    const supported = 'serviceWorker' in navigator;
    setIsSupported(supported);

    if (!supported) {
      console.warn('[OfflineMaps] Service workers not supported');
      return;
    }

    registerOfflineMapsSW().then((registration) => {
      if (registration) {
        setIsReady(true);
      }
    });
  }, []);

  // Listen for SW messages
  useEffect(() => {
    if (!isSupported) return;

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
  }, [isSupported]);

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

  // Download route area for offline use
  const downloadRouteArea = useCallback(async (
    routeCoords: [number, number][],
    paddingKm: number = 5
  ): Promise<void> => {
    if (!isReady) {
      throw new Error('Service worker not ready');
    }

    if (routeCoords.length === 0) {
      throw new Error('No route coordinates provided');
    }

    // Calculate tiles
    const tiles = getRouteTiles(routeCoords, paddingKm);
    const urls = generateTileUrls(tiles);
    const { formatted } = estimateDownloadSize(tiles.length);

    setEstimatedSize(formatted);
    setIsDownloading(true);
    setDownloadProgress(0);
    setDownloadFailed(0);

    return new Promise((resolve, reject) => {
      resolveDownloadRef.current = resolve;
      rejectDownloadRef.current = reject;

      // Send tiles to service worker for caching
      postMessageToSW({
        type: 'CACHE_TILES',
        payload: { urls },
      });

      // Timeout after 5 minutes
      setTimeout(() => {
        if (isDownloading) {
          setIsDownloading(false);
          rejectDownloadRef.current?.(new Error('Download timeout'));
          rejectDownloadRef.current = null;
        }
      }, 5 * 60 * 1000);
    });
  }, [isReady, isDownloading]);

  // Check cache status for a route
  const checkCacheStatus = useCallback(async (
    routeCoords: [number, number][]
  ): Promise<CacheStatus | null> => {
    if (!isReady || routeCoords.length === 0) {
      return null;
    }

    const tiles = getRouteTiles(routeCoords, 5);
    const urls = generateTileUrls(tiles);

    return new Promise((resolve) => {
      const cleanup = addSWMessageListener((event) => {
        if (event.data?.type === 'CACHED_STATUS') {
          cleanup();
          setCacheStatus(event.data.payload);
          resolve(event.data.payload);
        }
      });

      postMessageToSW({
        type: 'CHECK_CACHED',
        payload: { urls },
      });

      // Timeout after 10 seconds
      setTimeout(() => {
        cleanup();
        resolve(null);
      }, 10000);
    });
  }, [isReady]);

  // Clear all cached tiles
  const clearCache = useCallback(async (): Promise<void> => {
    if (!isReady) return;

    return new Promise((resolve) => {
      const cleanup = addSWMessageListener((event) => {
        if (event.data?.type === 'CACHE_CLEARED') {
          cleanup();
          resolve();
        }
      });

      postMessageToSW({ type: 'CLEAR_CACHE' });

      // Timeout after 5 seconds
      setTimeout(() => {
        cleanup();
        resolve();
      }, 5000);
    });
  }, [isReady]);

  // Get current cache size
  const getCacheSizeAction = useCallback(async (): Promise<CacheSize | null> => {
    if (!isReady) return null;

    return new Promise((resolve) => {
      const cleanup = addSWMessageListener((event) => {
        if (event.data?.type === 'CACHE_SIZE') {
          cleanup();
          setCacheSize(event.data.payload);
          resolve(event.data.payload);
        }
      });

      postMessageToSW({ type: 'GET_CACHE_SIZE' });

      // Timeout after 5 seconds
      setTimeout(() => {
        cleanup();
        resolve(null);
      }, 5000);
    });
  }, [isReady]);

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
