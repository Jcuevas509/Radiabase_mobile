import { simplifyStrokePoints } from './simplify-stroke-points';

describe('simplifyStrokePoints', () => {
  it('collapses a jittery straight line to its endpoints', () => {
    const actual = simplifyStrokePoints([
      { x: 0, y: 0 },
      { x: 10, y: 0.4 },
      { x: 20, y: -0.6 },
      { x: 30, y: 0.2 },
      { x: 40, y: 0 },
    ], 2);

    expect(actual).toEqual([
      { x: 0, y: 0 },
      { x: 40, y: 0 },
    ]);
  });

  it('keeps a real corner the rep drew', () => {
    const actual = simplifyStrokePoints([
      { x: 0, y: 0 },
      { x: 50, y: 0 },
      { x: 50, y: 50 },
    ], 2);

    expect(actual).toEqual([
      { x: 0, y: 0 },
      { x: 50, y: 0 },
      { x: 50, y: 50 },
    ]);
  });

  it('drops repeated and non-finite touch samples before simplifying', () => {
    const actual = simplifyStrokePoints([
      { x: 0, y: 0 },
      { x: 0, y: 0 },
      { x: Number.NaN, y: 4 },
      { x: 30, y: 30 },
      { x: 30, y: 30 },
    ], 2);

    expect(actual).toEqual([
      { x: 0, y: 0 },
      { x: 30, y: 30 },
    ]);
  });
});
