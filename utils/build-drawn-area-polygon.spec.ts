import { buildDrawnAreaPolygon, getPolygonAreaSquareMeters } from './build-drawn-area-polygon';
import type { StrokePoint } from './simplify-stroke-points';

const viewport = {
  region: {
    latitude: 32.834967,
    longitude: -96.563861,
    latitudeDelta: 0.004,
    longitudeDelta: 0.003,
  },
  width: 390,
  height: 844,
};

function rectangleStroke(): StrokePoint[] {
  const points: StrokePoint[] = [];
  for (let x = 60; x <= 320; x += 4) points.push({ x, y: 200 });
  for (let y = 200; y <= 600; y += 4) points.push({ x: 320, y });
  for (let x = 320; x >= 60; x -= 4) points.push({ x, y: 600 });
  for (let y = 600; y >= 200; y -= 4) points.push({ x: 60, y });
  return points;
}

describe('buildDrawnAreaPolygon', () => {
  it('turns a painted rectangle into a small clean polygon', () => {
    const actual = buildDrawnAreaPolygon(rectangleStroke(), viewport);

    expect(actual).not.toBeNull();
    expect(actual!.length).toBeGreaterThanOrEqual(4);
    expect(actual!.length).toBeLessThanOrEqual(40);
    expect(getPolygonAreaSquareMeters(actual!)).toBeGreaterThan(1_000);
  });

  it('rejects a tap or tiny scribble instead of creating turf', () => {
    const actual = buildDrawnAreaPolygon([
      { x: 100, y: 100 },
      { x: 101, y: 101 },
      { x: 100, y: 102 },
      { x: 99, y: 101 },
    ], viewport);

    expect(actual).toBeNull();
  });

  it('rejects a stroke that never forms a polygon', () => {
    const actual = buildDrawnAreaPolygon([
      { x: 0, y: 0 },
      { x: 200, y: 200 },
    ], viewport);

    expect(actual).toBeNull();
  });
});

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
