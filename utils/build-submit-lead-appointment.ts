const FIRST_HOUR = 8;
const LAST_HOUR = 22;
const SLOT_MINUTES = 30;

export type AppointmentTimeSlot = {
  readonly value: string;
  readonly label: string;
};

/**
 * Builds the same 8:00 AM–10:00 PM half-hour slots as web Submit Lead.
 */
export function buildAppointmentTimeSlots(): AppointmentTimeSlot[] {
  const slots: AppointmentTimeSlot[] = [];
  for (let hour = FIRST_HOUR; hour <= LAST_HOUR; hour += 1) {
    for (let minute = 0; minute < 60; minute += SLOT_MINUTES) {
      if (hour === LAST_HOUR && minute > 0) {
        break;
      }
      const value = `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`;
      const suffix = hour >= 12 ? 'PM' : 'AM';
      const displayHour = hour === 0 ? 12 : hour > 12 ? hour - 12 : hour;
      slots.push({ value, label: `${displayHour}:${String(minute).padStart(2, '0')} ${suffix}` });
    }
  }
  return slots;
}

/**
 * Combines a calendar day and an HH:mm slot into an ISO appointment.
 */
export function combineAppointmentDateTime(date: Date, timeValue: string): string {
  const [hours, minutes] = timeValue.split(':').map(Number);
  const nextDate = new Date(date);
  nextDate.setHours(hours ?? 9, minutes ?? 0, 0, 0);
  return nextDate.toISOString();
}

/**
 * Formats the appointment the way the web form summarizes it.
 */
export function formatAppointmentSummary(isoDate: string | null, isImmediate: boolean): string {
  if (isImmediate) {
    return `Set for ${new Date().toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })} today`;
  }
  if (!isoDate) {
    return 'Choose a future date and time';
  }
  return new Date(isoDate).toLocaleString([], {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
}
