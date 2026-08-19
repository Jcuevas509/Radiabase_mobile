import type { BuildingProps } from 'types/componentsTypes';

export type AreaStatusCount = {
  readonly status: string;
  readonly count: number;
};

export type AreaProgressSummary = {
  readonly savedDoors: number;
  readonly workedDoors: number;
  readonly unworkedDoors: number;
  readonly leads: number;
  readonly completionPercent: number;
  readonly statusCounts: AreaStatusCount[];
};

export function buildAreaProgressSummary(houses: BuildingProps[]): AreaProgressSummary {
  const counts = new Map<string, number>();
  let workedDoors = 0;
  let leads = 0;

  for (const house of houses) {
    const status = house.subtitle?.trim().toLowerCase();
    if (status) {
      workedDoors += 1;
      counts.set(status, (counts.get(status) ?? 0) + 1);
    }
    if (house.additionalDetails?.leadId != null) {
      leads += 1;
    }
  }

  const savedDoors = houses.length;
  return {
    savedDoors,
    workedDoors,
    unworkedDoors: savedDoors - workedDoors,
    leads,
    completionPercent: savedDoors === 0 ? 0 : Math.round(workedDoors / savedDoors * 100),
    statusCounts: [...counts.entries()]
      .sort(([firstStatus], [secondStatus]) => firstStatus.localeCompare(secondStatus))
      .map(([status, count]) => ({ status, count })),
  };
}
