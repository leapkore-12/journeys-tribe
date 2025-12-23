import { useEffect, useRef, useState } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { MAPBOX_TOKEN, MAP_STYLES, DEFAULT_CENTER, DEFAULT_ZOOM } from '@/lib/mapbox';

interface MapViewProps {
  center?: [number, number];
  zoom?: number;
  style?: keyof typeof MAP_STYLES;
  className?: string;
  showNavigation?: boolean;
  onMapLoad?: (map: mapboxgl.Map) => void;
  children?: React.ReactNode;
}

const MapView = ({
  center = DEFAULT_CENTER,
  zoom = DEFAULT_ZOOM,
  style = 'dark',
  className = '',
  showNavigation = true,
  onMapLoad,
}: MapViewProps) => {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    if (!mapContainer.current || map.current) return;

    mapboxgl.accessToken = MAPBOX_TOKEN;

    map.current = new mapboxgl.Map({
      container: mapContainer.current,
      style: MAP_STYLES[style],
      center: center,
      zoom: zoom,
      pitch: 45,
      bearing: 0,
      antialias: true,
    });

    if (showNavigation) {
      map.current.addControl(
        new mapboxgl.NavigationControl({
          visualizePitch: true,
        }),
        'top-right'
      );
    }

    map.current.on('load', () => {
      setIsLoaded(true);
      onMapLoad?.(map.current!);
    });

    return () => {
      map.current?.remove();
      map.current = null;
    };
  }, []);

  // Update center when prop changes
  useEffect(() => {
    if (map.current && isLoaded) {
      map.current.flyTo({
        center: center,
        essential: true,
        duration: 1000,
      });
    }
  }, [center, isLoaded]);

  return (
    <div className={`relative w-full h-full ${className}`}>
      <div ref={mapContainer} className="absolute inset-0" />
    </div>
  );
};

export default MapView;
