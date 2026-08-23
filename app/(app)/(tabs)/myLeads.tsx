import Search01Icon from '@hugeicons/core-free-icons/Search01Icon';
import UserGroupIcon from '@hugeicons/core-free-icons/UserGroupIcon';
import { HugeiconsIcon } from '@hugeicons/react-native';
import { Ionicons } from '@expo/vector-icons';
import { useIsFocused } from 'expo-router';
import { HeaderMenuButton, HeaderMessagesButton } from 'components/Menu/HeaderMenuButton';
import { UserAvatar } from 'components/Avatar/UserAvatar';
import { useSession } from 'context/AuthenticationContext';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Linking,
  Pressable,
  RefreshControl,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { fetchMyLeads, updateFieldLeadStatus } from 'services/leads-api';
import { fetchSampleMyLeads } from 'services/sample-leads';
import type { MyLead, MyLeadFilter } from 'types/my-leads.types';

// Demo data while the UI is being designed — including in published demo
// updates, so the design reviews with data. Off in tests (they exercise the
// real fetch path); flip to `false` to go back to live leads.
const USE_SAMPLE_LEADS = !process.env.JEST_WORKER_ID;
const loadMyLeadsPage = USE_SAMPLE_LEADS ? fetchSampleMyLeads : fetchMyLeads;
import { getApiErrorMessage } from 'utils/get-api-error-message';
import { getUserScopeKey } from 'utils/get-user-scope-key';

const FILTERS: ReadonlyArray<{ value: MyLeadFilter; label: string }> = [
  { value: 'all', label: 'All' },
  { value: 'scheduled', label: 'Scheduled' },
  { value: 'follow_up', label: 'Follow-up' },
];

const STATUS_COLORS: Record<string, string> = {
  new: '#1687E8',
  assigned: '#0F766E',
  follow_up: '#7C3AED',
  rescheduled: '#A16207',
  unresponsive: '#D97706',
  unqualified: '#71717A',
  not_interested: '#DC2626',
  sold: '#15803D',
  canceled: '#B91C1C',
};

function formatStatus(status: string): string {
  return status
    .split('_')
    .filter(Boolean)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ') || 'New';
}

function formatActivityTime(value: string): string {
  const date = new Date(value);
  if (!Number.isFinite(date.getTime())) {
    return '';
  }
  const time = date.toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' });
  const now = new Date();
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
  if (date.getTime() >= startOfToday) {
    return time;
  }
  if (date.getTime() >= startOfToday - 86_400_000) {
    return `Yesterday, ${time}`;
  }
  const day = date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
  return `${day}, ${time}`;
}

const LEAD_STATUS_OPTIONS: readonly string[] = [
  'new', 'assigned', 'follow_up', 'rescheduled', 'unresponsive',
  'unqualified', 'not_interested', 'sold', 'canceled',
];

const STATUS_ICONS: Record<string, keyof typeof Ionicons.glyphMap> = {
  new: 'add',
  assigned: 'person-outline',
  follow_up: 'return-up-forward',
  rescheduled: 'calendar-outline',
  unresponsive: 'remove-circle-outline',
  unqualified: 'ban-outline',
  not_interested: 'close',
  sold: 'cash-outline',
  canceled: 'close-circle-outline',
};

function mergeLeadPages(current: MyLead[], incoming: MyLead[]): MyLead[] {
  const byId = new Map(current.map((lead) => [lead.id, lead]));
  for (const lead of incoming) {
    byId.set(lead.id, lead);
  }
  return [...byId.values()];
}

function openContactUrl(url: string, failureMessage: string): void {
  Linking.openURL(url).catch(() => {
    Alert.alert('Could not open contact action', failureMessage);
  });
}

function LeadCard({
  lead,
  onChangeStatus,
}: {
  readonly lead: MyLead;
  readonly onChangeStatus: (lead: MyLead, status: string) => void;
}) {
  const statusColor = STATUS_COLORS[lead.status] ?? '#52525B';
  const statusIcon = STATUS_ICONS[lead.status] ?? 'ellipse-outline';
  const phoneDigits = lead.phone?.replace(/[^\d+]/g, '') ?? '';
  const [firstName = '', ...lastNameParts] = lead.fullName.split(' ');

  const openStatusPicker = () => {
    Alert.alert('Change status', lead.fullName, [
      ...LEAD_STATUS_OPTIONS
        .filter((status) => status !== lead.status)
        .map((status) => ({
          text: formatStatus(status),
          onPress: () => onChangeStatus(lead, status),
        })),
      { text: 'Cancel', style: 'cancel' as const },
    ]);
  };

  return (
    <View style={styles.row}>
      <UserAvatar
        firstName={firstName}
        lastName={lastNameParts.join(' ')}
        size={52}
        color="#18181B"
        ringWidth={1.5}
      />
      <View style={styles.rowBody}>
        <Text style={styles.name} numberOfLines={1}>{lead.fullName}</Text>
        {lead.address ? (
          <Text style={styles.rowAddress} numberOfLines={1}>{lead.address}</Text>
        ) : null}
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={`Change status for ${lead.fullName}`}
          hitSlop={4}
          onPress={openStatusPicker}
          style={({ pressed }) => [
            styles.statusPill,
            { backgroundColor: statusColor },
            pressed && styles.pressed,
          ]}
        >
          <Ionicons name={statusIcon} size={13} color="white" />
          <Text style={styles.statusText}>{formatStatus(lead.status)}</Text>
          <Ionicons name="chevron-down" size={12} color="white" />
        </Pressable>
      </View>
      <View style={styles.rowRight}>
        <Text style={styles.rowTime}>{formatActivityTime(lead.createdAt ?? '')}</Text>
        <View style={styles.rowRightBottom}>
          {phoneDigits ? (
            <>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={`Call ${lead.fullName}`}
                hitSlop={6}
                onPress={() => openContactUrl(`tel:${phoneDigits}`, 'Open the Phone app and try again.')}
                style={({ pressed }) => [styles.contactButton, pressed && styles.pressed]}
              >
                <Ionicons name="call" size={16} color="#1687E8" />
              </Pressable>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={`Message ${lead.fullName}`}
                hitSlop={6}
                onPress={() => openContactUrl(`sms:${phoneDigits}`, 'Open Messages and try again.')}
                style={({ pressed }) => [styles.contactButton, styles.contactButtonMessage, pressed && styles.pressed]}
              >
                <Ionicons name="chatbubble-ellipses" size={16} color="#34C759" />
              </Pressable>
            </>
          ) : null}
        </View>
      </View>
    </View>
  );
}

export default function MyLeadsScreen() {
  const { session } = useSession();
  const isFocused = useIsFocused();
  const salesRepId = Number(session?.user?.id ?? 0);
  const authenticatedScopeKey = session?.token ? getUserScopeKey(session.user) : null;
  const [leads, setLeads] = useState<MyLead[]>([]);
  const [loadedQueryKey, setLoadedQueryKey] = useState<string | null>(null);
  const [totalCount, setTotalCount] = useState(0);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [activeFilter, setActiveFilter] = useState<MyLeadFilter>('all');
  const [controlsScopeKey, setControlsScopeKey] = useState(authenticatedScopeKey);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [reloadKey, setReloadKey] = useState(0);
  const [isPullRefreshing, setIsPullRefreshing] = useState(false);
  const generationRef = useRef(0);
  const loadMoreControllerRef = useRef<AbortController | null>(null);
  const loadedQueryKeyRef = useRef<string | null>(null);
  const effectiveSearch = controlsScopeKey === authenticatedScopeKey ? debouncedSearch : '';
  const effectiveFilter = controlsScopeKey === authenticatedScopeKey ? activeFilter : 'all';
  const renderedSearch = controlsScopeKey === authenticatedScopeKey ? search : '';
  const currentQueryKey = authenticatedScopeKey
    ? JSON.stringify([authenticatedScopeKey, effectiveSearch, effectiveFilter])
    : null;

  useEffect(() => {
    const timeout = setTimeout(() => setDebouncedSearch(search.trim()), 350);
    return () => clearTimeout(timeout);
  }, [search]);

  useEffect(() => {
    generationRef.current += 1;
    loadMoreControllerRef.current?.abort();
    setLeads([]);
    setLoadedQueryKey(null);
    loadedQueryKeyRef.current = null;
    setTotalCount(0);
    setPage(1);
    setHasMore(false);
    setSearch('');
    setDebouncedSearch('');
    setActiveFilter('all');
    setControlsScopeKey(authenticatedScopeKey);
    setIsLoading(Boolean(authenticatedScopeKey && isFocused));
    setIsLoadingMore(false);
    setErrorMessage(null);
  }, [authenticatedScopeKey]);

  useEffect(() => {
    if (!isFocused) {
      return;
    }
    if (!authenticatedScopeKey) {
      loadMoreControllerRef.current?.abort();
      setLeads([]);
      setLoadedQueryKey(null);
      loadedQueryKeyRef.current = null;
      setTotalCount(0);
      setPage(1);
      setHasMore(false);
      setIsLoading(false);
      setIsLoadingMore(false);
      setErrorMessage(null);
      return;
    }
    const generation = generationRef.current + 1;
    generationRef.current = generation;
    loadMoreControllerRef.current?.abort();
    const controller = new AbortController();
    const queryChanged = loadedQueryKeyRef.current !== currentQueryKey;
    if (queryChanged) {
      setLeads([]);
      setLoadedQueryKey(null);
      setTotalCount(0);
    }
    setIsLoading(true);
    setIsLoadingMore(false);
    setErrorMessage(null);
    loadMyLeadsPage({
      salesRepId,
      page: 1,
      search: effectiveSearch,
      filter: effectiveFilter,
      signal: controller.signal,
    }).then((result) => {
      if (generationRef.current !== generation) {
        return;
      }
      loadedQueryKeyRef.current = currentQueryKey;
      setLeads(result.leads);
      setLoadedQueryKey(currentQueryKey);
      setTotalCount(result.totalCount);
      setPage(1);
      setHasMore(result.hasMore);
    }).catch((error) => {
      if (generationRef.current === generation && !controller.signal.aborted) {
        setErrorMessage(getApiErrorMessage(
          error,
          'Your leads could not be loaded. Check your connection and try again.',
        ));
      }
    }).finally(() => {
      if (generationRef.current === generation) {
        setIsLoading(false);
      }
      setIsPullRefreshing(false);
    });
    return () => {
      generationRef.current += 1;
      controller.abort();
    };
  }, [authenticatedScopeKey, currentQueryKey, effectiveFilter, effectiveSearch, isFocused, reloadKey, salesRepId]);

  useEffect(() => {
    return () => loadMoreControllerRef.current?.abort();
  }, []);

  const loadMore = useCallback(() => {
    if (!hasMore || isLoading || isLoadingMore || errorMessage) {
      return;
    }
    const nextPage = page + 1;
    const generation = generationRef.current;
    const controller = new AbortController();
    loadMoreControllerRef.current?.abort();
    loadMoreControllerRef.current = controller;
    setIsLoadingMore(true);
    loadMyLeadsPage({
      salesRepId,
      page: nextPage,
      search: effectiveSearch,
      filter: effectiveFilter,
      signal: controller.signal,
    }).then((result) => {
      if (generationRef.current !== generation || controller.signal.aborted) {
        return;
      }
      const merged = mergeLeadPages(leads, result.leads);
      setLeads(merged);
      setTotalCount((currentTotal) => Math.max(currentTotal, result.totalCount, merged.length));
      setPage(nextPage);
      setHasMore(result.hasMore);
    }).catch((error) => {
      if (generationRef.current === generation && !controller.signal.aborted) {
        setErrorMessage(getApiErrorMessage(error, 'More leads could not be loaded. Pull to retry.'));
      }
    }).finally(() => {
      if (generationRef.current === generation) {
        setIsLoadingMore(false);
      }
    });
  }, [effectiveFilter, effectiveSearch, errorMessage, hasMore, isLoading, isLoadingMore, leads, page, salesRepId]);

  const scopedLeads = currentQueryKey && loadedQueryKey === currentQueryKey
    ? leads
    : [];
  const scopedTotalCount = currentQueryKey && loadedQueryKey === currentQueryKey
    ? totalCount
    : 0;
  const scheduledCount = useMemo(
    () => scopedLeads.filter((lead) => lead.appointmentAt !== null).length,
    [scopedLeads],
  );
  const activeFilterLabel = FILTERS.find((filter) => filter.value === effectiveFilter)?.label ?? 'Leads';
  const summaryText = effectiveFilter === 'all'
    ? `${scopedTotalCount} total · ${scheduledCount} scheduled loaded`
    : `${scopedTotalCount} ${activeFilterLabel.toLowerCase()}`;

  const emptyMessage = effectiveSearch
    ? `No leads match “${effectiveSearch}”.`
    : effectiveFilter === 'all'
      ? 'Leads submitted from the field map will appear here.'
      : `No ${activeFilterLabel.toLowerCase()} leads are loaded.`;

  const handleChangeStatus = useCallback(async (lead: MyLead, nextStatus: string) => {
    if (nextStatus === lead.status) {
      return;
    }
    const previousStatus = lead.status;
    setLeads((current) => current.map((candidate) =>
      candidate.id === lead.id ? { ...candidate, status: nextStatus } : candidate));
    if (USE_SAMPLE_LEADS) {
      return;
    }
    try {
      await updateFieldLeadStatus({ leadId: lead.id, status: nextStatus });
    } catch (error) {
      setLeads((current) => current.map((candidate) =>
        candidate.id === lead.id ? { ...candidate, status: previousStatus } : candidate));
      Alert.alert(
        'Could not change status',
        getApiErrorMessage(error, 'The status was not saved. Try again.'),
      );
    }
  }, []);

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <View style={styles.header}>
        <View style={styles.headerSide}>
          <HeaderMenuButton />
        </View>
        <Text style={styles.headerTitle}>My Leads</Text>
        <View style={styles.headerRightGroup}>
          <HeaderMessagesButton />
          <View>
            <Ionicons name="notifications-outline" size={24} color="#18181B" />
            <View style={styles.bellBadge}>
              <Text style={styles.bellBadgeText}>7</Text>
            </View>
          </View>
        </View>
      </View>

      <View style={styles.searchContainer}>
        <HugeiconsIcon icon={Search01Icon} size={19} color="#71717A" strokeWidth={1.8} />
        <TextInput
          accessibilityLabel="Search my leads"
          autoCapitalize="none"
          autoCorrect={false}
          clearButtonMode="while-editing"
          onChangeText={setSearch}
          placeholder="Search name, phone, email, or address"
          placeholderTextColor="#A1A1AA"
          returnKeyType="search"
          style={styles.searchInput}
          value={renderedSearch}
        />
        {isLoading ? <ActivityIndicator size="small" color="#1687E8" /> : null}
      </View>

      <View style={styles.filters} accessibilityRole="tablist">
        {FILTERS.map((filter) => {
          const selected = effectiveFilter === filter.value;
          return (
            <Pressable
              key={filter.value}
              accessibilityRole="tab"
              accessibilityState={{ selected }}
              onPress={() => setActiveFilter(filter.value)}
              style={[styles.filterChip, selected && styles.filterChipSelected]}
            >
              <Text style={[styles.filterText, selected && styles.filterTextSelected]}>
                {filter.label}
              </Text>
            </Pressable>
          );
        })}
      </View>
      <Text style={styles.summaryText}>{summaryText}</Text>

      {errorMessage ? (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Retry loading my leads"
          onPress={() => setReloadKey((current) => current + 1)}
          style={({ pressed }) => [styles.errorBanner, pressed && styles.pressed]}
        >
          <Text style={styles.errorTitle}>Could not load leads</Text>
          <Text style={styles.errorText}>{errorMessage} Tap to retry.</Text>
        </Pressable>
      ) : null}

      <FlatList
        automaticallyAdjustContentInsets={false}
        contentInsetAdjustmentBehavior="never"
        style={styles.list}
        contentContainerStyle={[
          styles.listContent,
          scopedLeads.length === 0 && styles.emptyListContent,
        ]}
        ItemSeparatorComponent={() => <View style={styles.rowSeparator} />}
        data={scopedLeads}
        keyExtractor={(lead) => String(lead.id)}
        keyboardDismissMode="on-drag"
        keyboardShouldPersistTaps="handled"
        onEndReached={loadMore}
        onEndReachedThreshold={0.35}
        refreshControl={(
          <RefreshControl
            refreshing={isPullRefreshing}
            onRefresh={() => {
              setIsPullRefreshing(true);
              setReloadKey((current) => current + 1);
            }}
            tintColor="#1687E8"
          />
        )}
        renderItem={({ item }) => (
          <LeadCard lead={item} onChangeStatus={handleChangeStatus} />
        )}
        ListEmptyComponent={isLoading ? (
          <View style={styles.centerState}>
            <ActivityIndicator size="large" color="#1687E8" />
            <Text style={styles.stateMessage}>Loading your leads…</Text>
          </View>
        ) : (
          <View style={styles.centerState}>
            <View style={styles.emptyIcon}>
              <HugeiconsIcon icon={UserGroupIcon} size={30} color="#1687E8" strokeWidth={1.8} />
            </View>
            <Text style={styles.emptyTitle}>No leads here</Text>
            <Text style={styles.stateMessage}>{emptyMessage}</Text>
          </View>
        )}
        ListFooterComponent={isLoadingMore ? (
          <ActivityIndicator style={styles.footerLoader} color="#1687E8" />
        ) : null}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#F4F4F5',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  headerTitle: {
    color: '#18181B',
    fontSize: 20,
    fontWeight: '800',
  },
  headerSide: {
    width: 44,
    height: 44,
    alignItems: 'flex-start',
    justifyContent: 'center',
  },
  headerRight: {
    alignItems: 'flex-end',
  },
  headerRightGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    gap: 18,
    minWidth: 44,
    height: 44,
  },
  bellBadge: {
    position: 'absolute',
    top: -4,
    right: -6,
    minWidth: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: '#EF4444',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 3,
  },
  bellBadgeText: {
    color: 'white',
    fontSize: 10,
    fontWeight: '800',
  },
  searchContainer: {
    minHeight: 46,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 9,
    marginHorizontal: 20,
    marginTop: 4,
    borderRadius: 14,
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 12,
  },
  searchInput: {
    minHeight: 44,
    flex: 1,
    color: '#18181B',
    fontSize: 14,
  },
  filters: {
    flexDirection: 'row',
    backgroundColor: '#E4E4E7',
    borderRadius: 10,
    padding: 3,
    marginHorizontal: 20,
    marginTop: 10,
  },
  filterChip: {
    flex: 1,
    minHeight: 32,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  filterChipSelected: {
    backgroundColor: '#FFFFFF',
  },
  filterText: {
    color: '#71717A',
    fontSize: 13,
    fontWeight: '600',
  },
  filterTextSelected: {
    color: '#18181B',
  },
  summaryText: {
    marginHorizontal: 20,
    marginTop: 8,
    marginBottom: 2,
    color: '#A1A1AA',
    fontSize: 11,
    fontWeight: '600',
  },
  errorBanner: {
    marginHorizontal: 14,
    marginBottom: 8,
    borderRadius: 12,
    backgroundColor: '#FEF2F2',
    paddingHorizontal: 13,
    paddingVertical: 10,
  },
  errorTitle: {
    color: '#991B1B',
    fontSize: 13,
    fontWeight: '800',
  },
  errorText: {
    marginTop: 2,
    color: '#B91C1C',
    fontSize: 12,
    lineHeight: 17,
  },
  list: {
    marginTop: 10,
    backgroundColor: '#FFFFFF',
  },
  listContent: {
    paddingBottom: 24,
  },
  emptyListContent: {
    flexGrow: 1,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    paddingHorizontal: 16,
    paddingVertical: 13,
    backgroundColor: '#FFFFFF',
  },
  rowSeparator: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: '#D4D4D8',
    marginLeft: 80,
  },
  rowBody: {
    flex: 1,
    gap: 3,
  },
  name: {
    color: '#18181B',
    fontSize: 17,
    fontWeight: '800',
  },
  rowAddress: {
    color: '#71717A',
    fontSize: 13,
  },
  statusPill: {
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    minHeight: 28,
    borderRadius: 7,
    paddingHorizontal: 10,
    marginTop: 4,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  rowRight: {
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    alignSelf: 'stretch',
    minHeight: 74,
  },
  rowTime: {
    color: '#3F3F46',
    fontSize: 13,
    fontWeight: '600',
  },
  rowRightBottom: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
  },
  contactButton: {
    width: 30,
    height: 30,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 15,
    backgroundColor: '#E8F4FE',
  },
  contactButtonMessage: {
    backgroundColor: '#E9F9EE',
  },
  centerState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 30,
    paddingBottom: 60,
  },
  emptyIcon: {
    width: 64,
    height: 64,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 32,
    backgroundColor: '#E8F4FE',
  },
  emptyTitle: {
    marginTop: 14,
    color: '#18181B',
    fontSize: 18,
    fontWeight: '800',
  },
  stateMessage: {
    marginTop: 7,
    color: '#71717A',
    fontSize: 13,
    lineHeight: 19,
    textAlign: 'center',
  },
  footerLoader: {
    paddingVertical: 18,
  },
  pressed: {
    opacity: 0.62,
  },
});
