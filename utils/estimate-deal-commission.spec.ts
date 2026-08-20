import { estimateDealCommission, formatCommission } from './estimate-deal-commission';
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
  systemSizeKw: 10.66,
  pricePerWatt: 3.87,
};

describe('estimateDealCommission', () => {
  it('estimates from system size with the placeholder rate', () => {
    expect(estimateDealCommission(deal)).toBe(853);
  });

  it('falls back to a flat estimate when size is unknown', () => {
    expect(estimateDealCommission({ ...deal, systemSizeKw: null })).toBe(500);
  });

  it('estimates zero for canceled deals', () => {
    expect(estimateDealCommission({ ...deal, stage: 'CANCELED' })).toBe(0);
  });
});

describe('formatCommission', () => {
  it('formats whole dollars with separators', () => {
    expect(formatCommission(853)).toBe('$853');
    expect(formatCommission(1312)).toBe('$1,312');
  });
});
