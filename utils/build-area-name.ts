type BuildAreaNameInput = {
  readonly city?: string | null;
};

/**
 * Auto-name for painted turf: the city the area sits in, from its centroid
 * reverse geocode. Shown on the Home area cards only — the map circle keeps
 * its assignee label. Undefined when no city was found, so the API keeps its
 * own default.
 */
export function buildAreaName({ city }: BuildAreaNameInput): string | undefined {
  const cleanCity = (city ?? '').trim();
  return cleanCity || undefined;
}
