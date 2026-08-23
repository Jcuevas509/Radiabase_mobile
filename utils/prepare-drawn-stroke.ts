import { simplifyStrokePoints, type StrokePoint } from 'utils/simplify-stroke-points';

const DEFAULT_TOLERANCE_PX = 6;
const MIN_VERTICES = 6;
const MAX_VERTICES = 12;
const STROKE_PX_PER_VERTEX = 110;

/**
 * Reduces a painted 60fps touch trail to the few vertices worth editing:
 * simplify, budget the count by how big the drawn shape is (a small circle
 * earns ~6 handles, only a large sweep gets the full 12), and drop a
 * loop-closing tail point so the first corner does not get a stacked
 * duplicate handle. Pass `maxVertices` to override the dynamic budget.
 */
export function prepareDrawnStrokeVertices(
  points: readonly StrokePoint[],
  tolerancePx: number = DEFAULT_TOLERANCE_PX,
  maxVertices?: number,
): StrokePoint[] {
  const simplified = simplifyStrokePoints(points, tolerancePx);
  const budget = maxVertices ?? vertexBudgetForStroke(simplified);
  const bounded = limitVertexCount(simplified, budget);
  return dropClosingTail(bounded, tolerancePx * 3);
}

/** Scales the handle count with the stroke's perimeter length. */
function vertexBudgetForStroke(points: readonly StrokePoint[]): number {
  let perimeterPx = 0;
  for (let index = 1; index < points.length; index += 1) {
    perimeterPx += Math.hypot(
      points[index].x - points[index - 1].x,
      points[index].y - points[index - 1].y,
    );
  }
  return Math.min(
    MAX_VERTICES,
    Math.max(MIN_VERTICES, Math.round(perimeterPx / STROKE_PX_PER_VERTEX)),
  );
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
