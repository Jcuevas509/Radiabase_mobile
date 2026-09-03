import { formatSolarKwh } from 'utils/format-solar-kwh';
import { formatSolarSunshine } from 'utils/format-solar-sunshine';

describe('formatSolarSunshine', () => {
  it('rounds sunshine hours', () => {
    expect(formatSolarSunshine(1840.4)).toBe('1,840 sun hrs/yr');
  });

  it('returns an em dash when missing', () => {
    expect(formatSolarSunshine(null)).toBe('—');
  });
});

describe('formatSolarKwh', () => {
  it('rounds yearly energy', () => {
    expect(formatSolarKwh(12400.2)).toBe('12,400 kWh/yr');
  });

  it('returns an em dash when missing', () => {
    expect(formatSolarKwh(null)).toBe('—');
  });
});
