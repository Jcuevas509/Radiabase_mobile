/**
 * Deterministic synthetic metrics layered over REAL entities (offices,
 * reps) while staging lacks the reporting endpoints and deal data to
 * compute them (see docs/staging-notes.md). Numbers are stable per entity
 * across reloads so screens look consistently "full".
 *
 * Disable with EXPO_PUBLIC_DEMO_STATS=0 to see only true live values.
 * Remove this layer once per-office/per-rep reporting exists.
 */
export const DEMO_STATS_ENABLED = process.env.EXPO_PUBLIC_DEMO_STATS !== '0';

/** Stable 0..1 hash of an entity key. */
function unit(key: number | string): number {
  const text = String(key);
  let hash = 2166136261;
  for (let index = 0; index < text.length; index += 1) {
    hash ^= text.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return ((hash >>> 0) % 10_000) / 10_000;
}

/** Stable integer in [min, max] for an entity key. */
export function demoInt(key: number | string, min: number, max: number): number {
  return min + Math.round(unit(key) * (max - min));
}

export function demoOfficeStats(officeId: number, repsCount: number): {
  readonly knocksThisWeek: number;
  readonly dealsThisMonth: number;
  readonly installsThisMonth: number;
  readonly cancelsThisMonth: number;
} {
  const reps = Math.max(1, repsCount);
  const dealsThisMonth = Math.max(1, Math.round(reps * (0.9 + unit(`d${officeId}`) * 1.2)));
  return {
    knocksThisWeek: reps * demoInt(`k${officeId}`, 55, 115),
    dealsThisMonth,
    installsThisMonth: Math.max(0, Math.round(dealsThisMonth * (0.3 + unit(`i${officeId}`) * 0.25))),
    cancelsThisMonth: demoInt(`c${officeId}`, 0, Math.max(1, Math.round(dealsThisMonth * 0.2))),
  };
}
