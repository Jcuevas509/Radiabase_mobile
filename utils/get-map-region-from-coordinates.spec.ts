import { getMapRegionFromCoordinates } from './get-map-region-from-coordinates';

describe('getMapRegionFromCoordinates', () => {
  it('fits coordinates with padding and a minimum delta', () => {
    const actualRegion = getMapRegionFromCoordinates([
      { latitude: 39.1, longitude: -84.6 },
      { latitude: 39.2, longitude: -84.5 },
    ]);
    expect(actualRegion?.latitude).toBeCloseTo(39.15);
    expect(actualRegion?.longitude).toBeCloseTo(-84.55);
    expect(actualRegion?.latitudeDelta).toBeGreaterThanOrEqual(0.004);
    expect(actualRegion?.longitudeDelta).toBeGreaterThanOrEqual(0.004);
  });

  it('returns null for an empty polygon', () => {
    expect(getMapRegionFromCoordinates([])).toBeNull();
  });
});
