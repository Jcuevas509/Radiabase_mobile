export type AppointmentDay = {
  readonly value: string;
  readonly label: string;
};

function startOfDay(date: Date): Date {
  const nextDate = new Date(date);
  nextDate.setHours(0, 0, 0, 0);
  return nextDate;
}

/**
 * Next 14 days for the Submit Lead date picker.
 */
export function buildAppointmentDays(fromDate: Date = new Date()): AppointmentDay[] {
  const start = startOfDay(fromDate);
  return Array.from({ length: 14 }, (_, index) => {
    const date = new Date(start);
    date.setDate(start.getDate() + index);
    const label = index === 0
      ? 'Today'
      : index === 1
        ? 'Tomorrow'
        : date.toLocaleDateString([], { weekday: 'short', month: 'short', day: 'numeric' });
    return { value: date.toISOString(), label };
  });
}
