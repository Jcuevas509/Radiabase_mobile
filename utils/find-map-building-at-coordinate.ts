import type { MapBuildingResponse } from 'services/area-api';

type Coordinate = {
  readonly latitude: number;
  readonly longitude: number;
};

function isPointOnSegment(point: Coordinate, start: Coordinate, end: Coordinate): boolean {
  const squaredLength =
    (end.longitude - start.longitude) ** 2 +
    (end.latitude - start.latitude) ** 2;
  if (squaredLength <= 1e-20) {
    return (
      Math.abs(point.latitude - start.latitude) <= 1e-10 &&
      Math.abs(point.longitude - start.longitude) <= 1e-10
    );
  }

  const crossProduct =
    (point.longitude - start.longitude) * (end.latitude - start.latitude) -
    (point.latitude - start.latitude) * (end.longitude - start.longitude);
  if (Math.abs(crossProduct) > 1e-12) {
    return false;
  }

  const dotProduct =
    (point.longitude - start.longitude) * (end.longitude - start.longitude) +
    (point.latitude - start.latitude) * (end.latitude - start.latitude);
  if (dotProduct < 0) {
    return false;
  }

  return dotProduct <= squaredLength;
}

export function containsCoordinate(coordinates: Coordinate[], point: Coordinate): boolean {
  let isInside = false;

  for (let currentIndex = 0, previousIndex = coordinates.length - 1;
    currentIndex < coordinates.length;
    previousIndex = currentIndex, currentIndex += 1) {
    const current = coordinates[currentIndex];
    const previous = coordinates[previousIndex];

    if (isPointOnSegment(point, previous, current)) {
      return true;
    }

    const crossesLatitude = (current.latitude > point.latitude) !== (previous.latitude > point.latitude);
    if (!crossesLatitude) {
      continue;
    }

    const longitudeAtLatitude =
      ((previous.longitude - current.longitude) * (point.latitude - current.latitude)) /
        (previous.latitude - current.latitude) + current.longitude;
    if (point.longitude < longitudeAtLatitude) {
      isInside = !isInside;
    }
  }

  return isInside;
}

function polygonArea(coordinates: Coordinate[]): number {
  let area = 0;
  for (let currentIndex = 0, previousIndex = coordinates.length - 1;
    currentIndex < coordinates.length;
    previousIndex = currentIndex, currentIndex += 1) {
    area +=
      coordinates[previousIndex].longitude * coordinates[currentIndex].latitude -
      coordinates[currentIndex].longitude * coordinates[previousIndex].latitude;
  }
  return Math.abs(area / 2);
}

/**
 * Finds the smallest roof polygon containing a map tap. This keeps Overture
 * buildings out of the native MapView child tree, avoiding iOS Fabric crashes
 * when a viewport replaces a large batch of polygon children.
 */
export function findMapBuildingAtCoordinate(
  buildings: MapBuildingResponse[],
  coordinate: Coordinate,
): MapBuildingResponse | null {
  let match: MapBuildingResponse | null = null;
  let matchArea = Number.POSITIVE_INFINITY;

  for (const building of buildings) {
    if (building.coordinates.length < 3 || !containsCoordinate(building.coordinates, coordinate)) {
      continue;
    }

    const area = polygonArea(building.coordinates);
    if (area < matchArea) {
      match = building;
      matchArea = area;
    }
  }

  return match;
}
