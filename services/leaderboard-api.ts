import { apiClient } from 'services/api-client';

export type SalesLeaderboardRow = {
  readonly rank: number;
  readonly name: string;
  readonly totalSales: number;
};

/**
 * GET /leaderboard/sales-dashboard — ranked closers by net sales for the
 * window. Staging returns blank rows until deals exist; callers treat an
 * empty result as "keep showing sample data".
 */
export async function fetchSalesLeaderboard(input: {
  readonly days?: number;
  readonly signal?: AbortSignal;
}): Promise<readonly SalesLeaderboardRow[]> {
  const end = new Date();
  const start = new Date(end.getTime() - (input.days ?? 90) * 86_400_000);
  const iso = (date: Date) => date.toISOString().slice(0, 10);
  const response = await apiClient.get<readonly {
    readonly rank: number;
    readonly salesRep?: string;
    readonly totalSales?: number;
  }[]>('/leaderboard/sales-dashboard', {
    params: { startDate: iso(start), endDate: iso(end) },
    signal: input.signal,
  });
  return (response.data ?? [])
    .filter((row) => typeof row.salesRep === 'string' && row.salesRep.trim().length > 0)
    .map((row) => ({
      rank: row.rank,
      name: row.salesRep as string,
      totalSales: row.totalSales ?? 0,
    }));
}
