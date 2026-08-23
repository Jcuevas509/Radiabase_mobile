import { useEffect, useMemo, useRef, useState } from 'react';
import { Region } from 'react-native-maps';
import { fetchMapBuildings, MapBuildingResponse } from 'services/area-api';
import { getRegionBbox } from 'utils/get-region-bbox';
import { isStreetZoomRegion } from 'utils/is-street-zoom-region';

const FETCH_DEBOUNCE_MS = 350;

type UseMapBuildingsInput = {
  readonly region: Region | null;
  readonly isEnabled: boolean;
  readonly refreshKey?: number;
};

type MapBuildingsState = {
  readonly buildings: MapBuildingResponse[];
  readonly hasError: boolean;
  readonly isReady: boolean;
};

/**
 * Loads Overture footprints for the visible street-level viewport.
 */
export function useMapBuildings(input: UseMapBuildingsInput): MapBuildingsState {
  const [buildings, setBuildings] = useState<MapBuildingResponse[]>([]);
  const [hasError, setHasError] = useState(false);
  const [readyQueryKey, setReadyQueryKey] = useState<string | null>(null);
  const requestIdRef = useRef(0);
  const viewportQuery = useMemo(() => {
    if (!input.isEnabled || !input.region || !isStreetZoomRegion(input.region)) {
      return null;
    }
    const bbox = getRegionBbox(input.region);
    return {
      bbox,
      key: [bbox.west, bbox.south, bbox.east, bbox.north].join(':'),
    };
  }, [input.isEnabled, input.region]);
  useEffect(() => {
    const requestId = requestIdRef.current + 1;
    requestIdRef.current = requestId;
    if (!viewportQuery) {
      setReadyQueryKey(null);
      setBuildings([]);
      setHasError(false);
      return;
    }
    const visibleQuery = viewportQuery;
    let abortController: AbortController | null = null;
    const timeoutId = setTimeout(() => {
      abortController = new AbortController();
      setHasError(false);
      fetchMapBuildings(visibleQuery.bbox, abortController.signal)
        .then((nextBuildings) => {
          if (requestIdRef.current === requestId) {
            setBuildings(nextBuildings);
            setReadyQueryKey(visibleQuery.key);
          }
        })
        .catch(() => {
          if (requestIdRef.current === requestId) {
            setBuildings([]);
            setReadyQueryKey(null);
            setHasError(true);
          }
        });
    }, FETCH_DEBOUNCE_MS);
    return () => {
      requestIdRef.current += 1;
      clearTimeout(timeoutId);
      abortController?.abort();
    };
    // Keyed on the computed bbox string, not object identities — the map
    // re-emits identical regions as fresh objects ("breathing"), which
    // previously aborted and refetched the same viewport in a loop.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [input.refreshKey, viewportQuery?.key]);
  return {
    buildings,
    hasError,
    isReady: Boolean(!hasError && viewportQuery && readyQueryKey === viewportQuery.key),
  };
}
