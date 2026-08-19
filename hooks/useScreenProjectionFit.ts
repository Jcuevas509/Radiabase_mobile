import type { RefObject } from 'react';
import { useEffect, useRef, useState } from 'react';
import type MapView from 'react-native-maps';
import type { Region } from 'react-native-maps';
import {
  fitScreenProjection,
  type ScreenProjectionFit,
  type ScreenProjectionPair,
} from 'utils/fit-screen-projection';

type UseScreenProjectionFitInput = {
  readonly mapRef: RefObject<MapView | null>;
  readonly region: Region | null;
  readonly isEnabled: boolean;
};

/**
 * One calibrated screen-projection fit per camera settle: four synthetic
 * points around the region center go through the map's own
 * pointForCoordinate, and the affine fit they define places any coordinate
 * on screen with pure math. Shared by every screen-space overlay so nothing
 * else needs native projection calls.
 */
export function useScreenProjectionFit({
  mapRef,
  region,
  isEnabled,
}: UseScreenProjectionFitInput): ScreenProjectionFit | null {
  const [fit, setFit] = useState<ScreenProjectionFit | null>(null);
  const requestIdRef = useRef(0);

  useEffect(() => {
    const map = mapRef.current;
    if (!isEnabled || !map || !region) {
      return;
    }
    const latitudeOffset = region.latitudeDelta * 0.3;
    const longitudeOffset = region.longitudeDelta * 0.3;
    const samples = [
      { latitude: region.latitude + latitudeOffset, longitude: region.longitude - longitudeOffset },
      { latitude: region.latitude + latitudeOffset, longitude: region.longitude + longitudeOffset },
      { latitude: region.latitude - latitudeOffset, longitude: region.longitude + longitudeOffset },
      { latitude: region.latitude - latitudeOffset, longitude: region.longitude - longitudeOffset },
    ];
    const requestId = requestIdRef.current + 1;
    requestIdRef.current = requestId;
    Promise.all(samples.map(async (coordinate) => {
      try {
        const point = await map.pointForCoordinate(coordinate);
        return Number.isFinite(point.x) && Number.isFinite(point.y)
          ? { coordinate, point }
          : null;
      } catch {
        return null;
      }
    })).then((pairs) => {
      if (requestIdRef.current !== requestId) {
        return;
      }
      setFit(fitScreenProjection(
        pairs.filter((pair): pair is ScreenProjectionPair => pair !== null),
      ));
    });
  }, [isEnabled, mapRef, region]);

  return isEnabled ? fit : null;
}
