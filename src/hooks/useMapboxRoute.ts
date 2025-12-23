import { useState, useCallback } from 'react';
import { MAPBOX_TOKEN } from '@/lib/mapbox';

interface RouteStep {
  instruction: string;
  distance: number;
  duration: number;
  maneuver: {
    type: string;
    modifier?: string;
    bearing_after: number;
  };
}

interface RouteInfo {
  coordinates: [number, number][];
  distance: number; // in meters
  duration: number; // in seconds
  steps: RouteStep[];
}

export const useMapboxRoute = () => {
  const [route, setRoute] = useState<RouteInfo | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const getRoute = useCallback(
    async (
      origin: [number, number],
      destination: [number, number],
      waypoints?: [number, number][]
    ) => {
      setIsLoading(true);
      setError(null);

      try {
        // Build coordinates string
        let coords = `${origin[0]},${origin[1]}`;
        if (waypoints?.length) {
          coords += ';' + waypoints.map((wp) => `${wp[0]},${wp[1]}`).join(';');
        }
        coords += `;${destination[0]},${destination[1]}`;

        const response = await fetch(
          `https://api.mapbox.com/directions/v5/mapbox/driving/${coords}?` +
            new URLSearchParams({
              access_token: MAPBOX_TOKEN,
              geometries: 'geojson',
              steps: 'true',
              overview: 'full',
              annotations: 'distance,duration',
            })
        );

        if (!response.ok) {
          throw new Error('Failed to fetch route');
        }

        const data = await response.json();

        if (!data.routes?.length) {
          throw new Error('No route found');
        }

        const routeData = data.routes[0];

        const routeInfo: RouteInfo = {
          coordinates: routeData.geometry.coordinates,
          distance: routeData.distance,
          duration: routeData.duration,
          steps: routeData.legs.flatMap((leg: any) =>
            leg.steps.map((step: any) => ({
              instruction: step.maneuver.instruction,
              distance: step.distance,
              duration: step.duration,
              maneuver: {
                type: step.maneuver.type,
                modifier: step.maneuver.modifier,
                bearing_after: step.maneuver.bearing_after,
              },
            }))
          ),
        };

        setRoute(routeInfo);
        return routeInfo;
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to get route';
        setError(message);
        return null;
      } finally {
        setIsLoading(false);
      }
    },
    []
  );

  const clearRoute = useCallback(() => {
    setRoute(null);
    setError(null);
  }, []);

  return {
    route,
    isLoading,
    error,
    getRoute,
    clearRoute,
  };
};
