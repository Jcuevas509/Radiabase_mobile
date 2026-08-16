import { useEffect, useRef, useState } from 'react';
import { Region } from 'react-native-maps';
import { fetchMapHouses, MapHouseResponse } from 'services/area-api';
import { getRegionBbox } from 'utils/get-region-bbox';
import { isStreetZoomRegion } from 'utils/is-street-zoom-region';

const FETCH_DEBOUNCE_MS = 350;

type UseMapHousesViewportInput = {
  readonly region: Region | null;
  readonly areaIds: number[];
  readonly isEnabled: boolean;
};

/**
 * Loads saved canvassing houses for the visible street-level viewport.
 */
export function useMapHousesViewport(input: UseMapHousesViewportInput): {
  houses: MapHouseResponse[];
  replaceHouse: (house: MapHouseResponse) => void;
} {
  const [houses, setHouses] = useState<MapHouseResponse[]>([]);
  const requestIdRef = useRef(0);
  useEffect(() => {
    if (!input.isEnabled || !input.region || !isStreetZoomRegion(input.region)) {
      return;
    }
    const visibleRegion = input.region;
    const timeoutId = setTimeout(() => {
      const requestId = requestIdRef.current + 1;
      requestIdRef.current = requestId;
      fetchMapHouses(input.areaIds, getRegionBbox(visibleRegion))
        .then((nextHouses) => {
          if (requestIdRef.current === requestId) {
            setHouses(nextHouses);
          }
        })
        .catch(() => undefined);
    }, FETCH_DEBOUNCE_MS);
    return () => {
      clearTimeout(timeoutId);
    };
  }, [input.areaIds, input.isEnabled, input.region]);
  return {
    houses,
    replaceHouse: (house: MapHouseResponse) => {
      setHouses((current) => {
        const without = current.filter((item) => item.id !== house.id);
        return [...without, house];
      });
    },
  };
}
