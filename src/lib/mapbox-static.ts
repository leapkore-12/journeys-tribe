import { MAPBOX_TOKEN } from './mapbox';

/**
 * Encodes coordinates to a polyline for Mapbox Static Images API
 */
const encodePolyline = (coordinates: [number, number][]): string => {
  // Simplify coordinates if too many (Mapbox has URL length limits)
  const maxPoints = 100;
  let coords = coordinates;
  
  if (coordinates.length > maxPoints) {
    const step = Math.ceil(coordinates.length / maxPoints);
    coords = coordinates.filter((_, index) => index % step === 0);
    // Always include the last point
    if (coords[coords.length - 1] !== coordinates[coordinates.length - 1]) {
      coords.push(coordinates[coordinates.length - 1]);
    }
  }

  // Encode using standard polyline algorithm
  let result = '';
  let prevLat = 0;
  let prevLng = 0;

  for (const [lng, lat] of coords) {
    const latDiff = Math.round((lat - prevLat) * 1e5);
    const lngDiff = Math.round((lng - prevLng) * 1e5);

    result += encodeNumber(latDiff);
    result += encodeNumber(lngDiff);

    prevLat = lat;
    prevLng = lng;
  }

  return result;
};

const encodeNumber = (num: number): string => {
  let value = num < 0 ? ~(num << 1) : num << 1;
  let result = '';

  while (value >= 0x20) {
    result += String.fromCharCode((0x20 | (value & 0x1f)) + 63);
    value >>= 5;
  }

  result += String.fromCharCode(value + 63);
  return result;
};

/**
 * Generates a Mapbox Static Image URL with route and markers
 */
export const generateStaticMapUrl = (
  routeCoordinates: [number, number][],
  options: {
    width?: number;
    height?: number;
    padding?: number;
    strokeColor?: string;
    strokeWidth?: number;
    startColor?: string;
    endColor?: string;
  } = {}
): string | null => {
  if (!routeCoordinates || routeCoordinates.length < 2) {
    return null;
  }

  const {
    width = 600,
    height = 400,
    padding = 50,
    strokeColor = '00C853', // Green color for route
    strokeWidth = 4,
    startColor = '4CAF50', // Green for start
    endColor = 'F44336', // Red for end
  } = options;

  const start = routeCoordinates[0];
  const end = routeCoordinates[routeCoordinates.length - 1];

  // Create the path overlay with polyline
  const encodedPath = encodePolyline(routeCoordinates);
  const pathOverlay = `path-${strokeWidth}+${strokeColor}-0.8(${encodeURIComponent(encodedPath)})`;

  // Create marker overlays
  const startMarker = `pin-s-a+${startColor}(${start[0]},${start[1]})`;
  const endMarker = `pin-s-b+${endColor}(${end[0]},${end[1]})`;

  // Build the URL with auto-fit bounds
  const baseUrl = 'https://api.mapbox.com/styles/v1/mapbox/dark-v11/static';
  const overlays = `${pathOverlay},${startMarker},${endMarker}`;
  
  // Use auto to fit the route in view
  const url = `${baseUrl}/${overlays}/auto/${width}x${height}@2x?padding=${padding}&access_token=${MAPBOX_TOKEN}`;

  return url;
};

/**
 * Generates a simple static map URL with just start and end markers (no route line)
 * Useful when route coordinates aren't available
 */
export const generateSimpleMapUrl = (
  startCoords: [number, number],
  endCoords: [number, number],
  options: {
    width?: number;
    height?: number;
  } = {}
): string => {
  const { width = 600, height = 400 } = options;

  const startMarker = `pin-s-a+4CAF50(${startCoords[0]},${startCoords[1]})`;
  const endMarker = `pin-s-b+F44336(${endCoords[0]},${endCoords[1]})`;

  const baseUrl = 'https://api.mapbox.com/styles/v1/mapbox/dark-v11/static';
  const overlays = `${startMarker},${endMarker}`;
  
  const url = `${baseUrl}/${overlays}/auto/${width}x${height}@2x?padding=50&access_token=${MAPBOX_TOKEN}`;

  return url;
};
