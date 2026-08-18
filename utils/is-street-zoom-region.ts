type MapRegion = {
  readonly latitudeDelta: number;
};

const MAX_LATITUDE_DELTA = 0.006;

/**
 * Returns true when the map is zoomed in enough to overlay building footprints.
 */
export function isStreetZoomRegion(region: MapRegion): boolean {
  return region.latitudeDelta > 0 && region.latitudeDelta <= MAX_LATITUDE_DELTA;
}
