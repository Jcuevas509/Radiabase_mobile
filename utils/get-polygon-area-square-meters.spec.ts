import { getPolygonAreaSquareMeters } from './get-polygon-area-square-meters';

describe('getPolygonAreaSquareMeters', () => {
  it('measures a known square block within rounding error', () => {
    const side = 0.001; // ~111 m of latitude
    const actual = getPolygonAreaSquareMeters([
      { latitude: 0, longitude: 0 },
      { latitude: 0, longitude: side },
      { latitude: side, longitude: side },
      { latitude: side, longitude: 0 },
    ]);

    expect(actual).toBeGreaterThan(12_000);
    expect(actual).toBeLessThan(12_500);
  });

  it('returns zero for fewer than three vertices', () => {
    expect(getPolygonAreaSquareMeters([
      { latitude: 0, longitude: 0 },
      { latitude: 1, longitude: 1 },
    ])).toBe(0);
  });
});
