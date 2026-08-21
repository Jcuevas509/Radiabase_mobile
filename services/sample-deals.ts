import { MY_DEALS_PAGE_SIZE } from 'services/deals-api';
import type { MyDeal, MyDealFilter, MyDealsPage } from 'types/my-deals.types';

const CUSTOMERS = [
  'Timothy Link', 'Skyler Krawetzki', 'Brent Michael', 'Michael Hug',
  'Beth Muffler', 'Carol Danvers', 'Hank Porter', 'Rosa Delgado',
  'Walt Freeman', 'Iris Chen', 'Ned Barlow', 'Opal Reyes',
  'Gus Halloran', 'Pearl Watts', 'Earl Jennings', 'Sadie Brock',
  'Mona Castillo', 'Doug Prewitt', 'Lena Fox', 'Ray Otterman',
];

const STATUS_SEQUENCE = [
  { status: 'Paid', stage: 'COMPLETED', paid: true },
  { status: 'Paid', stage: 'COMPLETED', paid: true },
  { status: 'Scheduled', stage: 'IN_PROGRESS', paid: false },
  { status: 'Canceled', stage: 'CANCELED', paid: false },
  { status: 'Funding', stage: 'IN_PROGRESS', paid: false },
  { status: 'Installed', stage: 'IN_PROGRESS', paid: false },
  { status: 'Paid', stage: 'COMPLETED', paid: true },
  { status: 'New', stage: 'IN_PROGRESS', paid: false },
  { status: 'Hold', stage: 'IN_PROGRESS', paid: false },
];

const INSTALLERS = ['Ecovole', 'Limitless Electric'];
const OFFICES = ['Suntrappers', 'Kaos Cartel'];
const SIZES = [10.66, 12.3, 8.61, 12.95, 16.4, 9.72, 11.05, 14.2, 7.9, 13.48];
const PPWS = [3.87, 3.42, 3.65, 3.28, 3.95, 3.51, 3.34, 4.05, 3.6, 3.73];
const DAY_MS = 86_400_000;

function buildSampleDeal(index: number, nowMs: number): MyDeal {
  const outcome = STATUS_SEQUENCE[index % STATUS_SEQUENCE.length];
  const dateSoldMs = nowMs - (index * 3 + 1) * DAY_MS;
  const installMs = dateSoldMs + 24 * DAY_MS;
  const hasInstall = outcome.status === 'Scheduled' || outcome.status === 'Installed' || outcome.paid;
  return {
    id: 5000 + index,
    customerName: CUSTOMERS[index % CUSTOMERS.length],
    email: `${CUSTOMERS[index % CUSTOMERS.length].toLowerCase().replace(/\s+/g, '.')}@example.com`,
    phone: `972555${String(2000 + index).slice(-4)}`,
    address: `${200 + index * 9} Pecan Hollow Dr, Garland, TX 75043`,
    status: outcome.status,
    stage: outcome.stage,
    dateSold: new Date(dateSoldMs).toISOString().slice(0, 10),
    installDate: hasInstall ? new Date(installMs).toISOString().slice(0, 10) : null,
    isAccountPaid: outcome.paid,
    campaignName: index % 4 === 0 ? `Kaos-S26-${String(index + 3).padStart(3, '0')}` : null,
    setterName: 'Adam Wolfson',
    closerName: 'Jose Cuevas',
    officeName: OFFICES[index % 7 === 0 ? 1 : 0],
    providerName: INSTALLERS[index % INSTALLERS.length],
    systemSizeKw: SIZES[index % SIZES.length],
    pricePerWatt: PPWS[index % PPWS.length],
    netPricePerWatt: Number((PPWS[index % PPWS.length] - 0.55).toFixed(2)),
    notes: outcome.status === 'Scheduled'
      ? `Scheduled ${new Date(installMs).toLocaleDateString(undefined, { month: '2-digit', day: '2-digit' })}`
      : null,
    transactionId: outcome.paid
      ? `TXN-${String(781200 + index * 137).slice(-6)}`
      : null,
    depositDate: outcome.paid
      ? new Date(installMs + 9 * DAY_MS).toISOString().slice(0, 10)
      : null,
  };
}

/**
 * Demo stand-in for fetchMyDeals while the UI is being designed: ~30 deals
 * mirroring the web table (size, PPW, campaign, installer, setter/closer,
 * Paid/Canceled statuses) honoring the same search, filter, and pagination
 * contract. Delete this file and its call-site flag once real data is wired.
 */
export async function fetchSampleMyDeals({
  page = 1,
  search,
  filter = 'all',
}: {
  readonly salesRepId: number;
  readonly page?: number;
  readonly search?: string;
  readonly filter?: MyDealFilter;
  readonly signal?: AbortSignal;
}): Promise<MyDealsPage> {
  const nowMs = Date.now();
  const all = Array.from({ length: 31 }, (_, index) => buildSampleDeal(index, nowMs));
  const query = (search ?? '').trim().toLowerCase();
  const stageByFilter: Record<string, string> = {
    in_progress: 'IN_PROGRESS',
    completed: 'COMPLETED',
    canceled: 'CANCELED',
  };
  const filtered = all.filter((deal) => {
    if (filter !== 'all' && deal.stage !== stageByFilter[filter]) {
      return false;
    }
    if (!query) {
      return true;
    }
    return [deal.customerName, deal.address ?? '', deal.phone ?? '', deal.email ?? '']
      .some((value) => value.toLowerCase().includes(query));
  });
  const start = (page - 1) * MY_DEALS_PAGE_SIZE;
  const deals = filtered.slice(start, start + MY_DEALS_PAGE_SIZE);
  return {
    deals,
    totalCount: filtered.length,
    hasMore: start + deals.length < filtered.length,
  };
}
