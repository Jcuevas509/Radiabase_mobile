import Agreement01Icon from '@hugeicons/core-free-icons/Agreement01Icon';
import Calendar03Icon from '@hugeicons/core-free-icons/Calendar03Icon';
import Call02Icon from '@hugeicons/core-free-icons/Call02Icon';
import CheckmarkBadge01Icon from '@hugeicons/core-free-icons/CheckmarkBadge01Icon';
import Location01Icon from '@hugeicons/core-free-icons/Location01Icon';
import Message01Icon from '@hugeicons/core-free-icons/Message01Icon';
import Search01Icon from '@hugeicons/core-free-icons/Search01Icon';
import { HugeiconsIcon } from '@hugeicons/react-native';
import { useIsFocused } from '@react-navigation/native';
import { useSession } from 'context/AuthenticationContext';
import { useMyDeals } from 'hooks/useMyDeals';
import { useEffect, useState } from 'react';
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
import type { MyDeal, MyDealFilter } from 'types/my-deals.types';
import { formatCalendarDate } from 'utils/format-calendar-date';
import { getUserScopeKey } from 'utils/get-user-scope-key';

const FILTERS: ReadonlyArray<{ value: MyDealFilter; label: string }> = [
  { value: 'all', label: 'All' },
  { value: 'in_progress', label: 'In Progress' },
  { value: 'completed', label: 'Completed' },
  { value: 'canceled', label: 'Canceled' },
];

const STATUS_COLORS: Record<string, string> = {
  new: '#1687E8',
  scheduled: '#7C3AED',
  installed: '#0F766E',
  funding: '#A16207',
  funded: '#15803D',
  paid: '#15803D',
  'net funded': '#15803D',
  canceled: '#B91C1C',
  hold: '#D97706',
};

function sanitizePhone(value: string | null): string {
  if (!value) {
    return '';
  }
  const digits = value.replace(/\D/g, '');
  return digits.length >= 7 && digits.length <= 15 ? digits : '';
}

function openContactUrl(url: string, failureMessage: string): void {
  Linking.openURL(url).catch(() => {
    Alert.alert('Could not open contact action', failureMessage);
  });
}

function DealCard({ deal }: { readonly deal: MyDeal }) {
  const phone = sanitizePhone(deal.phone);
  const normalizedStatus = deal.status.toLowerCase();
  const statusColor = STATUS_COLORS[normalizedStatus] ?? '#52525B';

  return (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <View style={styles.nameBlock}>
          <Text style={styles.name} numberOfLines={1}>{deal.customerName}</Text>
          <Text style={styles.dealNumber}>Deal #{deal.id}</Text>
        </View>
        <View style={[styles.statusPill, { backgroundColor: `${statusColor}18` }]}>
          <View style={[styles.statusDot, { backgroundColor: statusColor }]} />
          <Text style={[styles.statusText, { color: statusColor }]} numberOfLines={1}>
            {deal.status}
          </Text>
        </View>
      </View>

      {deal.address ? (
        <View style={styles.detailRow}>
          <HugeiconsIcon icon={Location01Icon} size={17} color="#71717A" strokeWidth={1.8} />
          <Text style={styles.detailText} numberOfLines={2}>{deal.address}</Text>
        </View>
      ) : null}

      <View style={styles.timelineRow}>
        {deal.dateSold ? (
          <View style={styles.timelineItem}>
            <Text style={styles.timelineLabel}>Sold</Text>
            <Text style={styles.timelineValue}>{formatCalendarDate(deal.dateSold)}</Text>
          </View>
        ) : null}
        {deal.installDate ? (
          <View style={styles.timelineItem}>
            <Text style={styles.timelineLabel}>Install</Text>
            <Text style={styles.timelineValue}>{formatCalendarDate(deal.installDate)}</Text>
          </View>
        ) : null}
        {deal.isAccountPaid ? (
          <View style={styles.paidBadge}>
            <HugeiconsIcon icon={CheckmarkBadge01Icon} size={16} color="#15803D" strokeWidth={2} />
            <Text style={styles.paidText}>Paid</Text>
          </View>
        ) : null}
      </View>

      <View style={styles.cardFooter}>
        <View style={styles.metaBlock}>
          {deal.officeName ? <Text style={styles.metaText}>{deal.officeName}</Text> : null}
          {deal.providerName ? <Text style={styles.metaText}>{deal.providerName}</Text> : null}
          {deal.closerName ? <Text style={styles.metaText}>Closer: {deal.closerName}</Text> : null}
        </View>
        {phone ? (
          <View style={styles.contactActions}>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={`Call ${deal.customerName}`}
              hitSlop={6}
              onPress={() => openContactUrl(`tel:${phone}`, 'Open the Phone app and try again.')}
              style={({ pressed }) => [styles.contactButton, pressed && styles.pressed]}
            >
              <HugeiconsIcon icon={Call02Icon} size={19} color="#1687E8" strokeWidth={2} />
            </Pressable>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={`Message ${deal.customerName}`}
              hitSlop={6}
              onPress={() => openContactUrl(`sms:${phone}`, 'Open Messages and try again.')}
              style={({ pressed }) => [styles.contactButton, pressed && styles.pressed]}
            >
              <HugeiconsIcon icon={Message01Icon} size={19} color="#1687E8" strokeWidth={2} />
            </Pressable>
          </View>
        ) : null}
      </View>
    </View>
  );
}

export default function MyDealsScreen() {
  const { session } = useSession();
  const isFocused = useIsFocused();
  const salesRepId = Number(session?.user?.id ?? 0);
  const authenticatedScopeKey = session?.token ? getUserScopeKey(session.user) : null;
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [activeFilter, setActiveFilter] = useState<MyDealFilter>('all');
  const [controlsScopeKey, setControlsScopeKey] = useState(authenticatedScopeKey);
  const controlsAreCurrent = controlsScopeKey === authenticatedScopeKey;
  const effectiveSearch = controlsAreCurrent ? debouncedSearch : '';
  const effectiveFilter = controlsAreCurrent ? activeFilter : 'all';
  const renderedSearch = controlsAreCurrent ? search : '';

  useEffect(() => {
    const timeout = setTimeout(() => setDebouncedSearch(search.trim()), 350);
    return () => clearTimeout(timeout);
  }, [search]);

  useEffect(() => {
    setSearch('');
    setDebouncedSearch('');
    setActiveFilter('all');
    setControlsScopeKey(authenticatedScopeKey);
  }, [authenticatedScopeKey]);

  const {
    deals,
    totalCount,
    isLoading,
    isLoadingMore,
    errorMessage,
    loadMore,
    reload,
  } = useMyDeals({
    scopeKey: authenticatedScopeKey,
    salesRepId,
    search: effectiveSearch,
    filter: effectiveFilter,
    isEnabled: isFocused && Boolean(authenticatedScopeKey),
  });

  const filterLabel = FILTERS.find((filter) => filter.value === effectiveFilter)?.label ?? 'Deals';
  const summary = effectiveFilter === 'all'
    ? `${totalCount} total deals`
    : `${totalCount} ${filterLabel.toLowerCase()}`;
  const emptyMessage = effectiveSearch
    ? `No deals match “${effectiveSearch}”.`
    : effectiveFilter === 'all'
      ? 'Converted sales assigned to you will appear here.'
      : `No ${filterLabel.toLowerCase()} deals were found.`;

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <View style={styles.header}>
        <View>
          <Text style={styles.headerTitle}>My Deals</Text>
          <Text style={styles.headerSubtitle}>{summary}</Text>
        </View>
        <View style={styles.headerIcon}>
          <HugeiconsIcon icon={Agreement01Icon} size={25} color="#1687E8" strokeWidth={1.8} />
        </View>
      </View>

      <View style={styles.searchContainer}>
        <HugeiconsIcon icon={Search01Icon} size={19} color="#71717A" strokeWidth={1.8} />
        <TextInput
          accessibilityLabel="Search my deals"
          autoCapitalize="none"
          autoCorrect={false}
          clearButtonMode="while-editing"
          onChangeText={setSearch}
          placeholder="Search customer, phone, email, or address"
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
              style={({ pressed }) => [
                styles.filterChip,
                selected && styles.filterChipSelected,
                pressed && styles.pressed,
              ]}
            >
              <Text style={[styles.filterText, selected && styles.filterTextSelected]}>
                {filter.label}
              </Text>
            </Pressable>
          );
        })}
      </View>

      {errorMessage ? (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Retry loading my deals"
          onPress={reload}
          style={({ pressed }) => [styles.errorBanner, pressed && styles.pressed]}
        >
          <Text style={styles.errorTitle}>Could not load deals</Text>
          <Text style={styles.errorText}>{errorMessage} Tap to retry.</Text>
        </Pressable>
      ) : null}

      <FlatList
        contentContainerStyle={[styles.listContent, deals.length === 0 && styles.emptyListContent]}
        data={deals}
        keyExtractor={(deal) => String(deal.id)}
        keyboardDismissMode="on-drag"
        keyboardShouldPersistTaps="handled"
        onEndReached={loadMore}
        onEndReachedThreshold={0.35}
        refreshControl={(
          <RefreshControl
            refreshing={isLoading && deals.length > 0}
            onRefresh={reload}
            tintColor="#1687E8"
          />
        )}
        renderItem={({ item }) => <DealCard deal={item} />}
        ListEmptyComponent={isLoading ? (
          <View style={styles.centerState}>
            <ActivityIndicator size="large" color="#1687E8" />
            <Text style={styles.stateMessage}>Loading your deals…</Text>
          </View>
        ) : (
          <View style={styles.centerState}>
            <View style={styles.emptyIcon}>
              <HugeiconsIcon icon={Agreement01Icon} size={31} color="#1687E8" strokeWidth={1.8} />
            </View>
            <Text style={styles.emptyTitle}>No deals here</Text>
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
  safeArea: { flex: 1, backgroundColor: '#F5F7FA' },
  header: {
    minHeight: 68,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#E4E4E7',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 18,
    paddingVertical: 10,
  },
  headerTitle: { color: '#18181B', fontSize: 22, fontWeight: '800' },
  headerSubtitle: { marginTop: 2, color: '#71717A', fontSize: 12 },
  headerIcon: {
    width: 42,
    height: 42,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 21,
    backgroundColor: '#E8F4FE',
  },
  searchContainer: {
    minHeight: 46,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 9,
    marginHorizontal: 14,
    marginTop: 12,
    borderWidth: 1,
    borderColor: '#E4E4E7',
    borderRadius: 13,
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 12,
  },
  searchInput: { minHeight: 44, flex: 1, color: '#18181B', fontSize: 14 },
  filters: { flexDirection: 'row', gap: 6, paddingHorizontal: 14, paddingVertical: 10 },
  filterChip: {
    minHeight: 34,
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#D4D4D8',
    borderRadius: 17,
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 6,
  },
  filterChipSelected: { borderColor: '#18181B', backgroundColor: '#18181B' },
  filterText: { color: '#52525B', fontSize: 10, fontWeight: '700', textAlign: 'center' },
  filterTextSelected: { color: '#FFFFFF' },
  errorBanner: {
    marginHorizontal: 14,
    marginBottom: 8,
    borderRadius: 12,
    backgroundColor: '#FEF2F2',
    paddingHorizontal: 13,
    paddingVertical: 10,
  },
  errorTitle: { color: '#991B1B', fontSize: 13, fontWeight: '800' },
  errorText: { marginTop: 2, color: '#B91C1C', fontSize: 12, lineHeight: 17 },
  listContent: { gap: 10, paddingHorizontal: 14, paddingBottom: 24 },
  emptyListContent: { flexGrow: 1 },
  card: {
    borderWidth: 1,
    borderColor: '#E4E4E7',
    borderRadius: 16,
    backgroundColor: '#FFFFFF',
    padding: 14,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 5,
    elevation: 2,
  },
  cardHeader: { flexDirection: 'row', alignItems: 'flex-start', gap: 10 },
  nameBlock: { flex: 1 },
  name: { color: '#18181B', fontSize: 16, fontWeight: '800' },
  dealNumber: { marginTop: 2, color: '#A1A1AA', fontSize: 11, fontWeight: '600' },
  statusPill: {
    minHeight: 27,
    maxWidth: '48%',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    borderRadius: 14,
    paddingHorizontal: 9,
  },
  statusDot: { width: 7, height: 7, borderRadius: 4 },
  statusText: { flexShrink: 1, fontSize: 10, fontWeight: '800' },
  detailRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 8, marginTop: 12 },
  detailText: { flex: 1, color: '#52525B', fontSize: 13, lineHeight: 18 },
  timelineRow: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: 8, marginTop: 12 },
  timelineItem: { borderRadius: 9, backgroundColor: '#F4F4F5', paddingHorizontal: 9, paddingVertical: 6 },
  timelineLabel: { color: '#71717A', fontSize: 9, fontWeight: '800', textTransform: 'uppercase' },
  timelineValue: { marginTop: 2, color: '#3F3F46', fontSize: 11, fontWeight: '700' },
  paidBadge: { flexDirection: 'row', alignItems: 'center', gap: 4, borderRadius: 9, backgroundColor: '#F0FDF4', padding: 7 },
  paidText: { color: '#15803D', fontSize: 11, fontWeight: '800' },
  cardFooter: { minHeight: 40, flexDirection: 'row', alignItems: 'flex-end', gap: 8, marginTop: 10 },
  metaBlock: { flex: 1, flexDirection: 'row', flexWrap: 'wrap', gap: 5 },
  metaText: { color: '#71717A', fontSize: 11 },
  contactActions: { flexDirection: 'row', gap: 8 },
  contactButton: { width: 38, height: 38, alignItems: 'center', justifyContent: 'center', borderRadius: 19, backgroundColor: '#E8F4FE' },
  centerState: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 30, paddingBottom: 60 },
  emptyIcon: { width: 64, height: 64, alignItems: 'center', justifyContent: 'center', borderRadius: 32, backgroundColor: '#E8F4FE' },
  emptyTitle: { marginTop: 14, color: '#18181B', fontSize: 18, fontWeight: '800' },
  stateMessage: { marginTop: 7, color: '#71717A', fontSize: 13, lineHeight: 19, textAlign: 'center' },
  footerLoader: { paddingVertical: 18 },
  pressed: { opacity: 0.62 },
});
