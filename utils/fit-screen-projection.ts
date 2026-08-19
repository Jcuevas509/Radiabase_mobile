import type { CoordinateProps } from 'types/componentsTypes';
import type { StrokePoint } from 'utils/simplify-stroke-points';

const MAX_MERCATOR_LATITUDE = 85.05112878;
const MIN_VARIANCE = 1e-18;

export type ScreenProjectionPair = {
  readonly coordinate: CoordinateProps;
  readonly point: StrokePoint;
};

export type ScreenProjectionFit = {
  readonly lngScale: number;
  readonly lngOffset: number;
  readonly mercScale: number;
  readonly mercOffset: number;
};

/**
 * Least-squares fit of the map's actual on-screen projection from sampled
 * (coordinate, screen point) pairs. Web Mercator is linear in longitude and
 * in Mercator-Y over a viewport, so two independent 1D fits reproduce the
 * native projection exactly — without trusting the map's reported region,
 * which MapKit pads. Returns null when the samples cannot determine a fit.
 */
export function fitScreenProjection(
  pairs: readonly ScreenProjectionPair[],
): ScreenProjectionFit | null {
  const usable = pairs.filter((pair) =>
    Number.isFinite(pair.coordinate.latitude) &&
    Number.isFinite(pair.coordinate.longitude) &&
    Number.isFinite(pair.point.x) &&
    Number.isFinite(pair.point.y));
  if (usable.length < 2) {
    return null;
  }
  const lngFit = fitLine(
    usable.map((pair) => pair.coordinate.longitude),
    usable.map((pair) => pair.point.x),
  );
  const mercFit = fitLine(
    usable.map((pair) => toMercatorY(pair.coordinate.latitude)),
    usable.map((pair) => pair.point.y),
  );
  if (!lngFit || !mercFit) {
    return null;
  }
  return {
    lngScale: lngFit.scale,
    lngOffset: lngFit.offset,
    mercScale: mercFit.scale,
    mercOffset: mercFit.offset,
  };
}

/**
 * Where a coordinate lands on screen under the fitted projection.
 */
export function projectCoordinateWithFit(
  fit: ScreenProjectionFit,
  coordinate: CoordinateProps,
): StrokePoint {
  return {
    x: fit.lngScale * coordinate.longitude + fit.lngOffset,
    y: fit.mercScale * toMercatorY(coordinate.latitude) + fit.mercOffset,
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
  const longitude = (point.x - fit.lngOffset) / fit.lngScale;
  const latitude = fromMercatorY((point.y - fit.mercOffset) / fit.mercScale);
  if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) {
    return null;
  }
  return { latitude, longitude };
}

function fitLine(
  inputs: number[],
  outputs: number[],
): { scale: number; offset: number } | null {
  const count = inputs.length;
  const meanInput = inputs.reduce((sum, value) => sum + value, 0) / count;
  const meanOutput = outputs.reduce((sum, value) => sum + value, 0) / count;
  let covariance = 0;
  let variance = 0;
  for (let index = 0; index < count; index += 1) {
    const inputDelta = inputs[index] - meanInput;
    covariance += inputDelta * (outputs[index] - meanOutput);
    variance += inputDelta * inputDelta;
  }
  if (variance < MIN_VARIANCE) {
    return null;
  }
  const scale = covariance / variance;
  if (!Number.isFinite(scale) || scale === 0) {
    return null;
  }
  return { scale, offset: meanOutput - scale * meanInput };
}

function toMercatorY(latitudeDegrees: number): number {
  const clamped = Math.max(-MAX_MERCATOR_LATITUDE, Math.min(MAX_MERCATOR_LATITUDE, latitudeDegrees));
  const latitudeRadians = (clamped * Math.PI) / 180;
  return Math.log(Math.tan(Math.PI / 4 + latitudeRadians / 2));
}

function fromMercatorY(mercatorY: number): number {
  return ((2 * Math.atan(Math.exp(mercatorY)) - Math.PI / 2) * 180) / Math.PI;
}
