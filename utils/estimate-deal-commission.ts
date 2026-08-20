import type { MyDeal } from 'types/my-deals.types';

// PLACEHOLDER FORMULA — the real commission formula will replace the body
// of this function. Keep the signature (deal in, dollars out): the card
// chip and the deal detail sheet both read from here and need no changes.
const PLACEHOLDER_DOLLARS_PER_WATT = 0.08;
const PLACEHOLDER_FLAT_FALLBACK = 500;

/**
 * Estimated rep commission for a deal, in whole dollars. Canceled deals
 * estimate to zero.
 */
export function estimateDealCommission(deal: MyDeal): number {
  if ((deal.stage ?? '').toUpperCase() === 'CANCELED') {
    return 0;
  }
  if (typeof deal.systemSizeKw === 'number' && deal.systemSizeKw > 0) {
    return Math.round(deal.systemSizeKw * 1000 * PLACEHOLDER_DOLLARS_PER_WATT);
  }
  return PLACEHOLDER_FLAT_FALLBACK;
}

/**
 * Formats a commission for display: $1,234.
 */
export function formatCommission(amount: number): string {
  return `$${amount.toLocaleString('en-US')}`;
}
