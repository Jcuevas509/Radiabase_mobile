import { getRegionBbox } from './get-region-bbox';

describe('getRegionBbox', () => {
  it('builds a padded bbox around the region center', () => {
    const actualBbox = getRegionBbox({
      latitude: 39.15,
      longitude: -84.05,
      latitudeDelta: 0.002,
      longitudeDelta: 0.002,
    });
    expect(actualBbox.west).toBeLessThan(-84.05);
    expect(actualBbox.east).toBeGreaterThan(-84.05);
    expect(actualBbox.south).toBeLessThan(39.15);
    expect(actualBbox.north).toBeGreaterThan(39.15);
  });
});
