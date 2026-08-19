type BuildAreaNameInput = {
  readonly city?: string | null;
  readonly state?: string | null;
};

const US_STATE_ABBREVIATIONS: Record<string, string> = {
  alabama: 'AL', alaska: 'AK', arizona: 'AZ', arkansas: 'AR', california: 'CA',
  colorado: 'CO', connecticut: 'CT', delaware: 'DE', florida: 'FL', georgia: 'GA',
  hawaii: 'HI', idaho: 'ID', illinois: 'IL', indiana: 'IN', iowa: 'IA',
  kansas: 'KS', kentucky: 'KY', louisiana: 'LA', maine: 'ME', maryland: 'MD',
  massachusetts: 'MA', michigan: 'MI', minnesota: 'MN', mississippi: 'MS',
  missouri: 'MO', montana: 'MT', nebraska: 'NE', nevada: 'NV',
  'new hampshire': 'NH', 'new jersey': 'NJ', 'new mexico': 'NM',
  'new york': 'NY', 'north carolina': 'NC', 'north dakota': 'ND', ohio: 'OH',
  oklahoma: 'OK', oregon: 'OR', pennsylvania: 'PA', 'rhode island': 'RI',
  'south carolina': 'SC', 'south dakota': 'SD', tennessee: 'TN', texas: 'TX',
  utah: 'UT', vermont: 'VT', virginia: 'VA', washington: 'WA',
  'west virginia': 'WV', wisconsin: 'WI', wyoming: 'WY',
  'district of columbia': 'DC',
};

/**
 * Auto-name for turf: "City, ST" from its centroid reverse geocode. Shown on
 * the Home area cards only — the map circle keeps its assignee label. The
 * state is abbreviated whether the geocoder returned "TX" or "Texas"; with
 * no usable state the city stands alone, and with no city the name is
 * undefined so callers keep their fallback.
 */
export function buildAreaName({ city, state }: BuildAreaNameInput): string | undefined {
  const cleanCity = (city ?? '').trim();
  if (!cleanCity) {
    return undefined;
  }
  const stateAbbreviation = abbreviateState(state);
  return stateAbbreviation ? `${cleanCity}, ${stateAbbreviation}` : cleanCity;
}

function abbreviateState(state: string | null | undefined): string | undefined {
  const trimmed = (state ?? '').trim();
  if (!trimmed) {
    return undefined;
  }
  if (/^[A-Za-z]{2}$/.test(trimmed)) {
    return trimmed.toUpperCase();
  }
  return US_STATE_ABBREVIATIONS[trimmed.toLowerCase()];
}
