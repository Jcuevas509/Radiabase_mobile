import { throttle } from 'lodash';
import type { RefObject } from 'react';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type MapView from 'react-native-maps';
import { getShortestHeadingDelta, normalizeHeading } from 'utils/normalize-heading';

const READ_THROTTLE_MS = 100;
const MIN_VISIBLE_DELTA_DEGREES = 0.25;

/**
 * Tracks the map camera's rotation for the compass ring. `getCamera()` is the
 * only way react-native-maps exposes heading, so reads are throttled and
 * single-flight (a read requested mid-read coalesces into one follow-up).
 */
export function useMapCameraHeading(mapRef: RefObject<MapView | null>) {
  const [heading, setHeading] = useState(0);
  const mountedRef = useRef(true);
  const inFlightRef = useRef(false);
  const queuedRef = useRef(false);
  const readCameraRef = useRef<() => void>(() => undefined);

  const readCamera = useCallback(async () => {
    if (inFlightRef.current) {
      queuedRef.current = true;
      return;
    }
    inFlightRef.current = true;
    try {
      const camera = await mapRef.current?.getCamera();
      const rawHeading = camera?.heading;
      if (mountedRef.current && typeof rawHeading === 'number' && Number.isFinite(rawHeading)) {
        const next = normalizeHeading(rawHeading);
        setHeading((current) =>
          Math.abs(getShortestHeadingDelta(current, next)) >= MIN_VISIBLE_DELTA_DEGREES
            ? next
            : current,
        );
      }
    } catch {
      // The native map can be torn down mid-read; keep the last heading.
    } finally {
      inFlightRef.current = false;
      if (queuedRef.current) {
        queuedRef.current = false;
        readCameraRef.current();
      }
    }
  }, [mapRef]);

  useEffect(() => {
    readCameraRef.current = () => {
      void readCamera();
    };
  }, [readCamera]);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  const requestHeadingUpdate = useMemo(
    () => throttle(() => {
      void readCamera();
    }, READ_THROTTLE_MS, { leading: true, trailing: true }),
    [readCamera],
  );

  useEffect(() => () => {
    requestHeadingUpdate.cancel();
  }, [requestHeadingUpdate]);

  const resetMapToNorth = useCallback(() => {
    mapRef.current?.animateCamera({ heading: 0 }, { duration: 250 });
    setHeading(0);
  }, [mapRef]);

  const alignMapToHeading = useCallback((targetHeading: number) => {
    const next = normalizeHeading(targetHeading);
    mapRef.current?.animateCamera({ heading: next }, { duration: 300 });
    setHeading(next);
  }, [mapRef]);

  return { heading, requestHeadingUpdate, resetMapToNorth, alignMapToHeading };
}
