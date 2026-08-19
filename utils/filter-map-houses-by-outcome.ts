import type { BuildingProps } from 'types/componentsTypes';

export type MapHouseOutcomeFilter =
  | 'all'
  | 'unworked'
  | 'interested'
  | 'not_interested'
  | 'not_home'
  | 'custom';

export function getMapHouseOutcome(house: BuildingProps): string {
  return house.subtitle?.trim().toLowerCase() || 'unworked';
}

export function filterMapHousesByOutcome(
  houses: BuildingProps[],
  filter: MapHouseOutcomeFilter,
): BuildingProps[] {
  if (filter === 'all') {
    return houses;
  }
  return houses.filter((house) => getMapHouseOutcome(house) === filter);
}

export function countMapHousesByOutcome(
  houses: BuildingProps[],
): Record<MapHouseOutcomeFilter, number> {
  const counts: Record<MapHouseOutcomeFilter, number> = {
    all: houses.length,
    unworked: 0,
    interested: 0,
    not_interested: 0,
    not_home: 0,
    custom: 0,
  };
  for (const house of houses) {
    const outcome = getMapHouseOutcome(house);
    if (outcome in counts && outcome !== 'all') {
      counts[outcome as Exclude<MapHouseOutcomeFilter, 'all'>] += 1;
    }
  }
  return counts;
}
