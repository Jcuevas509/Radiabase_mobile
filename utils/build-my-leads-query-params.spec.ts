import { buildMyLeadsQueryParams } from 'utils/build-my-leads-query-params';

describe('buildMyLeadsQueryParams', () => {
  const base = {
    salesRepId: 42,
    page: 2,
    pageSize: 25,
    search: '  Maria  ',
  } as const;

  it('builds a scoped, trimmed all-leads query', () => {
    expect(buildMyLeadsQueryParams({ ...base, filter: 'all' })).toEqual({
      page: 2,
      limit: 25,
      sort_by: 'created_at',
      sort_direction: 'desc',
      sales_rep_id: 42,
      search: 'Maria',
    });
  });

  it('queries both backend follow-up statuses', () => {
    expect(buildMyLeadsQueryParams({ ...base, filter: 'follow_up' }).lead_status)
      .toEqual(['follow_up', 'rescheduled']);
  });

  it('queries scheduled leads on the server', () => {
    expect(buildMyLeadsQueryParams({ ...base, filter: 'scheduled' }).appt_date_start)
      .toBe('1970-01-01T00:00:00.000Z');
  });
});
