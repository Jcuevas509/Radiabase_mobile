import AlarmClockCheckIcon from '@hugeicons/core-free-icons/AlarmClockCheckIcon';
import AlarmClockPlusIcon from '@hugeicons/core-free-icons/AlarmClockPlusIcon';
import Search01Icon from '@hugeicons/core-free-icons/Search01Icon';
import UserGroupIcon from '@hugeicons/core-free-icons/UserGroupIcon';
import { HugeiconsIcon } from '@hugeicons/react-native';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import { DrawerActions, useIsFocused, useNavigation } from '@react-navigation/native';
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
import {
  buildLeadAppointmentReminderKey,
  cancelLeadAppointmentRemindersForScope,
  listLeadAppointmentReminderKeys,
  scheduleLeadAppointmentReminder,
} from 'services/lead-appointment-reminders';
import { fetchMyLeads } from 'services/leads-api';
import { fetchSampleMyLeads } from 'services/sample-leads';
import type { MyLead, MyLeadFilter } from 'types/my-leads.types';

// Demo data while the UI is being designed. Off in tests (they exercise the
// real fetch path); flip to `false` to go back to live leads.
const USE_SAMPLE_LEADS = __DEV__ && !process.env.JEST_WORKER_ID;
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

function formatDateTime(value: string): string {
  const date = new Date(value);
  if (!Number.isFinite(date.getTime())) {
    return 'Date unavailable';
  }
  return date.toLocaleString(undefined, {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
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
  isReminderPending,
  isReminderScheduled,
  onScheduleReminder,
}: {
  readonly lead: MyLead;
  readonly isReminderPending: boolean;
  readonly isReminderScheduled: boolean;
  readonly onScheduleReminder: (lead: MyLead) => void;
}) {
  const statusColor = STATUS_COLORS[lead.status] ?? '#52525B';
  const statusIcon = STATUS_ICONS[lead.status] ?? 'ellipse-outline';
  const phoneDigits = lead.phone?.replace(/[^\d+]/g, '') ?? '';
  const appointmentMs = lead.appointmentAt ? Date.parse(lead.appointmentAt) : Number.NaN;
  const canScheduleReminder = Number.isFinite(appointmentMs) && appointmentMs > Date.now() + 5_000;
  // Demo heat count until the API reports knock activity per lead.
  const heatCount = lead.id % 5;
  const [firstName = '', ...lastNameParts] = lead.fullName.split(' ');

  const openRowMenu = () => {
    Alert.alert(lead.fullName, undefined, [
      ...(phoneDigits ? [
        {
          text: 'Call',
          onPress: () => openContactUrl(`tel:${phoneDigits}`, 'Open the Phone app and try again.'),
        },
        {
          text: 'Message',
          onPress: () => openContactUrl(`sms:${phoneDigits}`, 'Open Messages and try again.'),
        },
      ] : []),
      ...(lead.appointmentAt ? [{
        text: `Appointment: ${formatDateTime(lead.appointmentAt)}`,
        onPress: () => undefined,
      }] : []),
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
        <View style={[styles.statusPill, { backgroundColor: statusColor }]}>
          <Ionicons name={statusIcon} size={13} color="white" />
          <Text style={styles.statusText}>{formatStatus(lead.status)}</Text>
          <Ionicons name="chevron-down" size={12} color="white" />
        </View>
      </View>
      <View style={styles.rowRight}>
        <View style={styles.rowRightTop}>
          <Text style={styles.rowTime}>{formatActivityTime(lead.createdAt ?? '')}</Text>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={`More actions for ${lead.fullName}`}
            hitSlop={8}
            onPress={openRowMenu}
            style={({ pressed }) => [styles.moreButton, pressed && styles.pressed]}
          >
            <Ionicons name="ellipsis-vertical" size={17} color="#18181B" />
          </Pressable>
        </View>
        <View style={styles.rowRightBottom}>
          {canScheduleReminder ? (
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={isReminderScheduled
                ? `Appointment reminder set for ${lead.fullName}`
                : `Set appointment reminder for ${lead.fullName}`}
              accessibilityState={{
                busy: isReminderPending,
                disabled: isReminderPending || isReminderScheduled,
              }}
              disabled={isReminderPending || isReminderScheduled}
              hitSlop={6}
              onPress={() => onScheduleReminder(lead)}
              style={({ pressed }) => [
                styles.reminderButton,
                isReminderScheduled && styles.reminderButtonScheduled,
                pressed && styles.pressed,
              ]}
            >
              {isReminderPending ? (
                <ActivityIndicator size="small" color="#7C3AED" />
              ) : (
                <HugeiconsIcon
                  icon={isReminderScheduled ? AlarmClockCheckIcon : AlarmClockPlusIcon}
                  size={17}
                  color={isReminderScheduled ? '#15803D' : '#7C3AED'}
                  strokeWidth={2}
                />
              )}
            </Pressable>
          ) : null}
          <View style={styles.heatChip}>
            <Text style={styles.heatCount}>{heatCount}</Text>
            <Text style={styles.heatFlame}>🔥</Text>
          </View>
        </View>
      </View>
    </View>
  );
}

export default function MyLeadsScreen() {
  const navigation = useNavigation();
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
  const [scheduledReminderKeys, setScheduledReminderKeys] = useState<Set<string>>(new Set());
  const [pendingReminderLeadId, setPendingReminderLeadId] = useState<number | null>(null);
  const [reloadKey, setReloadKey] = useState(0);
  const generationRef = useRef(0);
  const loadMoreControllerRef = useRef<AbortController | null>(null);
  const pendingReminderLeadIdRef = useRef<number | null>(null);
  const reminderRequestIdRef = useRef(0);
  const isMountedRef = useRef(true);
  const currentScopeKeyRef = useRef(authenticatedScopeKey);
  currentScopeKeyRef.current = authenticatedScopeKey;
  const loadedQueryKeyRef = useRef<string | null>(null);
  const effectiveSearch = controlsScopeKey === authenticatedScopeKey ? debouncedSearch : '';
  const effectiveFilter = controlsScopeKey === authenticatedScopeKey ? activeFilter : 'all';
  const renderedSearch = controlsScopeKey === authenticatedScopeKey ? search : '';
  const currentQueryKey = authenticatedScopeKey
    ? JSON.stringify([authenticatedScopeKey, effectiveSearch, effectiveFilter])
    : null;

  useEffect(() => {
    return () => {
      isMountedRef.current = false;
      reminderRequestIdRef.current += 1;
      pendingReminderLeadIdRef.current = null;
    };
  }, []);

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
    setScheduledReminderKeys(new Set());
    setPendingReminderLeadId(null);
    pendingReminderLeadIdRef.current = null;
    reminderRequestIdRef.current += 1;
  }, [authenticatedScopeKey]);

  useEffect(() => {
    if (!authenticatedScopeKey || !isFocused) {
      return;
    }
    let cancelled = false;
    listLeadAppointmentReminderKeys(authenticatedScopeKey).then((keys) => {
      if (!cancelled) {
        setScheduledReminderKeys(keys);
      }
    }).catch(() => undefined);
    return () => {
      cancelled = true;
    };
  }, [authenticatedScopeKey, isFocused]);

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

  const handleScheduleReminder = useCallback(async (lead: MyLead) => {
    if (!authenticatedScopeKey || !lead.appointmentAt || pendingReminderLeadIdRef.current !== null) {
      return;
    }
    pendingReminderLeadIdRef.current = lead.id;
    setPendingReminderLeadId(lead.id);
    const requestId = reminderRequestIdRef.current + 1;
    reminderRequestIdRef.current = requestId;
    const requestScopeKey = authenticatedScopeKey;
    try {
      const result = await scheduleLeadAppointmentReminder({
        scopeKey: requestScopeKey,
        leadId: lead.id,
        appointmentAt: lead.appointmentAt,
      });
      if (currentScopeKeyRef.current !== requestScopeKey) {
        await cancelLeadAppointmentRemindersForScope(requestScopeKey).catch(() => undefined);
        return;
      }
      if (!isMountedRef.current) {
        return;
      }
      if (result.status === 'permission_denied') {
        Alert.alert(
          'Notifications are off',
          'Allow notifications for Radiabase in iPhone Settings to set appointment reminders.',
        );
        return;
      }
      if (result.status === 'appointment_unavailable') {
        Alert.alert('Reminder unavailable', 'This appointment has already started or passed.');
        return;
      }
      if (result.status === 'scheduled' || result.status === 'already_scheduled') {
        setScheduledReminderKeys((current) => new Set(current).add(result.reminderKey));
        Alert.alert(
          result.status === 'already_scheduled' ? 'Reminder already set' : 'Reminder set',
          'Radiabase will remind you 30 minutes before the appointment, or at the appointment time if it is sooner.',
        );
      }
    } catch {
      if (isMountedRef.current && currentScopeKeyRef.current === requestScopeKey) {
        Alert.alert('Could not set reminder', 'Please try again from My Leads.');
      }
    } finally {
      if (isMountedRef.current && reminderRequestIdRef.current === requestId) {
        pendingReminderLeadIdRef.current = null;
        setPendingReminderLeadId(null);
      }
    }
  }, [authenticatedScopeKey]);

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <View style={styles.header}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Open menu"
          hitSlop={12}
          onPress={() => navigation.dispatch(DrawerActions.openDrawer())}
          style={styles.headerSide}
        >
          <MaterialIcons name="menu" size={28} color="#18181B" />
        </Pressable>
        <Text style={styles.headerTitle}>My Leads</Text>
        <View style={[styles.headerSide, styles.headerRight]}>
          <Ionicons name="notifications-outline" size={24} color="#18181B" />
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
            refreshing={isLoading && scopedLeads.length > 0}
            onRefresh={() => setReloadKey((current) => current + 1)}
            tintColor="#1687E8"
          />
        )}
        renderItem={({ item }) => {
          const reminderKey = authenticatedScopeKey && item.appointmentAt
            ? buildLeadAppointmentReminderKey({
              scopeKey: authenticatedScopeKey,
              leadId: item.id,
              appointmentAt: item.appointmentAt,
            })
            : null;
          return (
            <LeadCard
              lead={item}
              isReminderPending={pendingReminderLeadId === item.id}
              isReminderScheduled={Boolean(reminderKey && scheduledReminderKeys.has(reminderKey))}
              onScheduleReminder={handleScheduleReminder}
            />
          );
        }}
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
  rowRightTop: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  rowTime: {
    color: '#3F3F46',
    fontSize: 13,
    fontWeight: '600',
  },
  moreButton: {
    width: 26,
    height: 26,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rowRightBottom: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  heatChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: '#FEF3C7',
    borderRadius: 7,
    paddingHorizontal: 7,
    paddingVertical: 3,
  },
  heatCount: {
    color: '#D97706',
    fontSize: 14,
    fontWeight: '800',
  },
  heatFlame: {
    fontSize: 12,
  },
  reminderButton: {
    width: 30,
    height: 30,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 15,
    backgroundColor: '#EDE9FE',
  },
  reminderButtonScheduled: {
    backgroundColor: '#DCFCE7',
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
