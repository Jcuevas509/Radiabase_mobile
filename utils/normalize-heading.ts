/**
 * Wraps any heading into [0, 360).
 */
export function normalizeHeading(value: number): number {
  if (!Number.isFinite(value)) {
    return 0;
  }
  return ((value % 360) + 360) % 360;
}

/**
 * Signed shortest rotation from one heading to another, in (-180, 180].
 * Lets a compass animate 350° -> 10° as +20° instead of spinning -340°.
 */
export function getShortestHeadingDelta(from: number, to: number): number {
  const delta = ((normalizeHeading(to) - normalizeHeading(from) + 540) % 360) - 180;
  return delta === -180 ? 180 : delta;
}
