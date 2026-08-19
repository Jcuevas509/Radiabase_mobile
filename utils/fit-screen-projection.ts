import type { CoordinateProps } from 'types/componentsTypes';
import type { StrokePoint } from 'utils/simplify-stroke-points';

const MAX_MERCATOR_LATITUDE = 85.05112878;
const COLLINEARITY_RATIO = 1e-9;
const MIN_DETERMINANT = 1e-30;

export type ScreenProjectionPair = {
  readonly coordinate: CoordinateProps;
  readonly point: StrokePoint;
};

/**
 * Affine map from (longitude, mercatorY) to screen (x, y):
 *   x = xFromLng * lng + xFromMerc * merc + xOffset
 *   y = yFromLng * lng + yFromMerc * merc + yOffset
 */
export type ScreenProjectionFit = {
  readonly xFromLng: number;
  readonly xFromMerc: number;
  readonly xOffset: number;
  readonly yFromLng: number;
  readonly yFromMerc: number;
  readonly yOffset: number;
};

/**
 * Least-squares fit of the map's actual on-screen projection from sampled
 * (coordinate, screen point) pairs. Web Mercator under any camera rotation
 * is an affine transform of (longitude, mercator-Y) over a viewport, so a
 * full 2D affine fit reproduces the native projection exactly — including
 * a finger-rotated map — without trusting the map's reported region, which
 * MapKit pads. Returns null for fewer than three usable samples or a
 * collinear sample set.
 */
export function fitScreenProjection(
  pairs: readonly ScreenProjectionPair[],
): ScreenProjectionFit | null {
  const usable = pairs.filter((pair) =>
    Number.isFinite(pair.coordinate.latitude) &&
    Number.isFinite(pair.coordinate.longitude) &&
    Number.isFinite(pair.point.x) &&
    Number.isFinite(pair.point.y));
  if (usable.length < 3) {
    return null;
  }
  const lngs = usable.map((pair) => pair.coordinate.longitude);
  const mercs = usable.map((pair) => toMercatorY(pair.coordinate.latitude));
  const xs = usable.map((pair) => pair.point.x);
  const ys = usable.map((pair) => pair.point.y);
  const meanLng = mean(lngs);
  const meanMerc = mean(mercs);
  const meanX = mean(xs);
  const meanY = mean(ys);

  let sumLngLng = 0;
  let sumLngMerc = 0;
  let sumMercMerc = 0;
  let sumLngX = 0;
  let sumMercX = 0;
  let sumLngY = 0;
  let sumMercY = 0;
  for (let index = 0; index < usable.length; index += 1) {
    const lngDelta = lngs[index] - meanLng;
    const mercDelta = mercs[index] - meanMerc;
    const xDelta = xs[index] - meanX;
    const yDelta = ys[index] - meanY;
    sumLngLng += lngDelta * lngDelta;
    sumLngMerc += lngDelta * mercDelta;
    sumMercMerc += mercDelta * mercDelta;
    sumLngX += lngDelta * xDelta;
    sumMercX += mercDelta * xDelta;
    sumLngY += lngDelta * yDelta;
    sumMercY += mercDelta * yDelta;
  }

  const determinant = sumLngLng * sumMercMerc - sumLngMerc * sumLngMerc;
  if (!(determinant > COLLINEARITY_RATIO * sumLngLng * sumMercMerc + MIN_DETERMINANT)) {
    return null;
  }
  const xFromLng = (sumMercMerc * sumLngX - sumLngMerc * sumMercX) / determinant;
  const xFromMerc = (sumLngLng * sumMercX - sumLngMerc * sumLngX) / determinant;
  const yFromLng = (sumMercMerc * sumLngY - sumLngMerc * sumMercY) / determinant;
  const yFromMerc = (sumLngLng * sumMercY - sumLngMerc * sumLngY) / determinant;
  if (![xFromLng, xFromMerc, yFromLng, yFromMerc].every(Number.isFinite)) {
    return null;
  }
  return {
    xFromLng,
    xFromMerc,
    xOffset: meanX - xFromLng * meanLng - xFromMerc * meanMerc,
    yFromLng,
    yFromMerc,
    yOffset: meanY - yFromLng * meanLng - yFromMerc * meanMerc,
  };
}

/**
 * Where a coordinate lands on screen under the fitted projection.
 */
export function projectCoordinateWithFit(
  fit: ScreenProjectionFit,
  coordinate: CoordinateProps,
): StrokePoint {
  const merc = toMercatorY(coordinate.latitude);
  return {
    x: fit.xFromLng * coordinate.longitude + fit.xFromMerc * merc + fit.xOffset,
    y: fit.yFromLng * coordinate.longitude + fit.yFromMerc * merc + fit.yOffset,
  };
}

/**
 * The coordinate under a screen point for the fitted projection.
 */
export function invertScreenPointWithFit(
  fit: ScreenProjectionFit,
  point: StrokePoint,
): CoordinateProps | null {
  if (!Number.isFinite(point.x) || !Number.isFinite(point.y)) {
    return null;
  }
  const determinant = fit.xFromLng * fit.yFromMerc - fit.xFromMerc * fit.yFromLng;
  if (!Number.isFinite(determinant) || Math.abs(determinant) < MIN_DETERMINANT) {
    return null;
  }
  const xDelta = point.x - fit.xOffset;
  const yDelta = point.y - fit.yOffset;
  const longitude = (fit.yFromMerc * xDelta - fit.xFromMerc * yDelta) / determinant;
  const merc = (-fit.yFromLng * xDelta + fit.xFromLng * yDelta) / determinant;
  const latitude = fromMercatorY(merc);
  if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) {
    return null;
  }
  return { latitude, longitude };
}

function mean(values: number[]): number {
  return values.reduce((sum, value) => sum + value, 0) / values.length;
}

function toMercatorY(latitudeDegrees: number): number {
  const clamped = Math.max(-MAX_MERCATOR_LATITUDE, Math.min(MAX_MERCATOR_LATITUDE, latitudeDegrees));
  const latitudeRadians = (clamped * Math.PI) / 180;
  return Math.log(Math.tan(Math.PI / 4 + latitudeRadians / 2));
}

function fromMercatorY(mercatorY: number): number {
  return ((2 * Math.atan(Math.exp(mercatorY)) - Math.PI / 2) * 180) / Math.PI;
}
