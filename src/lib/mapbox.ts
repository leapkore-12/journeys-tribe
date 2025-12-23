// Mapbox configuration
// Mapbox public token - safe to include in client code
export const MAPBOX_TOKEN = 'pk.eyJ1Ijoicm9hZHRyaWJlIiwiYSI6ImNtamloMWszcjFrcGYzZ3F6bzQ1NzdhZGoifQ.93zUwkVwOaImBxxK6CdCLQ';

// Default map styles
export const MAP_STYLES = {
  dark: 'mapbox://styles/mapbox/dark-v11',
  light: 'mapbox://styles/mapbox/light-v11',
  streets: 'mapbox://styles/mapbox/streets-v12',
  satellite: 'mapbox://styles/mapbox/satellite-streets-v12',
  navigation: 'mapbox://styles/mapbox/navigation-night-v1',
};

// Default map center (can be overridden by user location)
export const DEFAULT_CENTER: [number, number] = [-122.4194, 37.7749]; // San Francisco
export const DEFAULT_ZOOM = 12;
