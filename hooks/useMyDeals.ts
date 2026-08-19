import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { fetchMyDeals } from 'services/deals-api';
import type { MyDeal, MyDealFilter } from 'types/my-deals.types';
import { getApiErrorMessage } from 'utils/get-api-error-message';

function mergeDealPages(current: MyDeal[], incoming: MyDeal[]): MyDeal[] {
  const byId = new Map(current.map((deal) => [deal.id, deal]));
  for (const deal of incoming) {
    byId.set(deal.id, deal);
  }
  return [...byId.values()];
}

export function useMyDeals(input: {
  readonly scopeKey: string | null;
  readonly salesRepId: number;
  readonly search: string;
  readonly filter: MyDealFilter;
  readonly isEnabled: boolean;
}) {
  const queryKey = useMemo(() => input.scopeKey
    ? JSON.stringify([input.scopeKey, input.search, input.filter])
    : null, [input.filter, input.scopeKey, input.search]);
  const [deals, setDeals] = useState<MyDeal[]>([]);
  const [loadedQueryKey, setLoadedQueryKey] = useState<string | null>(null);
  const [totalCount, setTotalCount] = useState(0);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [isLoading, setIsLoading] = useState(Boolean(input.isEnabled && queryKey));
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [errorQueryKey, setErrorQueryKey] = useState<string | null>(null);
  const [reloadKey, setReloadKey] = useState(0);
  const generationRef = useRef(0);
  const loadedQueryKeyRef = useRef<string | null>(null);
  const loadMoreControllerRef = useRef<AbortController | null>(null);
  const isLoadingMoreRef = useRef(false);

  useEffect(() => {
    if (!input.isEnabled || !queryKey || !Number.isInteger(input.salesRepId) || input.salesRepId <= 0) {
      generationRef.current += 1;
      const loadMoreController = loadMoreControllerRef.current;
      loadMoreControllerRef.current = null;
      loadMoreController?.abort();
      isLoadingMoreRef.current = false;
      setDeals([]);
      setLoadedQueryKey(null);
      loadedQueryKeyRef.current = null;
      setTotalCount(0);
      setPage(1);
      setHasMore(false);
      setIsLoading(false);
      setIsLoadingMore(false);
      setErrorMessage(null);
      setErrorQueryKey(null);
      return;
    }

    const generation = generationRef.current + 1;
    generationRef.current = generation;
    const loadMoreController = loadMoreControllerRef.current;
    loadMoreControllerRef.current = null;
    loadMoreController?.abort();
    isLoadingMoreRef.current = false;
    const controller = new AbortController();
    const queryChanged = loadedQueryKeyRef.current !== queryKey;
    if (queryChanged) {
      setDeals([]);
      setLoadedQueryKey(null);
      setTotalCount(0);
    }
    setIsLoading(true);
    setIsLoadingMore(false);
    setErrorMessage(null);
    setErrorQueryKey(null);

    fetchMyDeals({
      salesRepId: input.salesRepId,
      page: 1,
      search: input.search,
      filter: input.filter,
      signal: controller.signal,
    }).then((result) => {
      if (generationRef.current !== generation || controller.signal.aborted) {
        return;
      }
      loadedQueryKeyRef.current = queryKey;
      setDeals(result.deals);
      setLoadedQueryKey(queryKey);
      setTotalCount(result.totalCount);
      setPage(1);
      setHasMore(result.hasMore);
    }).catch((error) => {
      if (generationRef.current === generation && !controller.signal.aborted) {
        setErrorMessage(getApiErrorMessage(
          error,
          'Your deals could not be loaded. Check your connection and try again.',
        ));
        setErrorQueryKey(queryKey);
      }
    }).finally(() => {
      if (generationRef.current === generation) {
        setIsLoading(false);
      }
    });

    return () => {
      generationRef.current += 1;
      controller.abort();
    };
  }, [input.filter, input.isEnabled, input.salesRepId, input.search, queryKey, reloadKey]);

  useEffect(() => () => {
    loadMoreControllerRef.current?.abort();
    loadMoreControllerRef.current = null;
    isLoadingMoreRef.current = false;
  }, []);

  const visibleDeals = queryKey && loadedQueryKey === queryKey ? deals : [];
  const visibleTotalCount = queryKey && loadedQueryKey === queryKey ? totalCount : 0;

  const loadMore = useCallback(() => {
    if (
      !input.isEnabled
      || !queryKey
      || !hasMore
      || isLoading
      || isLoadingMoreRef.current
      || errorMessage
    ) {
      return;
    }
    const nextPage = page + 1;
    const generation = generationRef.current;
    const controller = new AbortController();
    loadMoreControllerRef.current?.abort();
    loadMoreControllerRef.current = controller;
    isLoadingMoreRef.current = true;
    setIsLoadingMore(true);

    fetchMyDeals({
      salesRepId: input.salesRepId,
      page: nextPage,
      search: input.search,
      filter: input.filter,
      signal: controller.signal,
    }).then((result) => {
      if (generationRef.current !== generation || controller.signal.aborted) {
        return;
      }
      const merged = mergeDealPages(deals, result.deals);
      setDeals(merged);
      setTotalCount((current) => Math.max(current, result.totalCount, merged.length));
      setPage(nextPage);
      setHasMore(result.hasMore);
    }).catch((error) => {
      if (generationRef.current === generation && !controller.signal.aborted) {
        setErrorMessage(getApiErrorMessage(error, 'More deals could not be loaded. Pull to retry.'));
        setErrorQueryKey(queryKey);
      }
    }).finally(() => {
      if (loadMoreControllerRef.current === controller) {
        loadMoreControllerRef.current = null;
        isLoadingMoreRef.current = false;
        if (generationRef.current === generation) {
          setIsLoadingMore(false);
        }
      }
    });
  }, [deals, errorMessage, hasMore, input.filter, input.isEnabled, input.salesRepId, input.search, isLoading, page, queryKey]);

  return {
    deals: visibleDeals,
    totalCount: visibleTotalCount,
    isLoading,
    isLoadingMore,
    errorMessage: queryKey && errorQueryKey === queryKey ? errorMessage : null,
    loadMore,
    reload: () => setReloadKey((current) => current + 1),
  };
}
