type LatLng = {
  readonly latitude: number;
  readonly longitude: number;
};

/**
 * Returns the average coordinate of a polygon so labels can sit on the turf.
 */
export function getPolygonCentroid(coordinates: LatLng[]): LatLng | null {
  if (coordinates.length === 0) {
    return null;
  }
  const totals = coordinates.reduce(
    (sum, point) => ({
      latitude: sum.latitude + point.latitude,
      longitude: sum.longitude + point.longitude,
    }),
    { latitude: 0, longitude: 0 },
  );
  return {
    latitude: totals.latitude / coordinates.length,
    longitude: totals.longitude / coordinates.length,
  };
}
