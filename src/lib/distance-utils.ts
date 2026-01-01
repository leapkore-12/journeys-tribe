/**
 * Calculate the distance between two GPS coordinates using the Haversine formula
 * @returns distance in kilometers
 */
export function calculateDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371; // Earth's radius in km
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  
  return R * c;
}

function toRad(deg: number): number {
  return deg * (Math.PI / 180);
}

/**
 * Calculate total distance from an array of positions
 * @param positions Array of [lng, lat] coordinates
 * @returns total distance in kilometers
 */
export function calculateTotalDistance(positions: [number, number][]): number {
  if (positions.length < 2) return 0;
  
  let total = 0;
  for (let i = 1; i < positions.length; i++) {
    const [lng1, lat1] = positions[i - 1];
    const [lng2, lat2] = positions[i];
    total += calculateDistance(lat1, lng1, lat2, lng2);
  }
  
  return total;
}
