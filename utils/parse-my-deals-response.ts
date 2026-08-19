import type { MyDeal, MyDealsPage } from 'types/my-deals.types';

type UnknownRecord = Record<string, unknown>;

function isRecord(value: unknown): value is UnknownRecord {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function readString(record: UnknownRecord, ...keys: string[]): string | null {
  for (const key of keys) {
    const value = record[key];
    if (typeof value === 'string' && value.trim()) {
      return value.trim();
    }
  }
  return null;
}

function readNumber(record: UnknownRecord, ...keys: string[]): number | null {
  for (const key of keys) {
    const value = record[key];
    if (typeof value === 'number' && Number.isFinite(value)) {
      return value;
    }
    if (typeof value === 'string' && value.trim() && Number.isFinite(Number(value))) {
      return Number(value);
    }
  }
  return null;
}

function readBoolean(record: UnknownRecord, ...keys: string[]): boolean {
  for (const key of keys) {
    const value = record[key];
    if (typeof value === 'boolean') {
      return value;
    }
    if (value === 1 || value === '1' || value === 'true') {
      return true;
    }
  }
  return false;
}

function readDate(record: UnknownRecord, ...keys: string[]): string | null {
  const value = readString(record, ...keys);
  return value && Number.isFinite(Date.parse(value)) ? value : null;
}

function readAddress(record: UnknownRecord): string | null {
  const direct = readString(record, 'address', 'full_address', 'fullAddress');
  if (direct) {
    return direct;
  }
  const nested = record.address;
  if (isRecord(nested)) {
    return readString(nested, 'full_address', 'formatted', 'label') ?? (
      [
        readString(nested, 'address_line1', 'line1', 'street'),
        readString(nested, 'city'),
        readString(nested, 'state'),
        readString(nested, 'zip_code', 'zip'),
      ].filter(Boolean).join(', ') || null
    );
  }
  return [
    readString(record, 'address_line1', 'addressLine1'),
    readString(record, 'city'),
    readString(record, 'state'),
    readString(record, 'zip_code', 'zipCode'),
  ].filter(Boolean).join(', ') || null;
}

function normalizeDeal(row: unknown): MyDeal | null {
  if (!isRecord(row)) {
    return null;
  }
  const id = readNumber(row, 'id');
  if (id === null || !Number.isInteger(id) || id <= 0) {
    return null;
  }
  const firstName = readString(row, 'first_name', 'firstName');
  const lastName = readString(row, 'last_name', 'lastName');
  const customerName = readString(row, 'full_name', 'fullName', 'customer_name', 'customerName')
    ?? ([firstName, lastName].filter(Boolean).join(' ') || `Deal #${id}`);

  return {
    id,
    customerName,
    email: readString(row, 'email'),
    phone: readString(row, 'phone_number', 'phoneNumber', 'phone'),
    address: readAddress(row),
    status: readString(row, 'status', 'deal_status', 'dealStatus') ?? 'New',
    stage: readString(row, 'stage', 'deal_stage', 'dealStage'),
    dateSold: readDate(row, 'date_sold', 'dateSold'),
    installDate: readDate(row, 'install_date', 'installDate'),
    isAccountPaid: readBoolean(row, 'is_account_paid', 'isAccountPaid'),
    campaignName: readString(row, 'campaign_name', 'campaignName'),
    setterName: readString(row, 'setter_name', 'setterName'),
    closerName: readString(row, 'closer_name', 'closerName'),
    officeName: readString(row, 'office_name', 'officeName'),
    providerName: readString(row, 'service_provider_name', 'serviceProviderName'),
  };
}

function findRows(payload: unknown): unknown[] {
  if (Array.isArray(payload)) {
    return payload;
  }
  if (!isRecord(payload)) {
    return [];
  }
  for (const key of ['data', 'deals', 'items', 'results']) {
    if (Array.isArray(payload[key])) {
      return payload[key];
    }
  }
  if (isRecord(payload.data)) {
    for (const key of ['data', 'deals', 'items', 'results']) {
      if (Array.isArray(payload.data[key])) {
        return payload.data[key];
      }
    }
  }
  return [];
}

function metadataContainers(payload: unknown): UnknownRecord[] {
  if (!isRecord(payload)) {
    return [];
  }
  return [
    payload,
    ...(isRecord(payload.pagination) ? [payload.pagination] : []),
    ...(isRecord(payload.meta) ? [payload.meta] : []),
    ...(isRecord(payload.data) ? [payload.data] : []),
    ...(isRecord(payload.data) && isRecord(payload.data.meta)
      ? [payload.data.meta]
      : []),
    ...(isRecord(payload.data) && isRecord(payload.data.pagination)
      ? [payload.data.pagination]
      : []),
  ];
}

export function parseMyDealsResponse(
  payload: unknown,
  page: number,
  pageSize: number,
): MyDealsPage {
  const deals = findRows(payload)
    .map(normalizeDeal)
    .filter((deal): deal is MyDeal => deal !== null);
  const metadata = metadataContainers(payload);
  const totalCount = metadata
    .map((record) => readNumber(record, 'total_count', 'totalCount', 'total', 'count'))
    .find((value): value is number => value !== null) ?? deals.length;
  const explicitHasMore = metadata
    .map((record) => record.has_more ?? record.hasMore)
    .find((value): value is boolean => typeof value === 'boolean');

  return {
    deals,
    totalCount: Math.max(totalCount, deals.length),
    hasMore: explicitHasMore ?? (page * pageSize < totalCount || deals.length === pageSize),
  };
}
