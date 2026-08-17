import { buildAppointmentTimeSlots, combineAppointmentDateTime } from './build-submit-lead-appointment';

describe('buildAppointmentTimeSlots', () => {
  it('starts at 8:00 AM like the web Submit Lead picker', () => {
    const actualSlots = buildAppointmentTimeSlots();

    expect(actualSlots[0]).toEqual({ value: '08:00', label: '8:00 AM' });
    expect(actualSlots[1]).toEqual({ value: '08:30', label: '8:30 AM' });
  });
});

describe('combineAppointmentDateTime', () => {
  it('applies the selected time slot to the calendar day', () => {
    const actualIso = combineAppointmentDateTime(new Date('2026-08-17T00:00:00'), '09:30');

    expect(new Date(actualIso).getHours()).toBe(9);
    expect(new Date(actualIso).getMinutes()).toBe(30);
  });
});
