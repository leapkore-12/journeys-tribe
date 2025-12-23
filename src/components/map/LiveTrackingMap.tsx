import { useEffect, useRef, useState, useCallback } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { MAPBOX_TOKEN, MAP_STYLES } from '@/lib/mapbox';

interface ConvoyMember {
  id: string;
  name: string;
  avatar?: string;
  position: [number, number];
}

interface LiveTrackingMapProps {
  userPosition: [number, number] | null;
  destination?: [number, number];
  routeCoordinates?: [number, number][];
  convoyMembers?: ConvoyMember[];
  onRecenter?: () => void;
  className?: string;
}

const LiveTrackingMap = ({
  userPosition,
  destination,
  routeCoordinates,
  convoyMembers = [],
  className = '',
}: LiveTrackingMapProps) => {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const userMarker = useRef<mapboxgl.Marker | null>(null);
  const destMarker = useRef<mapboxgl.Marker | null>(null);
  const convoyMarkers = useRef<Map<string, mapboxgl.Marker>>(new Map());
  const [isLoaded, setIsLoaded] = useState(false);

  // Initialize map
  useEffect(() => {
    if (!mapContainer.current || map.current) return;

    mapboxgl.accessToken = MAPBOX_TOKEN;

    const initialCenter = userPosition || [-122.4194, 37.7749];

    map.current = new mapboxgl.Map({
      container: mapContainer.current,
      style: MAP_STYLES.navigation,
      center: initialCenter,
      zoom: 15,
      pitch: 60,
      bearing: 0,
      antialias: true,
    });

    map.current.on('load', () => {
      setIsLoaded(true);

      // Add route source
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

      // Add route layer
      map.current?.addLayer({
        id: 'route',
        type: 'line',
        source: 'route',
        layout: {
          'line-join': 'round',
          'line-cap': 'round',
        },
        paint: {
          'line-color': '#22c55e',
          'line-width': 6,
          'line-opacity': 0.8,
        },
      });

      // Add route outline
      map.current?.addLayer({
        id: 'route-outline',
        type: 'line',
        source: 'route',
        layout: {
          'line-join': 'round',
          'line-cap': 'round',
        },
        paint: {
          'line-color': '#166534',
          'line-width': 10,
          'line-opacity': 0.4,
        },
      }, 'route');
    });

    return () => {
      userMarker.current?.remove();
      destMarker.current?.remove();
      convoyMarkers.current.forEach((marker) => marker.remove());
      map.current?.remove();
      map.current = null;
    };
  }, []);

  // Update user position marker
  useEffect(() => {
    if (!map.current || !isLoaded || !userPosition) return;

    if (!userMarker.current) {
      // Create user marker element
      const el = document.createElement('div');
      el.className = 'user-marker';
      el.innerHTML = `
        <div style="
          width: 24px;
          height: 24px;
          background: linear-gradient(135deg, #22c55e, #16a34a);
          border: 3px solid white;
          border-radius: 50%;
          box-shadow: 0 2px 10px rgba(0,0,0,0.3);
          position: relative;
        ">
          <div style="
            position: absolute;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            width: 8px;
            height: 8px;
            background: white;
            border-radius: 50%;
          "></div>
        </div>
        <div style="
          position: absolute;
          top: -8px;
          left: 50%;
          transform: translateX(-50%);
          width: 0;
          height: 0;
          border-left: 8px solid transparent;
          border-right: 8px solid transparent;
          border-bottom: 12px solid #22c55e;
        "></div>
      `;

      userMarker.current = new mapboxgl.Marker({ element: el, anchor: 'center' })
        .setLngLat(userPosition)
        .addTo(map.current);
    } else {
      userMarker.current.setLngLat(userPosition);
    }

    // Center map on user
    map.current.easeTo({
      center: userPosition,
      duration: 500,
    });
  }, [userPosition, isLoaded]);

  // Update destination marker
  useEffect(() => {
    if (!map.current || !isLoaded || !destination) return;

    if (!destMarker.current) {
      const el = document.createElement('div');
      el.innerHTML = `
        <div style="
          width: 32px;
          height: 32px;
          background: linear-gradient(135deg, #ef4444, #dc2626);
          border: 3px solid white;
          border-radius: 50%;
          box-shadow: 0 2px 10px rgba(0,0,0,0.3);
          display: flex;
          align-items: center;
          justify-content: center;
        ">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2">
            <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/>
            <circle cx="12" cy="10" r="3"/>
          </svg>
        </div>
      `;

      destMarker.current = new mapboxgl.Marker({ element: el, anchor: 'bottom' })
        .setLngLat(destination)
        .addTo(map.current);
    } else {
      destMarker.current.setLngLat(destination);
    }
  }, [destination, isLoaded]);

  // Update route
  useEffect(() => {
    if (!map.current || !isLoaded || !routeCoordinates?.length) return;

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
  }, [routeCoordinates, isLoaded]);

  // Update convoy member markers
  useEffect(() => {
    if (!map.current || !isLoaded) return;

    // Remove markers for members no longer in convoy
    const currentIds = new Set(convoyMembers.map((m) => m.id));
    convoyMarkers.current.forEach((marker, id) => {
      if (!currentIds.has(id)) {
        marker.remove();
        convoyMarkers.current.delete(id);
      }
    });

    // Add or update convoy member markers
    convoyMembers.forEach((member) => {
      const existingMarker = convoyMarkers.current.get(member.id);

      if (existingMarker) {
        existingMarker.setLngLat(member.position);
      } else {
        const el = document.createElement('div');
        el.innerHTML = `
          <div style="
            width: 36px;
            height: 36px;
            border-radius: 50%;
            border: 2px solid #22c55e;
            overflow: hidden;
            background: #1a1a2e;
            box-shadow: 0 2px 8px rgba(0,0,0,0.3);
          ">
            ${
              member.avatar
                ? `<img src="${member.avatar}" style="width: 100%; height: 100%; object-fit: cover;" />`
                : `<div style="width: 100%; height: 100%; display: flex; align-items: center; justify-content: center; color: white; font-weight: bold;">${member.name[0]}</div>`
            }
          </div>
        `;

        const marker = new mapboxgl.Marker({ element: el, anchor: 'center' })
          .setLngLat(member.position)
          .addTo(map.current!);

        convoyMarkers.current.set(member.id, marker);
      }
    });
  }, [convoyMembers, isLoaded]);

  // Recenter function
  const recenter = useCallback(() => {
    if (map.current && userPosition) {
      map.current.flyTo({
        center: userPosition,
        zoom: 15,
        pitch: 60,
        duration: 1000,
      });
    }
  }, [userPosition]);

  return (
    <div className={`relative w-full h-full ${className}`}>
      <div ref={mapContainer} className="absolute inset-0" />
    </div>
  );
};

export default LiveTrackingMap;
