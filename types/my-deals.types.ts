export type MyDealFilter = 'all' | 'in_progress' | 'completed' | 'canceled';

export type MyDeal = {
  readonly id: number;
  readonly customerName: string;
  readonly email: string | null;
  readonly phone: string | null;
  readonly address: string | null;
  readonly status: string;
  readonly stage: string | null;
  readonly dateSold: string | null;
  readonly installDate: string | null;
  readonly isAccountPaid: boolean;
  readonly campaignName: string | null;
  readonly setterName: string | null;
  readonly closerName: string | null;
  readonly officeName: string | null;
  readonly providerName: string | null;
  readonly systemSizeKw?: number | null;
  readonly pricePerWatt?: number | null;
  readonly notes?: string | null;
};

export type MyDealsPage = {
  readonly deals: MyDeal[];
  readonly totalCount: number;
  readonly hasMore: boolean;
};
