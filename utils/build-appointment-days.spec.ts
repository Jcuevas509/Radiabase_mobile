import { buildAppointmentDays } from './build-appointment-days';

describe('buildAppointmentDays', () => {
  it('starts with Today and Tomorrow', () => {
    const actualDays = buildAppointmentDays(new Date('2026-08-16T15:00:00'));

    expect(actualDays[0].label).toBe('Today');
    expect(actualDays[1].label).toBe('Tomorrow');
    expect(actualDays).toHaveLength(14);
  });
});
