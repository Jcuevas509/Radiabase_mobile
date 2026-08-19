import type { CoordinateProps } from 'types/componentsTypes';

const EARTH_RADIUS_METERS = 6_371_008.8;
const DEFAULT_VERTEX_COUNT = 40;
const MIN_RADIUS_METERS = 5;

const toRadians = (degrees: number) => degrees * Math.PI / 180;
const toDegrees = (radians: number) => radians * 180 / Math.PI;

export function getCoordinateDistanceMeters(
  first: CoordinateProps,
  second: CoordinateProps,
): number {
  const latitudeDelta = toRadians(second.latitude - first.latitude);
  const longitudeDelta = toRadians(second.longitude - first.longitude);
  const firstLatitude = toRadians(first.latitude);
  const secondLatitude = toRadians(second.latitude);
  const haversine = Math.sin(latitudeDelta / 2) ** 2 +
    Math.cos(firstLatitude) * Math.cos(secondLatitude) *
    Math.sin(longitudeDelta / 2) ** 2;

  return 2 * EARTH_RADIUS_METERS * Math.asin(Math.min(1, Math.sqrt(haversine)));
}

export function buildCircleCoordinates(
  center: CoordinateProps,
  edge: CoordinateProps,
  vertexCount = DEFAULT_VERTEX_COUNT,
): CoordinateProps[] {
  if (
    !Number.isFinite(center.latitude) ||
    !Number.isFinite(center.longitude) ||
    !Number.isFinite(edge.latitude) ||
    !Number.isFinite(edge.longitude)
  ) {
    return [];
  }

  const radiusMeters = getCoordinateDistanceMeters(center, edge);
  if (radiusMeters < MIN_RADIUS_METERS) {
    return [];
  }

  const count = Math.max(12, Math.min(64, Math.round(vertexCount)));
  const angularDistance = radiusMeters / EARTH_RADIUS_METERS;
  const centerLatitude = toRadians(center.latitude);
  const centerLongitude = toRadians(center.longitude);

  return Array.from({ length: count }, (_, index) => {
    const bearing = 2 * Math.PI * index / count;
    const latitude = Math.asin(
      Math.sin(centerLatitude) * Math.cos(angularDistance) +
      Math.cos(centerLatitude) * Math.sin(angularDistance) * Math.cos(bearing),
    );
    const longitude = centerLongitude + Math.atan2(
      Math.sin(bearing) * Math.sin(angularDistance) * Math.cos(centerLatitude),
      Math.cos(angularDistance) - Math.sin(centerLatitude) * Math.sin(latitude),
    );

    return {
      latitude: toDegrees(latitude),
      longitude: ((toDegrees(longitude) + 540) % 360) - 180,
    };
  });
}
