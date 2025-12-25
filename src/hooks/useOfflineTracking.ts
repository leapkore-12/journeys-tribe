import { useState, useCallback, useEffect, useRef } from 'react';
import { useToast } from '@/hooks/use-toast';

interface LocationPoint {
  position: [number, number];
  heading?: number;
  speed?: number;
  timestamp: number;
  tripId?: string;
}

const DB_NAME = 'roadtribe_offline';
const STORE_NAME = 'location_buffer';
const DB_VERSION = 1;

export const useOfflineTracking = (tripId?: string) => {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [bufferedPoints, setBufferedPoints] = useState<LocationPoint[]>([]);
  const [isSyncing, setIsSyncing] = useState(false);
  const dbRef = useRef<IDBDatabase | null>(null);
  const { toast } = useToast();

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
            const store = db.createObjectStore(STORE_NAME, { keyPath: 'timestamp' });
            store.createIndex('tripId', 'tripId', { unique: false });
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
    const handleOnline = () => {
      setIsOnline(true);
      toast({
        title: 'Back online',
        description: bufferedPoints.length > 0 
          ? `Syncing ${bufferedPoints.length} buffered points...`
          : 'Connection restored',
      });
    };
    
    const handleOffline = () => {
      setIsOnline(false);
      toast({
        title: 'You are offline',
        description: 'Trip recording continues - data will sync when reconnected',
        variant: 'destructive',
      });
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [bufferedPoints.length, toast]);

  // Load buffered points from IndexedDB
  const loadBufferedPoints = useCallback(async () => {
    if (!dbRef.current) return;

    const transaction = dbRef.current.transaction(STORE_NAME, 'readonly');
    const store = transaction.objectStore(STORE_NAME);
    
    // If tripId provided, filter by it
    if (tripId) {
      const index = store.index('tripId');
      const request = index.getAll(tripId);
      request.onsuccess = () => {
        setBufferedPoints(request.result);
      };
    } else {
      const request = store.getAll();
      request.onsuccess = () => {
        setBufferedPoints(request.result);
      };
    }
  }, [tripId]);

  // Buffer a location point when offline
  const bufferPoint = useCallback(async (point: Omit<LocationPoint, 'tripId'>) => {
    if (!dbRef.current) return;

    const pointWithTrip: LocationPoint = {
      ...point,
      tripId,
    };

    const transaction = dbRef.current.transaction(STORE_NAME, 'readwrite');
    const store = transaction.objectStore(STORE_NAME);
    store.add(pointWithTrip);

    setBufferedPoints((prev) => [...prev, pointWithTrip]);
  }, [tripId]);

  // Clear buffered points after sync
  const clearBuffer = useCallback(async (specificTripId?: string) => {
    if (!dbRef.current) return;

    const transaction = dbRef.current.transaction(STORE_NAME, 'readwrite');
    const store = transaction.objectStore(STORE_NAME);
    
    if (specificTripId) {
      // Clear only points for specific trip
      const index = store.index('tripId');
      const request = index.openCursor(specificTripId);
      request.onsuccess = (event) => {
        const cursor = (event.target as IDBRequest<IDBCursorWithValue>).result;
        if (cursor) {
          cursor.delete();
          cursor.continue();
        }
      };
      setBufferedPoints((prev) => prev.filter(p => p.tripId !== specificTripId));
    } else {
      store.clear();
      setBufferedPoints([]);
    }
  }, []);

  // Get all buffered points for syncing
  const getBufferedPoints = useCallback(() => {
    return bufferedPoints;
  }, [bufferedPoints]);

  // Handle position update (buffers if offline, calls callback if online)
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
        tripId,
      };

      if (isOnline && onlineCallback) {
        onlineCallback(point);
      } else if (!isOnline) {
        await bufferPoint(point);
      }
    },
    [isOnline, bufferPoint, tripId]
  );

  // Sync buffered points when back online
  const syncBufferedPoints = useCallback(
    async (syncCallback: (points: LocationPoint[]) => Promise<void>) => {
      if (!isOnline || bufferedPoints.length === 0 || isSyncing) return false;

      setIsSyncing(true);
      try {
        await syncCallback(bufferedPoints);
        await clearBuffer(tripId);
        toast({
          title: 'Sync complete',
          description: `Synced ${bufferedPoints.length} location points`,
        });
        return true;
      } catch (error) {
        console.error('Failed to sync buffered points:', error);
        toast({
          title: 'Sync failed',
          description: 'Will retry when connection is stable',
          variant: 'destructive',
        });
        return false;
      } finally {
        setIsSyncing(false);
      }
    },
    [isOnline, bufferedPoints, clearBuffer, tripId, isSyncing, toast]
  );

  return {
    isOnline,
    isSyncing,
    bufferedPoints,
    bufferPoint,
    clearBuffer,
    getBufferedPoints,
    handlePositionUpdate,
    syncBufferedPoints,
    bufferedCount: bufferedPoints.length,
  };
};
