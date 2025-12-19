// Mapbox configuration
// Users should set their Mapbox public token here
export const MAPBOX_TOKEN = localStorage.getItem('mapbox_token') || '';

export const setMapboxToken = (token: string) => {
  localStorage.setItem('mapbox_token', token);
  window.location.reload();
};

export const getMapboxToken = () => {
  return localStorage.getItem('mapbox_token') || '';
};

export const hasMapboxToken = () => {
  const token = getMapboxToken();
  return token && token.length > 0;
};

// Default map styles
export const MAP_STYLES = {
  dark: 'mapbox://styles/mapbox/dark-v11',
  light: 'mapbox://styles/mapbox/light-v11',
  streets: 'mapbox://styles/mapbox/streets-v12',
  satellite: 'mapbox://styles/mapbox/satellite-streets-v12',
  navigation: 'mapbox://styles/mapbox/navigation-night-v1',
};
