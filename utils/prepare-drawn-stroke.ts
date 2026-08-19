import { simplifyStrokePoints, type StrokePoint } from 'utils/simplify-stroke-points';

const DEFAULT_TOLERANCE_PX = 6;
const DEFAULT_MAX_VERTICES = 12;

/**
 * Reduces a painted 60fps touch trail to the few vertices worth editing:
 * simplify, cap the count, and drop a loop-closing tail point so the first
 * corner does not get a stacked duplicate handle.
 */
export function prepareDrawnStrokeVertices(
  points: readonly StrokePoint[],
  tolerancePx: number = DEFAULT_TOLERANCE_PX,
  maxVertices: number = DEFAULT_MAX_VERTICES,
): StrokePoint[] {
  const simplified = simplifyStrokePoints(points, tolerancePx);
  const bounded = limitVertexCount(simplified, maxVertices);
  return dropClosingTail(bounded, tolerancePx * 3);
}

function limitVertexCount(points: StrokePoint[], maxVertices: number): StrokePoint[] {
  if (points.length <= maxVertices || maxVertices < 3) {
    return points;
  }
  const stride = points.length / maxVertices;
  const limited: StrokePoint[] = [];
  for (let index = 0; index < maxVertices; index += 1) {
    limited.push(points[Math.floor(index * stride)]);
  }
  return limited;
}

function dropClosingTail(points: StrokePoint[], thresholdPx: number): StrokePoint[] {
  if (points.length < 4) {
    return points;
  }
  const first = points[0];
  const last = points[points.length - 1];
  const distance = Math.hypot(last.x - first.x, last.y - first.y);
  return distance <= thresholdPx ? points.slice(0, -1) : points;
}
