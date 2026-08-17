export type ParsedHouseAddress = {
  readonly addressLine1: string;
  readonly city: string;
  readonly state: string;
  readonly zip: string;
};

const EMPTY_ADDRESS: ParsedHouseAddress = {
  addressLine1: '',
  city: '',
  state: '',
  zip: '',
};

/**
 * Returns true when the house still has a placeholder address.
 */
export function isUnknownMapAddress(address?: string | null): boolean {
  const normalized = address?.trim().toLowerCase() ?? '';
  return normalized.length === 0 || normalized === 'unknown address' || normalized === 'unknown';
}

function parseStateZip(part: string): { readonly state: string; readonly zip: string } {
  const match = part.match(/^([A-Za-z\s.]+?)(?:\s+(\d{5}(?:-\d{4})?))?$/);
  if (!match) {
    return { state: part, zip: '' };
  }
  return { state: (match[1] ?? '').trim(), zip: match[2] ?? '' };
}

function parseFormattedAddress(address?: string | null): ParsedHouseAddress {
  if (!address || isUnknownMapAddress(address)) {
    return EMPTY_ADDRESS;
  }
  const parts = address.split(',').map((part) => part.trim()).filter(Boolean);
  if (parts.length === 1) {
    return { ...EMPTY_ADDRESS, addressLine1: parts[0] };
  }
  const isLastPartCountry = parts[parts.length - 1].toUpperCase() === 'USA';
  const stateZipPart = isLastPartCountry ? parts[parts.length - 2] : parts[parts.length - 1];
  const cityPart = parts.length >= 3 ? parts[1] : '';
  const parsedStateZip = parseStateZip(stateZipPart ?? '');
  return {
    addressLine1: parts[0],
    city: cityPart,
    state: parsedStateZip.state,
    zip: parsedStateZip.zip,
  };
}

/**
 * Splits a house address into Submit Lead fields, ignoring Unknown Address.
 */
export function parseHouseAddress(input: {
  readonly address?: string | null;
  readonly city?: string | null;
  readonly state?: string | null;
  readonly zip?: string | null;
}): ParsedHouseAddress {
  const parsed = parseFormattedAddress(input.address);
  return {
    addressLine1: parsed.addressLine1,
    city: input.city?.trim() || parsed.city,
    state: input.state?.trim() || parsed.state,
    zip: input.zip?.trim() || parsed.zip,
  };
}

/**
 * Returns true when street/city/state/zip still need a lookup.
 */
export function hasIncompleteHouseAddress(address: ParsedHouseAddress): boolean {
  return !address.addressLine1 || !address.city || !address.state || address.zip.length < 5;
}
