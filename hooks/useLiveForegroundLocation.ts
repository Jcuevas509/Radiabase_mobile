import * as Location from 'expo-location';
import { useEffect, useRef, useState } from 'react';
import type { CoordinateProps } from 'types/componentsTypes';

type UseLiveForegroundLocationInput = {
  readonly isEnabled: boolean;
  readonly onCoordinate: (coordinate: CoordinateProps) => void;
};

export const LIVE_LOCATION_OPTIONS: Location.LocationOptions = {
  accuracy: Location.Accuracy.Balanced,
  distanceInterval: 5,
  timeInterval: 3_000,
};

/** Maintains one foreground GPS watch and closes async setup races on cleanup. */
export function useLiveForegroundLocation(input: UseLiveForegroundLocationInput): boolean {
  const onCoordinateRef = useRef(input.onCoordinate);
  const [hasFreshCoordinate, setHasFreshCoordinate] = useState(false);
  useEffect(() => {
    onCoordinateRef.current = input.onCoordinate;
  }, [input.onCoordinate]);

  useEffect(() => {
    setHasFreshCoordinate(false);
    if (!input.isEnabled) {
      return;
    }
    let cancelled = false;
    let subscription: Location.LocationSubscription | null = null;
    Location.watchPositionAsync(LIVE_LOCATION_OPTIONS, (location) => {
      const { latitude, longitude } = location.coords;
      if (!cancelled && Number.isFinite(latitude) && Number.isFinite(longitude)) {
        onCoordinateRef.current({ latitude, longitude });
        setHasFreshCoordinate(true);
      }
    }).then((nextSubscription) => {
      if (cancelled) {
        nextSubscription.remove();
      } else {
        subscription = nextSubscription;
      }
    }).catch(() => {
      // The last known marker remains usable if foreground tracking is interrupted.
    });
    return () => {
      cancelled = true;
      subscription?.remove();
    };
  }, [input.isEnabled]);
  return input.isEnabled && hasFreshCoordinate;
}
