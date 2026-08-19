import { prepareDrawnStrokeVertices } from './prepare-drawn-stroke';
import type { StrokePoint } from './simplify-stroke-points';

function rectangleStroke(): StrokePoint[] {
  const points: StrokePoint[] = [];
  for (let x = 60; x <= 320; x += 4) points.push({ x, y: 200 });
  for (let y = 200; y <= 600; y += 4) points.push({ x: 320, y });
  for (let x = 320; x >= 60; x -= 4) points.push({ x, y: 600 });
  for (let y = 600; y >= 200; y -= 4) points.push({ x: 60, y });
  return points;
}

describe('prepareDrawnStrokeVertices', () => {
  it('cuts a painted rectangle down to a handful of editable corners', () => {
    const actual = prepareDrawnStrokeVertices(rectangleStroke());

    expect(actual.length).toBeGreaterThanOrEqual(4);
    expect(actual.length).toBeLessThanOrEqual(12);
  });

  it('drops the loop-closing tail so the first corner has one handle', () => {
    const actual = prepareDrawnStrokeVertices([
      { x: 100, y: 100 },
      { x: 300, y: 120 },
      { x: 280, y: 320 },
      { x: 90, y: 300 },
      { x: 104, y: 106 },
    ], 6, 12);

    expect(actual).toHaveLength(4);
    expect(actual[actual.length - 1]).toEqual({ x: 90, y: 300 });
  });

  it('leaves an open stroke untouched at the ends', () => {
    const actual = prepareDrawnStrokeVertices([
      { x: 0, y: 0 },
      { x: 200, y: 0 },
      { x: 200, y: 200 },
      { x: 400, y: 200 },
    ], 6, 12);

    expect(actual[0]).toEqual({ x: 0, y: 0 });
    expect(actual[actual.length - 1]).toEqual({ x: 400, y: 200 });
  });
});
