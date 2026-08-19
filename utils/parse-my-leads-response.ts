import type { MyLead, MyLeadsPage } from 'types/my-leads.types';

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

function normalizeLead(row: unknown): MyLead | null {
  if (!isRecord(row)) {
    return null;
  }
  const id = readNumber(row, 'id');
  if (id === null || !Number.isInteger(id) || id <= 0) {
    return null;
  }
  const firstName = readString(row, 'first_name', 'firstName');
  const lastName = readString(row, 'last_name', 'lastName');
  const fullName = readString(row, 'full_name', 'fullName') ?? (
    [firstName, lastName].filter(Boolean).join(' ') || `Lead #${id}`
  );
  const address = readString(row, 'full_address', 'fullAddress') ?? (
    [
      readString(row, 'address_line1', 'addressLine1'),
      readString(row, 'city'),
      readString(row, 'state'),
      readString(row, 'zip_code', 'zipCode'),
    ].filter(Boolean).join(', ') || null
  );

  return {
    id,
    fullName,
    firstName,
    lastName,
    phone: readString(row, 'phone_number', 'phoneNumber', 'phone'),
    email: readString(row, 'email'),
    address,
    status: readString(row, 'lead_status', 'leadStatus', 'status')?.toLowerCase() ?? 'new',
    notes: readString(row, 'notes'),
    appointmentAt: readDate(row, 'appt_date', 'appointment_date', 'appointmentAt'),
    createdAt: readDate(row, 'created_at', 'createdAt'),
    updatedAt: readDate(row, 'updated_at', 'updatedAt'),
    isConvertedToDeal: readBoolean(row, 'is_converted_to_deal', 'isConvertedToDeal'),
    officeName: readString(row, 'office_name', 'officeName'),
    verticalName: readString(row, 'vertical_name', 'verticalName'),
    closerName: readString(row, 'closer_name', 'closerName'),
  };
}

function findRows(payload: unknown): unknown[] {
  if (Array.isArray(payload)) {
    return payload;
  }
  if (!isRecord(payload)) {
    return [];
  }
  for (const key of ['data', 'leads', 'items', 'results']) {
    if (Array.isArray(payload[key])) {
      return payload[key];
    }
  }
  if (isRecord(payload.data)) {
    for (const key of ['data', 'leads', 'items', 'results']) {
      if (Array.isArray(payload.data[key])) {
        return payload.data[key];
      }
    }
  }
  return [];
}

function findMetadataContainers(payload: unknown): UnknownRecord[] {
  if (!isRecord(payload)) {
    return [];
  }
  return [
    payload,
    ...(isRecord(payload.pagination) ? [payload.pagination] : []),
    ...(isRecord(payload.meta) ? [payload.meta] : []),
    ...(isRecord(payload.data) ? [payload.data] : []),
    ...(isRecord(payload.data) && isRecord(payload.data.pagination)
      ? [payload.data.pagination]
      : []),
  ];
}

export function parseMyLeadsResponse(
  payload: unknown,
  page: number,
  pageSize: number,
): MyLeadsPage {
  const leads = findRows(payload)
    .map(normalizeLead)
    .filter((lead): lead is MyLead => lead !== null);
  const metadata = findMetadataContainers(payload);
  const totalCount = metadata
    .map((record) => readNumber(record, 'total_count', 'totalCount', 'total', 'count'))
    .find((value): value is number => value !== null) ?? leads.length;
  const explicitHasMore = metadata
    .map((record) => record.has_more ?? record.hasMore)
    .find((value): value is boolean => typeof value === 'boolean');
  return {
    leads,
    totalCount: Math.max(totalCount, leads.length),
    hasMore: explicitHasMore ?? (page * pageSize < totalCount || leads.length === pageSize),
  };
}
