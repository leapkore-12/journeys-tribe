import { MAPBOX_TOKEN } from './mapbox';

// Zoom levels to cache (10 = overview, 16 = street detail)
const MIN_ZOOM = 10;
const MAX_ZOOM = 16;
const AVERAGE_TILE_SIZE_KB = 20;

interface TileCoords {
  x: number;
  y: number;
  z: number;
}

interface BoundingBox {
  minLng: number;
  maxLng: number;
  minLat: number;
  maxLat: number;
}

// Convert lat/lng to tile coordinates using Slippy Map formula
export function latLngToTile(lat: number, lng: number, zoom: number): { x: number; y: number } {
  const n = Math.pow(2, zoom);
  const x = Math.floor((lng + 180) / 360 * n);
  const latRad = lat * Math.PI / 180;
  const y = Math.floor((1 - Math.log(Math.tan(latRad) + 1 / Math.cos(latRad)) / Math.PI) / 2 * n);
  return { x: Math.max(0, Math.min(n - 1, x)), y: Math.max(0, Math.min(n - 1, y)) };
}

// Convert tile coordinates back to lat/lng (northwest corner of tile)
export function tileToLatLng(x: number, y: number, zoom: number): { lat: number; lng: number } {
  const n = Math.pow(2, zoom);
  const lng = x / n * 360 - 180;
  const latRad = Math.atan(Math.sinh(Math.PI * (1 - 2 * y / n)));
  const lat = latRad * 180 / Math.PI;
  return { lat, lng };
}

// Calculate bounding box from route coordinates with padding
export function calculateBoundingBox(
  coordinates: [number, number][],
  paddingKm: number = 5
): BoundingBox {
  if (coordinates.length === 0) {
    throw new Error('No coordinates provided');
  }

  let minLng = Infinity;
  let maxLng = -Infinity;
  let minLat = Infinity;
  let maxLat = -Infinity;

  for (const [lng, lat] of coordinates) {
    minLng = Math.min(minLng, lng);
    maxLng = Math.max(maxLng, lng);
    minLat = Math.min(minLat, lat);
    maxLat = Math.max(maxLat, lat);
  }

  // Add padding (approximate: 1 degree ≈ 111 km)
  const paddingDegrees = paddingKm / 111;
  
  return {
    minLng: minLng - paddingDegrees,
    maxLng: maxLng + paddingDegrees,
    minLat: minLat - paddingDegrees,
    maxLat: maxLat + paddingDegrees,
  };
}

// Get all tile coordinates within a bounding box for a specific zoom level
export function getTilesInBounds(bounds: BoundingBox, zoom: number): TileCoords[] {
  const tiles: TileCoords[] = [];
  
  const topLeft = latLngToTile(bounds.maxLat, bounds.minLng, zoom);
  const bottomRight = latLngToTile(bounds.minLat, bounds.maxLng, zoom);
  
  for (let x = topLeft.x; x <= bottomRight.x; x++) {
    for (let y = topLeft.y; y <= bottomRight.y; y++) {
      tiles.push({ x, y, z: zoom });
    }
  }
  
  return tiles;
}

// Get all tiles needed for a route across all zoom levels
export function getRouteTiles(
  routeCoordinates: [number, number][],
  paddingKm: number = 5,
  minZoom: number = MIN_ZOOM,
  maxZoom: number = MAX_ZOOM
): TileCoords[] {
  const bounds = calculateBoundingBox(routeCoordinates, paddingKm);
  const allTiles: TileCoords[] = [];
  
  for (let zoom = minZoom; zoom <= maxZoom; zoom++) {
    const tiles = getTilesInBounds(bounds, zoom);
    allTiles.push(...tiles);
  }
  
  return allTiles;
}

// Generate Mapbox tile URLs for caching
export function generateTileUrls(tiles: TileCoords[], styleId: string = 'mapbox/navigation-night-v1'): string[] {
  const urls: string[] = [];
  
  for (const tile of tiles) {
    // Vector tiles
    const vectorUrl = `https://api.mapbox.com/styles/v1/${styleId}/tiles/${tile.z}/${tile.x}/${tile.y}?access_token=${MAPBOX_TOKEN}`;
    urls.push(vectorUrl);
  }
  
  return urls;
}

// Estimate download size
export function estimateDownloadSize(tileCount: number): {
  bytes: number;
  formatted: string;
} {
  const bytes = tileCount * AVERAGE_TILE_SIZE_KB * 1024;
  
  let formatted: string;
  if (bytes < 1024 * 1024) {
    formatted = `${Math.round(bytes / 1024)} KB`;
  } else if (bytes < 1024 * 1024 * 1024) {
    formatted = `${Math.round(bytes / (1024 * 1024))} MB`;
  } else {
    formatted = `${(bytes / (1024 * 1024 * 1024)).toFixed(1)} GB`;
  }
  
  return { bytes, formatted };
}

// Get tile count summary by zoom level
export function getTileCountByZoom(
  routeCoordinates: [number, number][],
  paddingKm: number = 5
): { zoom: number; count: number }[] {
  const bounds = calculateBoundingBox(routeCoordinates, paddingKm);
  const summary: { zoom: number; count: number }[] = [];
  
  for (let zoom = MIN_ZOOM; zoom <= MAX_ZOOM; zoom++) {
    const tiles = getTilesInBounds(bounds, zoom);
    summary.push({ zoom, count: tiles.length });
  }
  
  return summary;
}

// Calculate route distance in kilometers
export function calculateRouteDistanceKm(coordinates: [number, number][]): number {
  if (coordinates.length < 2) return 0;
  
  let totalDistance = 0;
  
  for (let i = 1; i < coordinates.length; i++) {
    const [lng1, lat1] = coordinates[i - 1];
    const [lng2, lat2] = coordinates[i];
    
    // Haversine formula
    const R = 6371; // Earth's radius in km
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLng = (lng2 - lng1) * Math.PI / 180;
    const a = 
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
      Math.sin(dLng / 2) * Math.sin(dLng / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    totalDistance += R * c;
  }
  
  return totalDistance;
}

// Check if coordinates are within cached bounds
export function isWithinBounds(
  lat: number,
  lng: number,
  bounds: BoundingBox
): boolean {
  return (
    lng >= bounds.minLng &&
    lng <= bounds.maxLng &&
    lat >= bounds.minLat &&
    lat <= bounds.maxLat
  );
}
