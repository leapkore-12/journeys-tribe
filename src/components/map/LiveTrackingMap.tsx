import { useEffect, useRef, useState, useCallback, forwardRef, useImperativeHandle } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { MAPBOX_TOKEN, MAP_STYLES } from '@/lib/mapbox';
import { ConvoyMemberPresence } from '@/hooks/useConvoyPresence';
import { createConvoyMarkerElement, getMemberStatus, getStatusColor } from '@/components/convoy/ConvoyMemberMarker';

interface LiveTrackingMapProps {
  userPosition: [number, number] | null;
  destination?: [number, number];
  routeCoordinates?: [number, number][];
  convoyMembers?: ConvoyMemberPresence[];
  heading?: number | null;
  compassMode?: boolean;
  showRoute?: boolean;
  className?: string;
}

export interface LiveTrackingMapRef {
  recenter: () => void;
}

const LiveTrackingMap = forwardRef<LiveTrackingMapRef, LiveTrackingMapProps>(({
  userPosition,
  destination,
  routeCoordinates,
  convoyMembers = [],
  heading,
  compassMode = false,
  showRoute = true,
  className = '',
}, ref) => {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const userMarker = useRef<mapboxgl.Marker | null>(null);
  const destMarker = useRef<mapboxgl.Marker | null>(null);
  const convoyMarkers = useRef<Map<string, mapboxgl.Marker>>(new Map());
  const [isLoaded, setIsLoaded] = useState(false);

  // Recenter function
  const recenter = useCallback(() => {
    if (map.current && userPosition) {
      map.current.flyTo({
        center: userPosition,
        zoom: 15,
        pitch: 60,
        bearing: compassMode && heading ? heading : 0,
        duration: 1000,
      });
    }
  }, [userPosition, compassMode, heading]);

  // Expose recenter via ref
  useImperativeHandle(ref, () => ({
    recenter,
  }), [recenter]);

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

    // Center map on user with compass mode
    map.current.easeTo({
      center: userPosition,
      bearing: compassMode && heading ? heading : 0,
      duration: 500,
    });
  }, [userPosition, isLoaded, compassMode, heading]);

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

  // Toggle route visibility
  useEffect(() => {
    if (!map.current || !isLoaded) return;

    const visibility = showRoute ? 'visible' : 'none';
    
    if (map.current.getLayer('route')) {
      map.current.setLayoutProperty('route', 'visibility', visibility);
    }
    if (map.current.getLayer('route-outline')) {
      map.current.setLayoutProperty('route-outline', 'visibility', visibility);
    }
  }, [showRoute, isLoaded]);

  // Track previous member states for smart updates
  const prevMemberStates = useRef<Map<string, { status: string; speed?: number; heading?: number }>>(new Map());

  // Update convoy member markers with enhanced visuals
  useEffect(() => {
    if (!map.current || !isLoaded) return;

    // Debug logging for convoy members
    console.log('[LiveTrackingMap] Convoy members received:', convoyMembers.length, convoyMembers);

    // Remove markers for members no longer in convoy
    const currentIds = new Set(convoyMembers.map((m) => m.id));
    convoyMarkers.current.forEach((marker, id) => {
      if (!currentIds.has(id)) {
        marker.remove();
        convoyMarkers.current.delete(id);
        prevMemberStates.current.delete(id);
      }
    });

    // Add or update convoy member markers
    convoyMembers.forEach((member) => {
      const existingMarker = convoyMarkers.current.get(member.id);
      const prevState = prevMemberStates.current.get(member.id);
      const currentStatus = getMemberStatus(member);
      
      // Check if we need to recreate the marker (status, speed, or heading changed significantly)
      const needsRecreate = prevState && (
        prevState.status !== currentStatus ||
        Math.abs((prevState.speed || 0) - (member.speed || 0)) > 5 ||
        Math.abs((prevState.heading || 0) - (member.heading || 0)) > 30
      );

      if (existingMarker && !needsRecreate) {
        // Just update position
        existingMarker.setLngLat(member.position);
      } else {
        // Remove old marker if exists
        if (existingMarker) {
          existingMarker.remove();
          convoyMarkers.current.delete(member.id);
        }

        // Create enhanced marker element
        const el = createConvoyMarkerElement(member);
        
        // Add click handler for popup
        el.addEventListener('click', () => {
          const status = getMemberStatus(member);
          const statusColor = getStatusColor(status);
          const timeSinceUpdate = Math.round((Date.now() - member.lastUpdate) / 1000);
          
          new mapboxgl.Popup({ offset: 25, closeButton: true })
            .setLngLat(member.position)
            .setHTML(`
              <div style="padding: 8px; min-width: 150px;">
                <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 8px;">
                  ${member.avatar 
                    ? `<img src="${member.avatar}" style="width: 32px; height: 32px; border-radius: 50%; object-fit: cover;" />`
                    : `<div style="width: 32px; height: 32px; border-radius: 50%; background: #6366f1; display: flex; align-items: center; justify-content: center; color: white; font-weight: bold;">${member.name[0].toUpperCase()}</div>`
                  }
                  <div>
                    <div style="font-weight: 600;">${member.name}</div>
                    <div style="font-size: 12px; color: ${statusColor}; text-transform: capitalize;">${status}</div>
                  </div>
                </div>
                ${member.vehicleType ? `<div style="font-size: 12px; color: #666; margin-bottom: 4px;">🚗 ${member.vehicleType}</div>` : ''}
                ${member.speed ? `<div style="font-size: 12px; color: #666; margin-bottom: 4px;">⚡ ${Math.round(member.speed)} km/h</div>` : ''}
                <div style="font-size: 11px; color: #999;">Updated ${timeSinceUpdate}s ago</div>
              </div>
            `)
            .addTo(map.current!);
        });

        const marker = new mapboxgl.Marker({ element: el, anchor: 'center' })
          .setLngLat(member.position)
          .addTo(map.current!);

        convoyMarkers.current.set(member.id, marker);
      }

      // Update previous state
      prevMemberStates.current.set(member.id, {
        status: currentStatus,
        speed: member.speed,
        heading: member.heading,
      });
    });
  }, [convoyMembers, isLoaded]);

  return (
    <div className={`relative w-full h-full ${className}`}>
      <div ref={mapContainer} className="absolute inset-0" />
    </div>
  );
});

LiveTrackingMap.displayName = 'LiveTrackingMap';

export default LiveTrackingMap;
