const CLOSE_ZOOM_MAX_LATITUDE_DELTA = 0.0035;

type ZoomRegion = {
  readonly latitudeDelta: number;
};

/**
 * True only when the camera is close enough that per-roof squares are worth
 * drawing. Sits inside the street-zoom gate (0.006, where data loads) so the
 * many footprint outlines stop rendering a beat before the viewport gets
 * wide enough to make them expensive.
 */
export function isCloseZoomRegion(
  region: ZoomRegion,
  maxLatitudeDelta: number = CLOSE_ZOOM_MAX_LATITUDE_DELTA,
): boolean {
  return region.latitudeDelta > 0 && region.latitudeDelta <= maxLatitudeDelta;
}
