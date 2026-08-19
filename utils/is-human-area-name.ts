const MAX_UNBROKEN_TOKEN_LENGTH = 14;

/**
 * True when an area name reads like something a person (or the city
 * auto-namer) chose. Server-generated ids — hex blobs, "AREA_1755...",
 * uuid-ish strings — contain digits or one long unbroken token, and should
 * fall back to the assignee label instead of showing on the Home cards.
 */
export function isHumanAreaName(name: string | null | undefined): boolean {
  const trimmed = (name ?? '').trim();
  if (!trimmed) {
    return false;
  }
  if (/\d/.test(trimmed)) {
    return false;
  }
  return trimmed.split(/\s+/).every((token) => token.length <= MAX_UNBROKEN_TOKEN_LENGTH);
}
