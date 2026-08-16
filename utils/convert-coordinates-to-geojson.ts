type MapCoordinate = { latitude: number; longitude: number };

/**
 * Converts app polygon points into a GeoJSON polygon (lng/lat, closed ring).
 */
export function convertCoordinatesToGeoJsonPolygon(coordinates: MapCoordinate[]): {
  type: 'Polygon';
  coordinates: number[][][];
} {
  const ring = coordinates.map((point) => [point.longitude, point.latitude]);
  const first = ring[0];
  const last = ring[ring.length - 1];
  if (first && last && (first[0] !== last[0] || first[1] !== last[1])) {
    ring.push(first);
  }
  return { type: 'Polygon', coordinates: [ring] };
}
