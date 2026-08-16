import { useEffect, useRef, useState } from 'react';
import { Region } from 'react-native-maps';
import { fetchMapBuildings, MapBuildingResponse } from 'services/area-api';
import { getRegionBbox } from 'utils/get-region-bbox';
import { isStreetZoomRegion } from 'utils/is-street-zoom-region';

const FETCH_DEBOUNCE_MS = 350;

type UseMapBuildingsInput = {
  readonly region: Region | null;
  readonly isEnabled: boolean;
};

/**
 * Loads Overture footprints for the visible street-level viewport.
 */
export function useMapBuildings(input: UseMapBuildingsInput): MapBuildingResponse[] {
  const [buildings, setBuildings] = useState<MapBuildingResponse[]>([]);
  const requestIdRef = useRef(0);
  useEffect(() => {
    if (!input.isEnabled || !input.region) {
      return;
    }
    if (!isStreetZoomRegion(input.region)) {
      setBuildings([]);
      return;
    }
    const visibleRegion = input.region;
    const timeoutId = setTimeout(() => {
      const requestId = requestIdRef.current + 1;
      requestIdRef.current = requestId;
      fetchMapBuildings(getRegionBbox(visibleRegion))
        .then((nextBuildings) => {
          if (requestIdRef.current === requestId) {
            setBuildings(nextBuildings);
          }
        })
        .catch(() => undefined);
    }, FETCH_DEBOUNCE_MS);
    return () => {
      clearTimeout(timeoutId);
    };
  }, [input.isEnabled, input.region]);
  return buildings;
}
