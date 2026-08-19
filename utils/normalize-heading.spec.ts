import { getShortestHeadingDelta, normalizeHeading } from './normalize-heading';

describe('normalizeHeading', () => {
  it('wraps headings into a single compass turn', () => {
    expect(normalizeHeading(0)).toBe(0);
    expect(normalizeHeading(360)).toBe(0);
    expect(normalizeHeading(-90)).toBe(270);
    expect(normalizeHeading(725)).toBe(5);
  });

  it('treats a non-finite heading as north', () => {
    expect(normalizeHeading(Number.NaN)).toBe(0);
  });
});

describe('getShortestHeadingDelta', () => {
  it('crosses north the short way in both directions', () => {
    expect(getShortestHeadingDelta(350, 10)).toBe(20);
    expect(getShortestHeadingDelta(10, 350)).toBe(-20);
  });

  it('returns the signed turn for a plain rotation', () => {
    expect(getShortestHeadingDelta(0, 90)).toBe(90);
    expect(getShortestHeadingDelta(90, 45)).toBe(-45);
  });

  it('resolves the opposite heading as a positive half turn', () => {
    expect(getShortestHeadingDelta(0, 180)).toBe(180);
  });
});
