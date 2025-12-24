import { useState, useCallback } from 'react';
import { MAPBOX_TOKEN } from '@/lib/mapbox';
import { useDebounce } from './useDebounce';

export interface GeocodingResult {
  id: string;
  placeName: string;
  address: string;
  coordinates: [number, number]; // [lng, lat]
}

export const useMapboxGeocoding = () => {
  const [results, setResults] = useState<GeocodingResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const search = useCallback(async (query: string) => {
    if (!query || query.length < 3) {
      setResults([]);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(
        `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(query)}.json?` +
          new URLSearchParams({
            access_token: MAPBOX_TOKEN,
            autocomplete: 'true',
            limit: '5',
            types: 'place,address,poi,locality,neighborhood',
          })
      );

      if (!response.ok) {
        throw new Error('Geocoding request failed');
      }

      const data = await response.json();

      const formatted: GeocodingResult[] = data.features.map((feature: any) => ({
        id: feature.id,
        placeName: feature.text,
        address: feature.place_name,
        coordinates: feature.center as [number, number],
      }));

      setResults(formatted);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Geocoding failed';
      setError(message);
      setResults([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const reverseGeocode = useCallback(async (coordinates: [number, number]): Promise<GeocodingResult | null> => {
    try {
      const [lng, lat] = coordinates;
      const response = await fetch(
        `https://api.mapbox.com/geocoding/v5/mapbox.places/${lng},${lat}.json?` +
          new URLSearchParams({
            access_token: MAPBOX_TOKEN,
            limit: '1',
          })
      );

      if (!response.ok) {
        throw new Error('Reverse geocoding failed');
      }

      const data = await response.json();

      if (data.features && data.features.length > 0) {
        const feature = data.features[0];
        return {
          id: feature.id,
          placeName: feature.text,
          address: feature.place_name,
          coordinates: feature.center as [number, number],
        };
      }

      return null;
    } catch (err) {
      console.error('Reverse geocoding error:', err);
      return null;
    }
  }, []);

  const clearResults = useCallback(() => {
    setResults([]);
    setError(null);
  }, []);

  return {
    results,
    isLoading,
    error,
    search,
    reverseGeocode,
    clearResults,
  };
};
