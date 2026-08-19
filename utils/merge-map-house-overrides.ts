import type { MapHouseResponse } from 'services/area-api';
import type { MapBbox } from 'utils/get-region-bbox';

export type MapHouseOverride = {
  readonly house: MapHouseResponse;
  readonly startedRequestGenerationAtWrite: number;
};

function isInsideBbox(house: MapHouseResponse, bbox: MapBbox): boolean {
  return house.longitude >= bbox.west &&
    house.longitude <= bbox.east &&
    house.latitude >= bbox.south &&
    house.latitude <= bbox.north;
}

/**
 * Preserves confirmed local writes when an older viewport GET resolves later.
 * Only overrides inside the current viewport are retained in the rendered set.
 */
export function mergeMapHouseOverrides(
  houses: MapHouseResponse[],
  overrides: Iterable<MapHouseOverride>,
  bbox: MapBbox,
  responseStartedRequestGeneration: number,
): MapHouseResponse[] {
  const merged = new Map(houses.map((house) => [house.id, house]));
  for (const override of overrides) {
    if (
      override.startedRequestGenerationAtWrite >= responseStartedRequestGeneration &&
      isInsideBbox(override.house, bbox)
    ) {
      merged.set(override.house.id, override.house);
    }
  }
  return [...merged.values()];
}
