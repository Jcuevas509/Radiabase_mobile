import { buildAreaName } from './build-area-name';

describe('buildAreaName', () => {
  it('names turf as city comma state abbreviation', () => {
    expect(buildAreaName({ city: 'Garland', state: 'TX' })).toBe('Garland, TX');
  });

  it('abbreviates a full state name from the geocoder', () => {
    expect(buildAreaName({ city: 'Garland', state: 'Texas' })).toBe('Garland, TX');
    expect(buildAreaName({ city: 'Providence', state: 'Rhode Island' })).toBe('Providence, RI');
  });

  it('falls back to the city alone when the state is missing or unknown', () => {
    expect(buildAreaName({ city: 'Garland', state: null })).toBe('Garland');
    expect(buildAreaName({ city: 'Garland', state: 'Somewhere' })).toBe('Garland');
  });

  it('returns undefined when the geocode found no city', () => {
    expect(buildAreaName({ city: '  ', state: 'TX' })).toBeUndefined();
    expect(buildAreaName({ city: null, state: 'TX' })).toBeUndefined();
  });
});
