import { buildMyDealsQueryParams } from 'utils/build-my-deals-query-params';

describe('buildMyDealsQueryParams', () => {
  it('builds an authenticated-rep, newest-sale query', () => {
    expect(buildMyDealsQueryParams({
      salesRepId: 42,
      page: 1,
      pageSize: 25,
      search: '  Maria  ',
      filter: 'all',
    })).toEqual({
      page: 1,
      limit: 25,
      sort_by: 'date_sold',
      sort_direction: 'desc',
      sales_rep_id: 42,
      search: 'Maria',
    });
  });

  it.each([
    ['in_progress', 'IN_PROGRESS'],
    ['completed', 'COMPLETED'],
    ['canceled', 'CANCELED'],
  ] as const)('maps %s to the backend stage', (filter, stage) => {
    expect(buildMyDealsQueryParams({
      salesRepId: 42,
      page: 1,
      pageSize: 25,
      filter,
    }).stages).toEqual([stage]);
  });
});
