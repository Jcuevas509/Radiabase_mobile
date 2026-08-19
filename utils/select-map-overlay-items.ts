import type { Region } from 'react-native-maps';
import type { BuildingProps, CoordinateProps } from 'types/componentsTypes';

export type OverlayAreaWithCoordinates = {
  readonly coordinates: CoordinateProps[];
};

type Bounds = {
  readonly minLatitude: number;
  readonly maxLatitude: number;
  readonly minLongitude: number;
  readonly maxLongitude: number;
};

function getVisibleBounds(region: Region, paddingRatio: number): Bounds {
  const latitudePadding = region.latitudeDelta * paddingRatio;
  const longitudePadding = region.longitudeDelta * paddingRatio;
  return {
    minLatitude: region.latitude - region.latitudeDelta / 2 - latitudePadding,
    maxLatitude: region.latitude + region.latitudeDelta / 2 + latitudePadding,
    minLongitude: region.longitude - region.longitudeDelta / 2 - longitudePadding,
    maxLongitude: region.longitude + region.longitudeDelta / 2 + longitudePadding,
  };
}

function getCoordinateBounds(coordinates: CoordinateProps[]): Bounds | null {
  if (coordinates.length === 0) {
    return null;
  }
  let minLatitude = Number.POSITIVE_INFINITY;
  let maxLatitude = Number.NEGATIVE_INFINITY;
  let minLongitude = Number.POSITIVE_INFINITY;
  let maxLongitude = Number.NEGATIVE_INFINITY;
  for (const coordinate of coordinates) {
    minLatitude = Math.min(minLatitude, coordinate.latitude);
    maxLatitude = Math.max(maxLatitude, coordinate.latitude);
    minLongitude = Math.min(minLongitude, coordinate.longitude);
    maxLongitude = Math.max(maxLongitude, coordinate.longitude);
  }
  return { minLatitude, maxLatitude, minLongitude, maxLongitude };
}

function overlaps(first: Bounds, second: Bounds): boolean {
  return first.minLatitude <= second.maxLatitude &&
    first.maxLatitude >= second.minLatitude &&
    first.minLongitude <= second.maxLongitude &&
    first.maxLongitude >= second.minLongitude;
}

/**
 * Limits expensive native point projection to items on or near the screen.
 * Padding prevents annotations from blinking at the edge during small moves.
 */
export function selectMapOverlayItems<TArea extends OverlayAreaWithCoordinates>(
  region: Region,
  houses: BuildingProps[],
  areas: TArea[],
  paddingRatio = 0.25,
): { houses: BuildingProps[]; areas: TArea[] } {
  const visibleBounds = getVisibleBounds(region, paddingRatio);
  return {
    houses: houses.filter((house) => overlaps(visibleBounds, {
      minLatitude: house.latitude,
      maxLatitude: house.latitude,
      minLongitude: house.longitude,
      maxLongitude: house.longitude,
    })),
    areas: areas.filter((area) => {
      const areaBounds = getCoordinateBounds(area.coordinates);
      return areaBounds ? overlaps(visibleBounds, areaBounds) : false;
    }),
  };
}

export function simplifyOverlayRing(
  coordinates: CoordinateProps[],
  maximumPoints = 128,
): CoordinateProps[] {
  if (coordinates.length <= maximumPoints) {
    return coordinates;
  }
  return Array.from({ length: maximumPoints }, (_, index) =>
    coordinates[Math.floor(index * coordinates.length / maximumPoints)],
  );
}
