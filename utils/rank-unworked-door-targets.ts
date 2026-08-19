import type { MapBuildingResponse, MapHouseResponse } from 'services/area-api';
import type { CoordinateProps } from 'types/componentsTypes';
import type { Region } from 'react-native-maps';
import { getRegionBbox, type MapBbox } from 'utils/get-region-bbox';

export type UnworkedDoorTarget = {
  readonly coordinate: CoordinateProps;
  readonly distanceMeters: number;
  readonly buildingId: string | null;
  readonly houseId: number | null;
  readonly address: string | null;
};

const EARTH_RADIUS_METERS = 6_371_000;

function isValidCoordinate(coordinate: CoordinateProps): boolean {
  return Number.isFinite(coordinate.latitude) &&
    Number.isFinite(coordinate.longitude) &&
    coordinate.latitude >= -90 &&
    coordinate.latitude <= 90 &&
    coordinate.longitude >= -180 &&
    coordinate.longitude <= 180;
}

function distanceMeters(first: CoordinateProps, second: CoordinateProps): number {
  const toRadians = (degrees: number) => degrees * Math.PI / 180;
  const firstLatitude = toRadians(first.latitude);
  const secondLatitude = toRadians(second.latitude);
  const latitudeDelta = toRadians(second.latitude - first.latitude);
  const longitudeDelta = toRadians(second.longitude - first.longitude);
  const haversine = Math.sin(latitudeDelta / 2) ** 2 +
    Math.cos(firstLatitude) * Math.cos(secondLatitude) *
    Math.sin(longitudeDelta / 2) ** 2;
  return 2 * EARTH_RADIUS_METERS * Math.asin(Math.min(1, Math.sqrt(haversine)));
}

function isUnworked(house: MapHouseResponse | undefined): boolean {
  return !house?.currentStatus?.trim();
}

function isInBbox(coordinate: CoordinateProps, bbox: MapBbox): boolean {
  return coordinate.latitude >= bbox.south &&
    coordinate.latitude <= bbox.north &&
    coordinate.longitude >= bbox.west &&
    coordinate.longitude <= bbox.east;
}

/**
 * Ranks untouched roofs and saved doors in the current viewport by straight-line
 * distance. Navigation apps still choose the actual pedestrian route.
 */
export function rankUnworkedDoorTargets(
  origin: CoordinateProps,
  buildings: MapBuildingResponse[],
  houses: MapHouseResponse[],
  region: Region,
): UnworkedDoorTarget[] {
  if (!isValidCoordinate(origin)) {
    return [];
  }
  const bbox = getRegionBbox(region);
  const housesByExternalId = new Map(
    houses
      .filter((house) => house.externalId?.trim())
      .map((house) => [house.externalId!.trim(), house] as const),
  );
  const representedExternalIds = new Set<string>();
  const targets: UnworkedDoorTarget[] = [];

  for (const building of buildings) {
    const coordinate = { latitude: building.roofLat, longitude: building.roofLng };
    if (!isValidCoordinate(coordinate) || !isInBbox(coordinate, bbox)) {
      continue;
    }
    representedExternalIds.add(building.id);
    const savedHouse = housesByExternalId.get(building.id);
    if (!isUnworked(savedHouse)) {
      continue;
    }
    targets.push({
      coordinate,
      distanceMeters: distanceMeters(origin, coordinate),
      buildingId: building.id,
      houseId: savedHouse?.id ?? null,
      address: savedHouse?.address ?? null,
    });
  }

  for (const house of houses) {
    const coordinate = { latitude: house.latitude, longitude: house.longitude };
    if (!isUnworked(house) || !isValidCoordinate(coordinate) || !isInBbox(coordinate, bbox)) {
      continue;
    }
    const externalId = house.externalId?.trim() || null;
    if (externalId && representedExternalIds.has(externalId)) {
      continue;
    }
    targets.push({
      coordinate,
      distanceMeters: distanceMeters(origin, coordinate),
      buildingId: externalId,
      houseId: house.id,
      address: house.address,
    });
  }

  return targets.sort((first, second) => first.distanceMeters - second.distanceMeters);
}
