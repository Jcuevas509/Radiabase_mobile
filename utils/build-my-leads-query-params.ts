import type { MyLeadFilter } from 'types/my-leads.types';

export type MyLeadsQueryParams = {
  readonly page: number;
  readonly limit: number;
  readonly sort_by: 'created_at';
  readonly sort_direction: 'desc';
  readonly sales_rep_id: number;
  readonly search?: string;
  readonly lead_status?: string[];
  readonly appt_date_start?: string;
};

const EARLIEST_SUPPORTED_APPOINTMENT = '1970-01-01T00:00:00.000Z';

export function buildMyLeadsQueryParams(input: {
  readonly salesRepId: number;
  readonly page: number;
  readonly pageSize: number;
  readonly search?: string;
  readonly filter: MyLeadFilter;
}): MyLeadsQueryParams {
  return {
    page: input.page,
    limit: input.pageSize,
    sort_by: 'created_at',
    sort_direction: 'desc',
    sales_rep_id: input.salesRepId,
    ...(input.search?.trim() ? { search: input.search.trim() } : {}),
    ...(input.filter === 'follow_up'
      ? { lead_status: ['follow_up', 'rescheduled'] }
      : {}),
    ...(input.filter === 'scheduled'
      ? { appt_date_start: EARLIEST_SUPPORTED_APPOINTMENT }
      : {}),
  };
}
