type LatLng = {
  readonly latitude: number;
  readonly longitude: number;
};

export type MapPreviewRegion = {
  readonly latitude: number;
  readonly longitude: number;
  readonly latitudeDelta: number;
  readonly longitudeDelta: number;
};

const MIN_DELTA = 0.004;
const PADDING = 1.6;

/**
 * Builds a MapView region that fits the polygon with a little padding.
 */
export function getMapRegionFromCoordinates(coordinates: LatLng[]): MapPreviewRegion | null {
  if (coordinates.length === 0) {
    return null;
  }
  const latitudes = coordinates.map((point) => point.latitude);
  const longitudes = coordinates.map((point) => point.longitude);
  const minLatitude = Math.min(...latitudes);
  const maxLatitude = Math.max(...latitudes);
  const minLongitude = Math.min(...longitudes);
  const maxLongitude = Math.max(...longitudes);
  return {
    latitude: (minLatitude + maxLatitude) / 2,
    longitude: (minLongitude + maxLongitude) / 2,
    latitudeDelta: Math.max((maxLatitude - minLatitude) * PADDING, MIN_DELTA),
    longitudeDelta: Math.max((maxLongitude - minLongitude) * PADDING, MIN_DELTA),
  };
}
