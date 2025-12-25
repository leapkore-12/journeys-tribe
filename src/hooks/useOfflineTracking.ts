import { useState, useCallback, useEffect, useRef } from 'react';

interface LocationPoint {
  position: [number, number];
  heading?: number;
  speed?: number;
  timestamp: number;
}

const DB_NAME = 'roadtribe_offline';
const STORE_NAME = 'location_buffer';
const DB_VERSION = 1;

export const useOfflineTracking = () => {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [bufferedPoints, setBufferedPoints] = useState<LocationPoint[]>([]);
  const dbRef = useRef<IDBDatabase | null>(null);

  // Initialize IndexedDB
  useEffect(() => {
    const initDB = async () => {
      return new Promise<IDBDatabase>((resolve, reject) => {
        const request = indexedDB.open(DB_NAME, DB_VERSION);

        request.onerror = () => reject(request.error);
        request.onsuccess = () => resolve(request.result);

        request.onupgradeneeded = (event) => {
          const db = (event.target as IDBOpenDBRequest).result;
          if (!db.objectStoreNames.contains(STORE_NAME)) {
            db.createObjectStore(STORE_NAME, { keyPath: 'timestamp' });
          }
        };
      });
    };

    initDB().then((db) => {
      dbRef.current = db;
      loadBufferedPoints();
    }).catch(console.error);

    return () => {
      dbRef.current?.close();
    };
  }, []);

  // Track online/offline status
  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Load buffered points from IndexedDB
  const loadBufferedPoints = useCallback(async () => {
    if (!dbRef.current) return;

    const transaction = dbRef.current.transaction(STORE_NAME, 'readonly');
    const store = transaction.objectStore(STORE_NAME);
    const request = store.getAll();

    request.onsuccess = () => {
      setBufferedPoints(request.result);
    };
  }, []);

  // Buffer a location point when offline
  const bufferPoint = useCallback(async (point: LocationPoint) => {
    if (!dbRef.current) return;

    const transaction = dbRef.current.transaction(STORE_NAME, 'readwrite');
    const store = transaction.objectStore(STORE_NAME);
    store.add(point);

    setBufferedPoints((prev) => [...prev, point]);
  }, []);

  // Clear buffered points after sync
  const clearBuffer = useCallback(async () => {
    if (!dbRef.current) return;

    const transaction = dbRef.current.transaction(STORE_NAME, 'readwrite');
    const store = transaction.objectStore(STORE_NAME);
    store.clear();

    setBufferedPoints([]);
  }, []);

  // Get all buffered points for syncing
  const getBufferedPoints = useCallback(() => {
    return bufferedPoints;
  }, [bufferedPoints]);

  // Handle position update (buffers if offline)
  const handlePositionUpdate = useCallback(
    async (
      position: [number, number],
      heading?: number,
      speed?: number,
      onlineCallback?: (point: LocationPoint) => void
    ) => {
      const point: LocationPoint = {
        position,
        heading,
        speed,
        timestamp: Date.now(),
      };

      if (isOnline && onlineCallback) {
        onlineCallback(point);
      } else {
        await bufferPoint(point);
      }
    },
    [isOnline, bufferPoint]
  );

  // Sync buffered points when back online
  const syncBufferedPoints = useCallback(
    async (syncCallback: (points: LocationPoint[]) => Promise<void>) => {
      if (!isOnline || bufferedPoints.length === 0) return;

      try {
        await syncCallback(bufferedPoints);
        await clearBuffer();
      } catch (error) {
        console.error('Failed to sync buffered points:', error);
      }
    },
    [isOnline, bufferedPoints, clearBuffer]
  );

  return {
    isOnline,
    bufferedPoints,
    bufferPoint,
    clearBuffer,
    getBufferedPoints,
    handlePositionUpdate,
    syncBufferedPoints,
    bufferedCount: bufferedPoints.length,
  };
};
