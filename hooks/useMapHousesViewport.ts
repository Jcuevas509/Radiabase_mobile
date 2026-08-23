import { useEffect, useMemo, useRef, useState } from 'react';
import { Region } from 'react-native-maps';
import { useAppIsActive } from 'hooks/useAppIsActive';
import { fetchMapHouses, MapHouseResponse } from 'services/area-api';
import { getRegionBbox } from 'utils/get-region-bbox';
import { isStreetZoomRegion } from 'utils/is-street-zoom-region';
import { mergeMapHouseOverrides, type MapHouseOverride } from 'utils/merge-map-house-overrides';

const FETCH_DEBOUNCE_MS = 350;
export const MAP_HOUSE_LIVE_SYNC_INTERVAL_MS = 15_000;

type UseMapHousesViewportInput = {
  readonly region: Region | null;
  readonly areaIds: number[];
  readonly isEnabled: boolean;
  readonly refreshKey?: number;
  readonly scopeKey: string | null;
  readonly liveSyncIntervalMs?: number;
};

/**
 * Loads saved canvassing houses for the visible street-level viewport.
 */
export function useMapHousesViewport(input: UseMapHousesViewportInput): {
  houses: MapHouseResponse[];
  replaceHouse: (house: MapHouseResponse) => void;
  hasError: boolean;
  isReady: boolean;
} {
  const [houses, setHouses] = useState<MapHouseResponse[]>([]);
  const [hasError, setHasError] = useState(false);
  const [liveRefreshKey, setLiveRefreshKey] = useState(0);
  const [readyQueryKey, setReadyQueryKey] = useState<string | null>(null);
  const isAppActive = useAppIsActive();
  const requestIdRef = useRef(0);
  const startedRequestGenerationRef = useRef(0);
  const houseOverridesRef = useRef(new Map<number, MapHouseOverride>());
  const scopeKeyRef = useRef<string | null>(input.scopeKey);
  const lastSuccessfulViewportKeyRef = useRef<string | null>(null);
  const viewportQuery = useMemo(() => {
    if (!input.isEnabled || !input.region || !isStreetZoomRegion(input.region)) {
      return null;
    }
    const bbox = getRegionBbox(input.region);
    const normalizedAreaIds = [...new Set(input.areaIds)].sort((first, second) => first - second);
    return {
      bbox,
      key: [
        input.scopeKey ?? '',
        normalizedAreaIds.join(','),
        bbox.west,
        bbox.south,
        bbox.east,
        bbox.north,
      ].join(':'),
    };
  }, [input.areaIds, input.isEnabled, input.region, input.scopeKey]);

  useEffect(() => {
    if (!isAppActive || !viewportQuery) {
      return;
    }
    const intervalMs = input.liveSyncIntervalMs ?? MAP_HOUSE_LIVE_SYNC_INTERVAL_MS;
    if (!Number.isFinite(intervalMs) || intervalMs <= 0) {
      return;
    }
    let intervalId: ReturnType<typeof setInterval> | null = null;
    const stop = () => {
      if (intervalId !== null) {
        clearInterval(intervalId);
        intervalId = null;
      }
    };
    const start = () => {
      if (intervalId === null) {
        intervalId = setInterval(() => {
          setLiveRefreshKey((current) => current + 1);
        }, intervalMs);
      }
    };
    start();
    return () => {
      stop();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [input.liveSyncIntervalMs, isAppActive, viewportQuery?.key]);

  useEffect(() => {
    const requestId = requestIdRef.current + 1;
    requestIdRef.current = requestId;
    if (scopeKeyRef.current !== input.scopeKey) {
      scopeKeyRef.current = input.scopeKey;
      houseOverridesRef.current.clear();
      lastSuccessfulViewportKeyRef.current = null;
      setReadyQueryKey(null);
      setHouses([]);
    }
    if (!input.isEnabled) {
      houseOverridesRef.current.clear();
      lastSuccessfulViewportKeyRef.current = null;
      setReadyQueryKey(null);
      setHouses([]);
      setHasError(false);
      return;
    }
    if (!viewportQuery) {
      lastSuccessfulViewportKeyRef.current = null;
      setReadyQueryKey(null);
      setHouses([]);
      setHasError(false);
      return;
    }
    if (!isAppActive) {
      setReadyQueryKey(null);
      setHasError(false);
      return;
    }
    const visibleBbox = viewportQuery.bbox;
    const viewportQueryKey = viewportQuery.key;
    let abortController: AbortController | null = null;
    const timeoutId = setTimeout(() => {
      abortController = new AbortController();
      const startedRequestGeneration = startedRequestGenerationRef.current + 1;
      startedRequestGenerationRef.current = startedRequestGeneration;
      setHasError(false);
      fetchMapHouses(input.areaIds, visibleBbox, abortController.signal)
        .then((nextHouses) => {
          if (requestIdRef.current === requestId) {
            lastSuccessfulViewportKeyRef.current = viewportQueryKey;
            setReadyQueryKey(viewportQueryKey);
            setHouses(mergeMapHouseOverrides(
              nextHouses,
              houseOverridesRef.current.values(),
              visibleBbox,
              startedRequestGeneration,
            ));
            for (const [houseId, override] of houseOverridesRef.current) {
              if (override.startedRequestGenerationAtWrite < startedRequestGeneration) {
                houseOverridesRef.current.delete(houseId);
              }
            }
          }
        })
        .catch(() => {
          if (requestIdRef.current === requestId) {
            if (lastSuccessfulViewportKeyRef.current !== viewportQueryKey) {
              setHouses([]);
            }
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
    // Keyed on the computed viewport string (scope+areas+bbox), not the
    // region/array identities that churn every render — see useMapBuildings.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [input.isEnabled, input.refreshKey, input.scopeKey, isAppActive, liveRefreshKey, viewportQuery?.key]);
  return {
    houses,
    hasError,
    isReady: Boolean(
      isAppActive &&
      !hasError &&
      viewportQuery &&
      readyQueryKey === viewportQuery.key
    ),
    replaceHouse: (house: MapHouseResponse) => {
      houseOverridesRef.current.set(house.id, {
        house,
        startedRequestGenerationAtWrite: startedRequestGenerationRef.current,
      });
      setHouses((current) => {
        const without = current.filter((item) => item.id !== house.id);
        return [...without, house];
      });
    },
  };
}
