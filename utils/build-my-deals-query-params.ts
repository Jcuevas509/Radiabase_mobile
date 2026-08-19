import type { MyDealFilter } from 'types/my-deals.types';

const FILTER_STAGES: Readonly<Record<Exclude<MyDealFilter, 'all'>, string[]>> = {
  in_progress: ['IN_PROGRESS'],
  completed: ['COMPLETED'],
  canceled: ['CANCELED'],
};

export function buildMyDealsQueryParams(input: {
  readonly salesRepId: number;
  readonly page: number;
  readonly pageSize: number;
  readonly search?: string;
  readonly filter: MyDealFilter;
}) {
  return {
    page: input.page,
    limit: input.pageSize,
    sort_by: 'date_sold',
    sort_direction: 'desc' as const,
    sales_rep_id: input.salesRepId,
    ...(input.search?.trim() ? { search: input.search.trim() } : {}),
    ...(input.filter === 'all' ? {} : { stages: FILTER_STAGES[input.filter] }),
  };
}
