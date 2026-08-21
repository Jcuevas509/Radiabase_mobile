import type { MyDeal } from 'types/my-deals.types';

// PLACEHOLDER FORMULA — the real commission formula will replace the body
// of estimateDealCommissions. Keep the signature (deal in, {gross, net}
// dollars out): the card chip and the deal detail sheet both read from here
// and need no changes. Current placeholder: margin over a redline PPW times
// system watts is the gross; net applies a rep split. Calibrated so a 10 kW
// deal at $3.80 nets ≈ $6,500.
const PLACEHOLDER_REDLINE_PPW = 2.6;
const PLACEHOLDER_NET_SPLIT = 0.54;
const PLACEHOLDER_FLAT_GROSS_FALLBACK = 12_000;

export type DealCommissionEstimate = {
  readonly gross: number;
  readonly net: number;
};

/**
 * Estimated rep commission for a deal, in whole dollars. Canceled deals
 * estimate to zero.
 */
export function estimateDealCommissions(deal: MyDeal): DealCommissionEstimate {
  if ((deal.stage ?? '').toUpperCase() === 'CANCELED') {
    return { gross: 0, net: 0 };
  }
  const gross = typeof deal.systemSizeKw === 'number'
    && deal.systemSizeKw > 0
    && typeof deal.pricePerWatt === 'number'
    ? Math.max(0, Math.round((deal.pricePerWatt - PLACEHOLDER_REDLINE_PPW) * deal.systemSizeKw * 1000))
    : PLACEHOLDER_FLAT_GROSS_FALLBACK;
  return {
    gross,
    net: Math.round(gross * PLACEHOLDER_NET_SPLIT),
  };
}

/**
 * Formats a commission for display: $1,234.
 */
export function formatCommission(amount: number): string {
  return `$${amount.toLocaleString('en-US')}`;
}
