/**
 * Formats annual sunshine hours for the house-sheet Solar card.
 */
export function formatSolarSunshine(hours: number | null): string {
  if (hours == null || !Number.isFinite(hours)) {
    return '—';
  }
  return `${Math.round(hours).toLocaleString()} sun hrs/yr`;
}
