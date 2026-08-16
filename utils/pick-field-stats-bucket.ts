import { FieldStatsResponse } from 'services/area-api';

type FieldStatsBucket = FieldStatsResponse['today'];

/**
 * Picks the dashboard contact bucket for the Today / Week / Month tab.
 */
export function pickFieldStatsBucket(stats: FieldStatsResponse, tab: string): FieldStatsBucket {
  if (tab === 'This Week') {
    return stats.week;
  }
  if (tab === 'This Month') {
    return stats.month;
  }
  return stats.today;
}
