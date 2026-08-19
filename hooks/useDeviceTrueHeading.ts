import * as Location from 'expo-location';
import { useEffect, useRef, useState } from 'react';
import { getShortestHeadingDelta, normalizeHeading } from 'utils/normalize-heading';

const MIN_REPORTED_DELTA_DEGREES = 0.5;

/**
 * Live device heading from the phone's fused compass sensors (gyro +
 * magnetometer via CoreLocation). Prefers true north; falls back to magnetic
 * north when declination is unavailable. Returns null while disabled or until
 * the first sample arrives, and re-renders only on visible (>=0.5°) changes.
 */
export function useDeviceTrueHeading(isEnabled: boolean): number | null {
  const [heading, setHeading] = useState<number | null>(null);
  const lastReportedRef = useRef<number | null>(null);

  useEffect(() => {
    if (!isEnabled) {
      lastReportedRef.current = null;
      setHeading(null);
      return;
    }
    let cancelled = false;
    let subscription: Location.LocationSubscription | null = null;
    Location.watchHeadingAsync((sample) => {
      const raw = sample.trueHeading >= 0 ? sample.trueHeading : sample.magHeading;
      if (!Number.isFinite(raw) || raw < 0) {
        return;
      }
      const next = normalizeHeading(raw);
      const previous = lastReportedRef.current;
      if (
        previous !== null &&
        Math.abs(getShortestHeadingDelta(previous, next)) < MIN_REPORTED_DELTA_DEGREES
      ) {
        return;
      }
      lastReportedRef.current = next;
      setHeading(next);
    })
      .then((nextSubscription) => {
        if (cancelled) {
          nextSubscription.remove();
          return;
        }
        subscription = nextSubscription;
      })
      .catch(() => {
        // No compass hardware or no permission: the caller hides the needle.
      });
    return () => {
      cancelled = true;
      subscription?.remove();
      subscription = null;
    };
  }, [isEnabled]);

  return heading;
}
