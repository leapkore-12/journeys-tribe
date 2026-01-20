import { useState, useCallback } from 'react';
import { Capacitor } from '@capacitor/core';

interface GeolocationState {
  position: [number, number] | null;
  heading: number | null;
  speed: number | null;
  accuracy: number | null;
  error: string | null;
  isWatching: boolean;
}

interface UseGeolocationOptions {
  enableHighAccuracy?: boolean;
  timeout?: number;
  maximumAge?: number;
}

export const useGeolocation = (options: UseGeolocationOptions = {}) => {
  const [state, setState] = useState<GeolocationState>({
    position: null,
    heading: null,
    speed: null,
    accuracy: null,
    error: null,
    isWatching: false,
  });

  const {
    enableHighAccuracy = true,
    timeout = 10000,
    maximumAge = 0,
  } = options;

  const handleSuccess = useCallback((coords: {
    longitude: number;
    latitude: number;
    heading: number | null;
    speed: number | null;
    accuracy: number;
  }) => {
    setState((prev) => ({
      ...prev,
      position: [coords.longitude, coords.latitude],
      heading: coords.heading,
      speed: coords.speed,
      accuracy: coords.accuracy,
      error: null,
    }));
  }, []);

  const handleError = useCallback((error: string) => {
    setState((prev) => ({
      ...prev,
      error: error,
    }));
  }, []);

  const startWatching = useCallback(async (): Promise<string | number | null> => {
    setState((prev) => ({ ...prev, isWatching: true }));

    if (Capacitor.isNativePlatform()) {
      // Use Capacitor Geolocation for native iOS/Android
      try {
        const { Geolocation } = await import('@capacitor/geolocation');
        
        // Request permissions first
        const permStatus = await Geolocation.requestPermissions();
        if (permStatus.location !== 'granted') {
          handleError('Location permission denied');
          setState((prev) => ({ ...prev, isWatching: false }));
          return null;
        }

        const watchId = await Geolocation.watchPosition(
          { enableHighAccuracy, timeout, maximumAge },
          (position, err) => {
            if (err) {
              handleError(err.message);
              return;
            }
            if (position) {
              handleSuccess({
                longitude: position.coords.longitude,
                latitude: position.coords.latitude,
                heading: position.coords.heading,
                speed: position.coords.speed,
                accuracy: position.coords.accuracy,
              });
            }
          }
        );

        return watchId;
      } catch (error: any) {
        handleError(error.message || 'Failed to start GPS');
        setState((prev) => ({ ...prev, isWatching: false }));
        return null;
      }
    } else {
      // Use browser Geolocation API for web
      if (!navigator.geolocation) {
        handleError('Geolocation is not supported by your browser');
        setState((prev) => ({ ...prev, isWatching: false }));
        return null;
      }

      const watchId = navigator.geolocation.watchPosition(
        (pos) => {
          handleSuccess({
            longitude: pos.coords.longitude,
            latitude: pos.coords.latitude,
            heading: pos.coords.heading,
            speed: pos.coords.speed,
            accuracy: pos.coords.accuracy,
          });
        },
        (error) => handleError(error.message),
        { enableHighAccuracy, timeout, maximumAge }
      );

      return watchId;
    }
  }, [enableHighAccuracy, timeout, maximumAge, handleSuccess, handleError]);

  const stopWatching = useCallback(async (watchId: string | number) => {
    if (Capacitor.isNativePlatform()) {
      try {
        const { Geolocation } = await import('@capacitor/geolocation');
        await Geolocation.clearWatch({ id: watchId as string });
      } catch (error) {
        console.error('Error stopping Capacitor watch:', error);
      }
    } else {
      navigator.geolocation.clearWatch(watchId as number);
    }
    setState((prev) => ({ ...prev, isWatching: false }));
  }, []);

  const getCurrentPosition = useCallback(async () => {
    if (Capacitor.isNativePlatform()) {
      try {
        const { Geolocation } = await import('@capacitor/geolocation');
        
        const permStatus = await Geolocation.requestPermissions();
        if (permStatus.location !== 'granted') {
          handleError('Location permission denied');
          return;
        }

        const position = await Geolocation.getCurrentPosition({
          enableHighAccuracy,
          timeout,
          maximumAge,
        });

        handleSuccess({
          longitude: position.coords.longitude,
          latitude: position.coords.latitude,
          heading: position.coords.heading,
          speed: position.coords.speed,
          accuracy: position.coords.accuracy,
        });
      } catch (error: any) {
        handleError(error.message || 'Failed to get position');
      }
    } else {
      if (!navigator.geolocation) {
        handleError('Geolocation is not supported by your browser');
        return;
      }

      navigator.geolocation.getCurrentPosition(
        (pos) => {
          handleSuccess({
            longitude: pos.coords.longitude,
            latitude: pos.coords.latitude,
            heading: pos.coords.heading,
            speed: pos.coords.speed,
            accuracy: pos.coords.accuracy,
          });
        },
        (error) => handleError(error.message),
        { enableHighAccuracy, timeout, maximumAge }
      );
    }
  }, [enableHighAccuracy, timeout, maximumAge, handleSuccess, handleError]);

  return {
    ...state,
    startWatching,
    stopWatching,
    getCurrentPosition,
  };
};
