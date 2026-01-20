import { useState, useCallback, useRef, useEffect } from 'react';
import { Capacitor, registerPlugin } from '@capacitor/core';

interface BackgroundGeolocationPlugin {
  addWatcher(
    options: WatcherOptions,
    callback: (location: Location | null, error: LocationError | null) => void
  ): Promise<string>;
  removeWatcher(options: { id: string }): Promise<void>;
  openSettings(): Promise<void>;
}

interface WatcherOptions {
  backgroundMessage?: string;
  backgroundTitle?: string;
  requestPermissions?: boolean;
  stale?: boolean;
  distanceFilter?: number;
}

interface Location {
  latitude: number;
  longitude: number;
  accuracy: number;
  altitude: number | null;
  altitudeAccuracy: number | null;
  bearing: number | null;
  speed: number | null;
  time: number;
  simulated: boolean;
}

interface LocationError {
  code: string;
}

interface UseBackgroundGeolocationOptions {
  distanceFilter?: number;
  backgroundTitle?: string;
  backgroundMessage?: string;
  onPosition?: (
    position: [number, number],
    heading: number | null,
    speed: number | null,
    accuracy: number
  ) => void;
  onError?: (error: string) => void;
}

export const useBackgroundGeolocation = (options: UseBackgroundGeolocationOptions = {}) => {
  const [isTracking, setIsTracking] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastPosition, setLastPosition] = useState<[number, number] | null>(null);
  const watcherIdRef = useRef<string | null>(null);
  const pluginRef = useRef<BackgroundGeolocationPlugin | null>(null);
  const optionsRef = useRef(options);

  // Keep options ref updated
  useEffect(() => {
    optionsRef.current = options;
  }, [options]);

  // Initialize plugin on native platform
  useEffect(() => {
    if (Capacitor.isNativePlatform()) {
      pluginRef.current = registerPlugin<BackgroundGeolocationPlugin>('BackgroundGeolocation');
    }
  }, []);

  const startTracking = useCallback(async (): Promise<boolean> => {
    // For web, fall back to standard geolocation
    if (!Capacitor.isNativePlatform()) {
      console.log('Background tracking not available on web, using foreground only');
      
      if (!navigator.geolocation) {
        setError('Geolocation is not supported');
        return false;
      }

      const watchId = navigator.geolocation.watchPosition(
        (pos) => {
          const position: [number, number] = [pos.coords.longitude, pos.coords.latitude];
          setLastPosition(position);
          optionsRef.current.onPosition?.(
            position,
            pos.coords.heading,
            pos.coords.speed,
            pos.coords.accuracy
          );
        },
        (err) => {
          setError(err.message);
          optionsRef.current.onError?.(err.message);
        },
        { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
      );

      watcherIdRef.current = String(watchId);
      setIsTracking(true);
      setError(null);
      return true;
    }

    if (!pluginRef.current) {
      setError('Background geolocation plugin not available');
      return false;
    }

    try {
      const watcherId = await pluginRef.current.addWatcher(
        {
          backgroundTitle: optionsRef.current.backgroundTitle || 'RoadTribe',
          backgroundMessage: optionsRef.current.backgroundMessage || 'Recording your trip route',
          requestPermissions: true,
          stale: false,
          // Battery optimization: only update after moving this many meters
          distanceFilter: optionsRef.current.distanceFilter || 30,
        },
        (location: Location | null, err: LocationError | null) => {
          if (err) {
            console.error('Background location error:', err);
            if (err.code === 'NOT_AUTHORIZED') {
              setError('Location permission denied. Please enable "Always" location access.');
              optionsRef.current.onError?.('Location permission denied');
              // Open settings so user can grant permission
              pluginRef.current?.openSettings();
            } else {
              setError('Location tracking error');
              optionsRef.current.onError?.('Location tracking error');
            }
            return;
          }

          if (location) {
            const position: [number, number] = [location.longitude, location.latitude];
            setLastPosition(position);
            optionsRef.current.onPosition?.(
              position,
              location.bearing,
              location.speed,
              location.accuracy
            );
          }
        }
      );

      watcherIdRef.current = watcherId;
      setIsTracking(true);
      setError(null);
      console.log('Background tracking started with watcher:', watcherId);
      return true;
    } catch (e: any) {
      console.error('Failed to start background tracking:', e);
      setError(e.message || 'Failed to start background tracking');
      optionsRef.current.onError?.(e.message || 'Failed to start background tracking');
      return false;
    }
  }, []);

  const stopTracking = useCallback(async () => {
    if (!watcherIdRef.current) {
      setIsTracking(false);
      return;
    }

    try {
      if (Capacitor.isNativePlatform() && pluginRef.current) {
        await pluginRef.current.removeWatcher({ id: watcherIdRef.current });
        console.log('Background tracking stopped');
      } else {
        navigator.geolocation.clearWatch(Number(watcherIdRef.current));
      }
    } catch (e) {
      console.error('Error stopping tracking:', e);
    }

    watcherIdRef.current = null;
    setIsTracking(false);
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (watcherIdRef.current) {
        if (Capacitor.isNativePlatform() && pluginRef.current) {
          pluginRef.current.removeWatcher({ id: watcherIdRef.current }).catch(console.error);
        } else {
          navigator.geolocation.clearWatch(Number(watcherIdRef.current));
        }
      }
    };
  }, []);

  return {
    isTracking,
    error,
    lastPosition,
    startTracking,
    stopTracking,
  };
};

