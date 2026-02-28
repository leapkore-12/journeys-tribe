import { useState, useEffect, useRef } from 'react';
import { MAPBOX_TOKEN } from '@/lib/mapbox';
import { getEmergencyNumber, DEFAULT_EMERGENCY_NUMBER } from '@/lib/emergency-numbers';

interface EmergencyNumberResult {
  emergencyNumber: string;
  countryName: string | null;
  isLoading: boolean;
}

export const useEmergencyNumber = (position: [number, number] | null): EmergencyNumberResult => {
  const [emergencyNumber, setEmergencyNumber] = useState(DEFAULT_EMERGENCY_NUMBER);
  const [countryName, setCountryName] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const lastFetchedRef = useRef<string | null>(null);

  useEffect(() => {
    if (!position) return;

    const [lng, lat] = position;
    // Only re-fetch if position changed significantly (~50km)
    const key = `${Math.round(lat)},${Math.round(lng)}`;
    if (key === lastFetchedRef.current) return;

    let cancelled = false;
    const fetchCountry = async () => {
      setIsLoading(true);
      try {
        const res = await fetch(
          `https://api.mapbox.com/geocoding/v5/mapbox.places/${lng},${lat}.json?` +
          new URLSearchParams({
            access_token: MAPBOX_TOKEN,
            types: 'country',
            limit: '1',
          })
        );
        if (!res.ok) throw new Error('Geocoding failed');
        const data = await res.json();
        if (cancelled) return;

        if (data.features?.length > 0) {
          const feature = data.features[0];
          const code = feature.properties?.short_code?.toUpperCase() ?? '';
          setCountryName(feature.text ?? null);
          setEmergencyNumber(getEmergencyNumber(code));
          lastFetchedRef.current = key;
        }
      } catch (err) {
        console.error('Emergency number lookup failed:', err);
        // Keep current/default number
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    };

    fetchCountry();
    return () => { cancelled = true; };
  }, [position]);

  return { emergencyNumber, countryName, isLoading };
};
