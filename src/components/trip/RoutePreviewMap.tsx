import { useEffect, useRef } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { MAPBOX_TOKEN, MAP_STYLES } from '@/lib/mapbox';

interface TripStop {
  latitude: number;
  longitude: number;
  address: string;
}

interface RoutePreviewMapProps {
  startCoordinates?: [number, number] | null;
  destinationCoordinates?: [number, number] | null;
  routeCoordinates?: [number, number][];
  stops?: TripStop[];
  className?: string;
}

const RoutePreviewMap = ({
  startCoordinates,
  destinationCoordinates,
  routeCoordinates,
  stops = [],
  className = '',
}: RoutePreviewMapProps) => {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const startMarker = useRef<mapboxgl.Marker | null>(null);
  const destMarker = useRef<mapboxgl.Marker | null>(null);
  const stopMarkers = useRef<mapboxgl.Marker[]>([]);

  // Initialize map
  useEffect(() => {
    if (!mapContainer.current || map.current) return;

    mapboxgl.accessToken = MAPBOX_TOKEN;

    map.current = new mapboxgl.Map({
      container: mapContainer.current,
      style: MAP_STYLES.dark,
      center: startCoordinates || destinationCoordinates || [72.8777, 19.076], // Default to Mumbai
      zoom: 11,
      interactive: false, // Make it non-interactive for preview
    });

    map.current.on('load', () => {
      // Add route layer
      map.current?.addSource('route', {
        type: 'geojson',
        data: {
          type: 'Feature',
          properties: {},
          geometry: {
            type: 'LineString',
            coordinates: [],
          },
        },
      });

      map.current?.addLayer({
        id: 'route-outline',
        type: 'line',
        source: 'route',
        layout: {
          'line-join': 'round',
          'line-cap': 'round',
        },
        paint: {
          'line-color': '#000',
          'line-width': 8,
        },
      });

      map.current?.addLayer({
        id: 'route',
        type: 'line',
        source: 'route',
        layout: {
          'line-join': 'round',
          'line-cap': 'round',
        },
        paint: {
          'line-color': '#3b82f6',
          'line-width': 5,
        },
      });
    });

    return () => {
      startMarker.current?.remove();
      destMarker.current?.remove();
      stopMarkers.current.forEach(m => m.remove());
      map.current?.remove();
      map.current = null;
    };
  }, []);

  // Update start marker
  useEffect(() => {
    if (!map.current || !startCoordinates) return;

    if (startMarker.current) {
      startMarker.current.setLngLat(startCoordinates);
    } else {
      const el = document.createElement('div');
      el.className = 'start-marker';
      el.innerHTML = `
        <div style="width: 24px; height: 24px; background: #22c55e; border: 3px solid white; border-radius: 50%; box-shadow: 0 2px 8px rgba(0,0,0,0.3);"></div>
      `;

      startMarker.current = new mapboxgl.Marker({ element: el })
        .setLngLat(startCoordinates)
        .addTo(map.current);
    }
  }, [startCoordinates]);

  // Update destination marker
  useEffect(() => {
    if (!map.current || !destinationCoordinates) return;

    if (destMarker.current) {
      destMarker.current.setLngLat(destinationCoordinates);
    } else {
      const el = document.createElement('div');
      el.className = 'dest-marker';
      el.innerHTML = `
        <div style="width: 24px; height: 24px; background: #ef4444; border: 3px solid white; border-radius: 50%; box-shadow: 0 2px 8px rgba(0,0,0,0.3);"></div>
      `;

      destMarker.current = new mapboxgl.Marker({ element: el })
        .setLngLat(destinationCoordinates)
        .addTo(map.current);
    }
  }, [destinationCoordinates]);

  // Update route
  useEffect(() => {
    if (!map.current || !routeCoordinates?.length) return;

    const source = map.current.getSource('route') as mapboxgl.GeoJSONSource;
    if (source) {
      source.setData({
        type: 'Feature',
        properties: {},
        geometry: {
          type: 'LineString',
          coordinates: routeCoordinates,
        },
      });
    }

    // Fit bounds to show entire route
    if (routeCoordinates.length > 1) {
      const bounds = new mapboxgl.LngLatBounds();
      routeCoordinates.forEach((coord) => bounds.extend(coord as [number, number]));
      map.current.fitBounds(bounds, { padding: 40 });
    }
  }, [routeCoordinates]);

  // Update stop markers
  useEffect(() => {
    if (!map.current) return;

    // Remove old stop markers
    stopMarkers.current.forEach(m => m.remove());
    stopMarkers.current = [];

    stops.forEach((stop, index) => {
      if (stop.latitude == null || stop.longitude == null) return;
      const el = document.createElement('div');
      el.className = 'stop-marker';
      el.innerHTML = `
        <div style="width: 28px; height: 28px; background: hsl(36, 100%, 50%); border: 3px solid white; border-radius: 50%; box-shadow: 0 2px 8px rgba(0,0,0,0.3); display: flex; align-items: center; justify-content: center; color: white; font-weight: 700; font-size: 12px;">${index + 1}</div>
      `;

      const marker = new mapboxgl.Marker({ element: el })
        .setLngLat([stop.longitude, stop.latitude])
        .addTo(map.current!);
      stopMarkers.current.push(marker);
    });
  }, [stops]);

  // Fit to markers when they change
  useEffect(() => {
    if (!map.current) return;

    const bounds = new mapboxgl.LngLatBounds();
    let hasPoints = false;

    if (startCoordinates) { bounds.extend(startCoordinates); hasPoints = true; }
    if (destinationCoordinates) { bounds.extend(destinationCoordinates); hasPoints = true; }
    stops.forEach(stop => {
      if (stop.latitude != null && stop.longitude != null) {
        bounds.extend([stop.longitude, stop.latitude]);
        hasPoints = true;
      }
    });

    if (hasPoints) {
      map.current.fitBounds(bounds, { padding: 40 });
    } else if (startCoordinates) {
      map.current.flyTo({ center: startCoordinates, zoom: 13 });
    }
  }, [startCoordinates, destinationCoordinates, stops]);

  return (
    <div className={`relative rounded-xl overflow-hidden ${className}`}>
      <div ref={mapContainer} className="w-full h-full" />
    </div>
  );
};

export default RoutePreviewMap;
