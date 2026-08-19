import type { CoordinateProps } from 'types/componentsTypes';
import type { StrokePoint } from 'utils/simplify-stroke-points';

export type MapViewport = {
  readonly region: {
    readonly latitude: number;
    readonly longitude: number;
    readonly latitudeDelta: number;
    readonly longitudeDelta: number;
  };
  readonly width: number;
  readonly height: number;
};

/**
 * Converts a screen point into a map coordinate with local Web Mercator math,
 * so a freehand stroke never needs an async native `coordinateForPoint` call
 * per touch sample. Latitude interpolates in Mercator space (matching how the
 * map projects); longitude interpolates linearly.
 */
export function projectScreenPointToCoordinate(
  point: StrokePoint,
  viewport: MapViewport,
): CoordinateProps | null {
  if (!isUsableViewport(viewport) || !Number.isFinite(point.x) || !Number.isFinite(point.y)) {
    return null;
  }
  const { region, width, height } = viewport;
  const west = region.longitude - region.longitudeDelta / 2;
  const topLatitude = clampLatitude(region.latitude + region.latitudeDelta / 2);
  const bottomLatitude = clampLatitude(region.latitude - region.latitudeDelta / 2);
  const mercatorTop = toMercatorY(topLatitude);
  const mercatorBottom = toMercatorY(bottomLatitude);
  const longitude = west + (point.x / width) * region.longitudeDelta;
  const mercatorY = mercatorTop + (point.y / height) * (mercatorBottom - mercatorTop);
  const latitude = fromMercatorY(mercatorY);
  if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) {
    return null;
  }
  return { latitude, longitude };
}

/**
 * Projects a whole stroke, dropping any point that cannot be converted.
 */
export function projectScreenPointsToCoordinates(
  points: readonly StrokePoint[],
  viewport: MapViewport,
): CoordinateProps[] {
  const coordinates: CoordinateProps[] = [];
  for (const point of points) {
    const coordinate = projectScreenPointToCoordinate(point, viewport);
    if (coordinate) {
      coordinates.push(coordinate);
    }
  }
  return coordinates;
}

function isUsableViewport(viewport: MapViewport): boolean {
  const { region, width, height } = viewport;
  return (
    Number.isFinite(width) && width > 0 &&
    Number.isFinite(height) && height > 0 &&
    Number.isFinite(region.latitude) &&
    Number.isFinite(region.longitude) &&
    Number.isFinite(region.latitudeDelta) && region.latitudeDelta > 0 &&
    Number.isFinite(region.longitudeDelta) && region.longitudeDelta > 0
  );
}

function clampLatitude(latitude: number): number {
  return Math.max(-85.05112878, Math.min(85.05112878, latitude));
}

function toMercatorY(latitudeDegrees: number): number {
  const latitudeRadians = (latitudeDegrees * Math.PI) / 180;
  return Math.log(Math.tan(Math.PI / 4 + latitudeRadians / 2));
}

function fromMercatorY(mercatorY: number): number {
  return ((2 * Math.atan(Math.exp(mercatorY)) - Math.PI / 2) * 180) / Math.PI;
}
