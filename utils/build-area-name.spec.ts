import { buildAreaName } from './build-area-name';

describe('buildAreaName', () => {
  it('names turf after its city', () => {
    expect(buildAreaName({ city: 'Garland' })).toBe('Garland');
  });

  it('trims whitespace from the geocoded city', () => {
    expect(buildAreaName({ city: '  Garland ' })).toBe('Garland');
  });

  it('returns undefined when the geocode found no city', () => {
    expect(buildAreaName({ city: '  ' })).toBeUndefined();
    expect(buildAreaName({ city: null })).toBeUndefined();
  });
});
