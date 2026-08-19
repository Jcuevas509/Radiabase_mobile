import type { CoordinateProps } from 'types/componentsTypes';
import { simplifyStrokePoints, type StrokePoint } from 'utils/simplify-stroke-points';
import {
  projectScreenPointsToCoordinates,
  type MapViewport,
} from 'utils/project-screen-points-to-coordinates';

const DEFAULT_TOLERANCE_PX = 3;
const DEFAULT_MIN_AREA_SQUARE_METERS = 120;
const DEFAULT_MAX_VERTICES = 40;
const EARTH_RADIUS_METERS = 6_371_008.8;

export type BuildDrawnAreaPolygonOptions = {
  readonly tolerancePx?: number;
  readonly minAreaSquareMeters?: number;
  readonly maxVertices?: number;
};

/**
 * Turns a raw painted screen stroke into a clean geo polygon: simplify the
 * trail, project it to coordinates, and reject shapes too small to be turf.
 * Returns null when the stroke does not form a usable area.
 */
export function buildDrawnAreaPolygon(
  strokePoints: readonly StrokePoint[],
  viewport: MapViewport,
  options: BuildDrawnAreaPolygonOptions = {},
): CoordinateProps[] | null {
  const tolerancePx = options.tolerancePx ?? DEFAULT_TOLERANCE_PX;
  const minAreaSquareMeters = options.minAreaSquareMeters ?? DEFAULT_MIN_AREA_SQUARE_METERS;
  const maxVertices = options.maxVertices ?? DEFAULT_MAX_VERTICES;
  const simplified = simplifyStrokePoints(strokePoints, tolerancePx);
  const bounded = limitVertexCount(simplified, maxVertices);
  const coordinates = projectScreenPointsToCoordinates(bounded, viewport);
  if (coordinates.length < 3) {
    return null;
  }
  if (getPolygonAreaSquareMeters(coordinates) < minAreaSquareMeters) {
    return null;
  }
  return coordinates;
}

/**
 * Shoelace area of a lat/lng ring in square meters, using an equirectangular
 * approximation at the ring's mean latitude — accurate at street scale.
 */
export function getPolygonAreaSquareMeters(coordinates: readonly CoordinateProps[]): number {
  if (coordinates.length < 3) {
    return 0;
  }
  const meanLatitudeRadians =
    (coordinates.reduce((sum, coordinate) => sum + coordinate.latitude, 0) /
      coordinates.length) * (Math.PI / 180);
  const metersPerDegreeLatitude = (Math.PI / 180) * EARTH_RADIUS_METERS;
  const metersPerDegreeLongitude = metersPerDegreeLatitude * Math.cos(meanLatitudeRadians);
  let doubledArea = 0;
  for (let index = 0; index < coordinates.length; index += 1) {
    const current = coordinates[index];
    const next = coordinates[(index + 1) % coordinates.length];
    const currentX = current.longitude * metersPerDegreeLongitude;
    const currentY = current.latitude * metersPerDegreeLatitude;
    const nextX = next.longitude * metersPerDegreeLongitude;
    const nextY = next.latitude * metersPerDegreeLatitude;
    doubledArea += currentX * nextY - nextX * currentY;
  }
  return Math.abs(doubledArea) / 2;
}

function limitVertexCount(points: StrokePoint[], maxVertices: number): StrokePoint[] {
  if (points.length <= maxVertices || maxVertices < 3) {
    return points;
  }
  const stride = points.length / maxVertices;
  const limited: StrokePoint[] = [];
  for (let index = 0; index < maxVertices; index += 1) {
    limited.push(points[Math.floor(index * stride)]);
  }
  return limited;
}
