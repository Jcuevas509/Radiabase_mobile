import { getPolygonCentroid } from './get-polygon-centroid';

describe('getPolygonCentroid', () => {
  it('averages the polygon coordinates', () => {
    const actualCentroid = getPolygonCentroid([
      { latitude: 0, longitude: 0 },
      { latitude: 2, longitude: 2 },
    ]);
    expect(actualCentroid).toEqual({ latitude: 1, longitude: 1 });
  });

  it('returns null for an empty polygon', () => {
    expect(getPolygonCentroid([])).toBeNull();
  });
});
