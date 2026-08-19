const ISO_CALENDAR_DATE = /^(\d{4})-(\d{2})-(\d{2})/;

export function formatCalendarDate(value: string, locale?: string): string {
  const match = ISO_CALENDAR_DATE.exec(value);
  if (!match) {
    return 'Date unavailable';
  }
  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  const date = new Date(Date.UTC(year, month - 1, day));
  if (
    date.getUTCFullYear() !== year
    || date.getUTCMonth() !== month - 1
    || date.getUTCDate() !== day
  ) {
    return 'Date unavailable';
  }
  return date.toLocaleDateString(locale, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    timeZone: 'UTC',
  });
}
