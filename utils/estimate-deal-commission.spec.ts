import { estimateDealCommissions, formatCommission } from './estimate-deal-commission';
import type { MyDeal } from 'types/my-deals.types';

const deal: MyDeal = {
  id: 1,
  customerName: 'Timothy Link',
  email: null,
  phone: null,
  address: null,
  status: 'Paid',
  stage: 'COMPLETED',
  dateSold: '2026-08-01',
  installDate: null,
  isAccountPaid: true,
  campaignName: null,
  setterName: null,
  closerName: null,
  officeName: null,
  providerName: null,
  systemSizeKw: 10,
  pricePerWatt: 3.8,
};

describe('estimateDealCommissions', () => {
  it('nets around $6,500 for a 10 kW deal at $3.80 with the placeholder formula', () => {
    const actual = estimateDealCommissions(deal);

    expect(actual.gross).toBe(12_000);
    expect(actual.net).toBe(6_480);
  });

  it('falls back to a flat gross when size or PPW is unknown', () => {
    const actual = estimateDealCommissions({ ...deal, systemSizeKw: null });

    expect(actual.gross).toBe(12_000);
    expect(actual.net).toBe(6_480);
  });

  it('estimates zero for canceled deals', () => {
    expect(estimateDealCommissions({ ...deal, stage: 'CANCELED' })).toEqual({ gross: 0, net: 0 });
  });
});

describe('formatCommission', () => {
  it('formats whole dollars with separators', () => {
    expect(formatCommission(6480)).toBe('$6,480');
  });
});
