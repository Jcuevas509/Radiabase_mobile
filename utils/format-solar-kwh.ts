/**
 * Formats yearly DC energy for the house-sheet Solar card.
 */
export function formatSolarKwh(kwh: number | null): string {
  if (kwh == null || !Number.isFinite(kwh)) {
    return '—';
  }
  return `${Math.round(kwh).toLocaleString()} kWh/yr`;
}
