import { isHumanAreaName } from './is-human-area-name';

describe('isHumanAreaName', () => {
  it('accepts city and neighborhood style names', () => {
    expect(isHumanAreaName('Garland')).toBe(true);
    expect(isHumanAreaName('Fort Lauderdale')).toBe(true);
  });

  it('rejects machine-generated names', () => {
    expect(isHumanAreaName('AREA_1755551234')).toBe(false);
    expect(isHumanAreaName('9f2c1b4e-aa31-4c2f')).toBe(false);
    expect(isHumanAreaName('kjzhdfg8234jhg2f34jh')).toBe(false);
  });

  it('rejects empty or missing names', () => {
    expect(isHumanAreaName('')).toBe(false);
    expect(isHumanAreaName('   ')).toBe(false);
    expect(isHumanAreaName(null)).toBe(false);
    expect(isHumanAreaName(undefined)).toBe(false);
  });
});
