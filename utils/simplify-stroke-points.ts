export type StrokePoint = {
  readonly x: number;
  readonly y: number;
};

const DEFAULT_TOLERANCE_PX = 3;

/**
 * Ramer-Douglas-Peucker simplification for a freehand screen-space stroke.
 * Keeps the drawn shape faithful while cutting a 60fps touch trail down to a
 * polygon the map (and draggable vertex editor) can handle.
 */
export function simplifyStrokePoints(
  points: readonly StrokePoint[],
  tolerancePx: number = DEFAULT_TOLERANCE_PX,
): StrokePoint[] {
  const deduped = dropConsecutiveDuplicates(points);
  if (deduped.length <= 2) {
    return deduped;
  }
  const tolerance = Number.isFinite(tolerancePx) && tolerancePx > 0
    ? tolerancePx
    : DEFAULT_TOLERANCE_PX;
  return douglasPeucker(deduped, tolerance);
}

function dropConsecutiveDuplicates(points: readonly StrokePoint[]): StrokePoint[] {
  const result: StrokePoint[] = [];
  for (const point of points) {
    if (!Number.isFinite(point.x) || !Number.isFinite(point.y)) {
      continue;
    }
    const previous = result[result.length - 1];
    if (previous && previous.x === point.x && previous.y === point.y) {
      continue;
    }
    result.push(point);
  }
  return result;
}

function douglasPeucker(points: StrokePoint[], tolerance: number): StrokePoint[] {
  const keep = new Array<boolean>(points.length).fill(false);
  keep[0] = true;
  keep[points.length - 1] = true;
  const stack: Array<[number, number]> = [[0, points.length - 1]];
  while (stack.length > 0) {
    const [startIndex, endIndex] = stack.pop() as [number, number];
    let maxDistance = 0;
    let maxIndex = -1;
    for (let index = startIndex + 1; index < endIndex; index += 1) {
      const distance = perpendicularDistance(points[index], points[startIndex], points[endIndex]);
      if (distance > maxDistance) {
        maxDistance = distance;
        maxIndex = index;
      }
    }
    if (maxIndex !== -1 && maxDistance > tolerance) {
      keep[maxIndex] = true;
      stack.push([startIndex, maxIndex]);
      stack.push([maxIndex, endIndex]);
    }
  }
  return points.filter((_, index) => keep[index]);
}

function perpendicularDistance(
  point: StrokePoint,
  lineStart: StrokePoint,
  lineEnd: StrokePoint,
): number {
  const deltaX = lineEnd.x - lineStart.x;
  const deltaY = lineEnd.y - lineStart.y;
  const lengthSquared = deltaX * deltaX + deltaY * deltaY;
  if (lengthSquared === 0) {
    return Math.hypot(point.x - lineStart.x, point.y - lineStart.y);
  }
  const t = ((point.x - lineStart.x) * deltaX + (point.y - lineStart.y) * deltaY) / lengthSquared;
  const clampedT = Math.max(0, Math.min(1, t));
  const projectedX = lineStart.x + clampedT * deltaX;
  const projectedY = lineStart.y + clampedT * deltaY;
  return Math.hypot(point.x - projectedX, point.y - projectedY);
}
