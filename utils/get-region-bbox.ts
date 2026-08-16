type MapRegion = {
  readonly latitude: number;
  readonly longitude: number;
  readonly latitudeDelta: number;
  readonly longitudeDelta: number;
};

export type MapBbox = {
  readonly west: number;
  readonly south: number;
  readonly east: number;
  readonly north: number;
};

const PADDING = 1.05;

/**
 * Converts a MapView region into a WGS84 bounding box for building queries.
 */
export function getRegionBbox(region: MapRegion): MapBbox {
  const latitudeSpan = (region.latitudeDelta / 2) * PADDING;
  const longitudeSpan = (region.longitudeDelta / 2) * PADDING;
  return {
    west: region.longitude - longitudeSpan,
    south: region.latitude - latitudeSpan,
    east: region.longitude + longitudeSpan,
    north: region.latitude + latitudeSpan,
  };
}
