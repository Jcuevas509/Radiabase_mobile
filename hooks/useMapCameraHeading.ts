import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type MapView from 'react-native-maps';
import { throttle } from 'lodash';

export function useMapCameraHeading(mapRef: React.RefObject<MapView | null>) {
  const [heading, setHeading] = useState(0);
  const mountedRef = useRef(true);
  const readInFlightRef = useRef(false);
  const readQueuedRef = useRef(false);
  const readCameraRef = useRef<() => void>(() => undefined);

  const readCamera = useCallback(async () => {
    if (readInFlightRef.current) {
      readQueuedRef.current = true;
      return;
    }

    readInFlightRef.current = true;
    try {
      const camera = await mapRef.current?.getCamera();
      if (!mountedRef.current || !camera || !Number.isFinite(camera.heading)) {
        return;
      }
      const normalizedHeading = ((camera.heading % 360) + 360) % 360;
      setHeading((current) =>
        Math.abs(current - normalizedHeading) >= 0.5 ? normalizedHeading : current,
      );
    } catch {
      // The native map can disappear while a camera read is in flight.
    } finally {
      readInFlightRef.current = false;
      if (mountedRef.current && readQueuedRef.current) {
        readQueuedRef.current = false;
        readCameraRef.current();
      }
    }
  }, [mapRef]);

  readCameraRef.current = () => {
    void readCamera();
  };

  const requestHeadingUpdate = useMemo(
    () => throttle(() => {
      void readCamera();
    }, 150, { leading: true, trailing: true }),
    [readCamera],
  );

  const resetMapToNorth = useCallback(() => {
    mapRef.current?.animateCamera({ heading: 0 }, { duration: 250 });
    setHeading(0);
  }, [mapRef]);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
      readQueuedRef.current = false;
      requestHeadingUpdate.cancel();
    };
  }, [requestHeadingUpdate]);

  return { heading, requestHeadingUpdate, resetMapToNorth };
}
