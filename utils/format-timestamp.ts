/** "21.08.2026 03:52PM" — the stamp format the status cards show. */
export function formatStampedDateTime(date: Date): string {
  const pad = (value: number) => String(value).padStart(2, '0');
  const hours24 = date.getHours();
  const hours12 = hours24 % 12 === 0 ? 12 : hours24 % 12;
  const meridiem = hours24 < 12 ? 'AM' : 'PM';
  return `${pad(date.getDate())}.${pad(date.getMonth() + 1)}.${date.getFullYear()} `
    + `${pad(hours12)}:${pad(date.getMinutes())}${meridiem}`;
}
