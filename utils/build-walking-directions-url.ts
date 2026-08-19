import type { CoordinateProps } from 'types/componentsTypes';

export function buildWalkingDirectionsUrl(
  destination: CoordinateProps,
  platform: string,
): string {
  const coordinate = encodeURIComponent(`${destination.latitude},${destination.longitude}`);
  if (platform === 'ios') {
    return `http://maps.apple.com/?daddr=${coordinate}&dirflg=w`;
  }
  return `https://www.google.com/maps/dir/?api=1&destination=${coordinate}&travelmode=walking&dir_action=navigate`;
}

export function formatWalkingDistance(distanceMeters: number): string {
  const feet = distanceMeters * 3.28084;
  if (feet < 1_000) {
    return `${Math.max(1, Math.round(feet))} ft`;
  }
  return `${(distanceMeters / 1_609.344).toFixed(1)} mi`;
}
