import { apiClient } from 'services/api-client';
import type { MyDealFilter, MyDealsPage } from 'types/my-deals.types';
import { buildMyDealsQueryParams } from 'utils/build-my-deals-query-params';
import { parseMyDealsResponse } from 'utils/parse-my-deals-response';

export const MY_DEALS_PAGE_SIZE = 25;

export async function fetchMyDeals(input: {
  readonly salesRepId: number;
  readonly page?: number;
  readonly search?: string;
  readonly filter?: MyDealFilter;
  readonly signal?: AbortSignal;
}): Promise<MyDealsPage> {
  const page = input.page ?? 1;
  const response = await apiClient.get<unknown>('/deals', {
    params: buildMyDealsQueryParams({
      salesRepId: input.salesRepId,
      page,
      pageSize: MY_DEALS_PAGE_SIZE,
      search: input.search,
      filter: input.filter ?? 'all',
    }),
    signal: input.signal,
  });
  return parseMyDealsResponse(response.data, page, MY_DEALS_PAGE_SIZE);
}
