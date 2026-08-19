import type { CoordinateProps } from 'types/componentsTypes';

const EARTH_RADIUS_METERS = 6_371_008.8;

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
