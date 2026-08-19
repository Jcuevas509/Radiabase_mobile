import { formatCalendarDate } from 'utils/format-calendar-date';

describe('formatCalendarDate', () => {
  it('preserves the API calendar day without a local-timezone shift', () => {
    expect(formatCalendarDate('2026-08-01', 'en-US')).toBe('Aug 1, 2026');
    expect(formatCalendarDate('2026-08-01T00:00:00.000Z', 'en-US')).toBe('Aug 1, 2026');
  });

  it('rejects invalid calendar dates', () => {
    expect(formatCalendarDate('2026-02-30', 'en-US')).toBe('Date unavailable');
    expect(formatCalendarDate('not-a-date', 'en-US')).toBe('Date unavailable');
  });
});
