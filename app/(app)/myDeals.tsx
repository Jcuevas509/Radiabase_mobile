import Agreement01Icon from '@hugeicons/core-free-icons/Agreement01Icon';
import Search01Icon from '@hugeicons/core-free-icons/Search01Icon';
import { HugeiconsIcon } from '@hugeicons/react-native';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import { DrawerActions, useIsFocused, useNavigation } from '@react-navigation/native';
import { UserAvatar } from 'components/Avatar/UserAvatar';
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
import { fetchSampleMyDeals } from 'services/sample-deals';
import { PlainModal } from 'components/Modal/Modal';
import type { MyDeal, MyDealFilter } from 'types/my-deals.types';
import { estimateDealCommissions, formatCommission } from 'utils/estimate-deal-commission';
import { formatCalendarDate } from 'utils/format-calendar-date';
import { getUserScopeKey } from 'utils/get-user-scope-key';

// Demo data while the UI is being designed. Off in tests; flip to `false`
// to go back to live deals.
const USE_SAMPLE_DEALS = !process.env.JEST_WORKER_ID;

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

const STATUS_ICONS: Record<string, keyof typeof Ionicons.glyphMap> = {
  new: 'add',
  scheduled: 'calendar-outline',
  installed: 'construct-outline',
  funding: 'hourglass-outline',
  funded: 'cash-outline',
  paid: 'cash-outline',
  'net funded': 'cash-outline',
  canceled: 'close',
  hold: 'pause-outline',
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

function SpecChip({ label, value }: { readonly label: string; readonly value: string }) {
  return (
    <View style={styles.specChip}>
      <Text style={styles.specLabel}>{label}</Text>
      <Text style={styles.specValue}>{value}</Text>
    </View>
  );
}

function DealCard({ deal, onPress }: { readonly deal: MyDeal; readonly onPress: (deal: MyDeal) => void }) {
  const phone = sanitizePhone(deal.phone);
  const normalizedStatus = deal.status.toLowerCase();
  const statusColor = STATUS_COLORS[normalizedStatus] ?? '#52525B';
  const statusIcon = STATUS_ICONS[normalizedStatus] ?? 'ellipse-outline';
  const [firstName = '', ...lastNameParts] = deal.customerName.split(' ');
  const meta = [
    deal.officeName,
    deal.providerName,
  ].filter(Boolean).join(' · ');
  const people = [
    deal.setterName ? `Setter ${deal.setterName}` : null,
    deal.closerName ? `Closer ${deal.closerName}` : null,
  ].filter(Boolean).join(' · ');

  const commission = estimateDealCommissions(deal);
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`Open deal for ${deal.customerName}`}
      onPress={() => onPress(deal)}
      style={({ pressed }) => [styles.card, pressed && styles.cardPressed]}
    >
      <View style={styles.cardHeader}>
        <UserAvatar
          firstName={firstName}
          lastName={lastNameParts.join(' ')}
          size={44}
          color="#18181B"
          ringWidth={1.5}
        />
        <View style={styles.nameBlock}>
          <Text style={styles.name} numberOfLines={1}>{deal.customerName}</Text>
          <Text style={styles.dealNumber}>Deal #{deal.id}</Text>
        </View>
        <View style={[styles.statusPill, { backgroundColor: statusColor }]}>
          <Ionicons name={statusIcon} size={12} color="white" />
          <Text style={styles.statusText} numberOfLines={1}>{deal.status}</Text>
        </View>
      </View>

      {deal.address ? (
        <View style={styles.addressRow}>
          <Ionicons name="location-outline" size={15} color="#71717A" />
          <Text style={styles.addressText} numberOfLines={1}>{deal.address}</Text>
        </View>
      ) : null}

      <View style={styles.specRow}>
        {typeof deal.systemSizeKw === 'number' ? (
          <SpecChip label="Size" value={`${deal.systemSizeKw} kW`} />
        ) : null}
        {typeof deal.pricePerWatt === 'number' ? (
          <SpecChip label="Gross PPW" value={`$${deal.pricePerWatt.toFixed(2)}`} />
        ) : null}
        {typeof deal.netPricePerWatt === 'number' ? (
          <SpecChip label="Net PPW" value={`$${deal.netPricePerWatt.toFixed(2)}`} />
        ) : null}
        {deal.dateSold ? (
          <SpecChip label="Sold" value={formatCalendarDate(deal.dateSold)} />
        ) : null}
        {deal.installDate ? (
          <SpecChip label="Install" value={formatCalendarDate(deal.installDate)} />
        ) : null}
        {commission.net > 0 ? (
          <SpecChip label="Est. net comm." value={formatCommission(commission.net)} />
        ) : null}
        {deal.campaignName ? (
          <View style={styles.campaignChip}>
            <Ionicons name="megaphone-outline" size={11} color="#1687E8" />
            <Text style={styles.campaignText} numberOfLines={1}>{deal.campaignName}</Text>
          </View>
        ) : null}
      </View>

      {deal.notes ? (
        <Text style={styles.notesText} numberOfLines={1}>{deal.notes}</Text>
      ) : null}

      <View style={styles.cardFooter}>
        <View style={styles.metaBlock}>
          {meta ? <Text style={styles.metaText} numberOfLines={1}>{meta}</Text> : null}
          {people ? <Text style={styles.metaText} numberOfLines={1}>{people}</Text> : null}
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
              <Ionicons name="call" size={16} color="#1687E8" />
            </Pressable>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={`Message ${deal.customerName}`}
              hitSlop={6}
              onPress={() => openContactUrl(`sms:${phone}`, 'Open Messages and try again.')}
              style={({ pressed }) => [styles.contactButton, styles.contactButtonMessage, pressed && styles.pressed]}
            >
              <Ionicons name="chatbubble-ellipses" size={16} color="#34C759" />
            </Pressable>
          </View>
        ) : null}
      </View>
    </Pressable>
  );
}

function DealDetailModal({
  deal,
  visible,
  onClose,
}: {
  readonly deal: MyDeal | null;
  readonly visible: boolean;
  readonly onClose: () => void;
}) {
  if (!deal) {
    return null;
  }
  const commission = estimateDealCommissions(deal);
  const normalizedStatus = deal.status.toLowerCase();
  const statusColor = STATUS_COLORS[normalizedStatus] ?? '#52525B';
  const phone = sanitizePhone(deal.phone);
  const detailRows: Array<{ label: string; value: string }> = [
    { label: 'Status', value: deal.status },
    {
      label: 'Deposit date',
      value: deal.isAccountPaid && deal.depositDate ? formatCalendarDate(deal.depositDate) : 'N/A',
    },
    { label: 'System size', value: typeof deal.systemSizeKw === 'number' ? `${deal.systemSizeKw} kW` : '—' },
    { label: 'Gross PPW', value: typeof deal.pricePerWatt === 'number' ? `$${deal.pricePerWatt.toFixed(2)}` : '—' },
    { label: 'Net PPW', value: typeof deal.netPricePerWatt === 'number' ? `$${deal.netPricePerWatt.toFixed(2)}` : '—' },
    { label: 'Sold', value: deal.dateSold ? formatCalendarDate(deal.dateSold) : '—' },
    { label: 'Install', value: deal.installDate ? formatCalendarDate(deal.installDate) : '—' },
    { label: 'Office', value: deal.officeName ?? '—' },
    { label: 'Installer', value: deal.providerName ?? '—' },
    { label: 'Setter', value: deal.setterName ?? '—' },
    { label: 'Closer', value: deal.closerName ?? '—' },
    ...(deal.campaignName ? [{ label: 'Campaign', value: deal.campaignName }] : []),
  ];
  return (
    <PlainModal
      visible={visible}
      onClose={onClose}
      title={deal.customerName}
      hasCloseButton
    >
      <View>
        <View style={styles.commissionRow}>
          <View style={styles.commissionBlock}>
            <Text style={styles.commissionLabel}>Gross commission</Text>
            <Text style={styles.commissionValue}>{formatCommission(commission.gross)}</Text>
          </View>
          <View style={styles.commissionBlock}>
            <Text style={styles.commissionLabel}>Net commission</Text>
            <Text style={styles.commissionValue}>{formatCommission(commission.net)}</Text>
          </View>
        </View>
        <Text style={styles.commissionNote}>Estimates only — final commission may vary.</Text>
        {detailRows.map((row, index) => (
          <View key={row.label} style={[styles.modalRow, index > 0 && styles.modalRowDivider]}>
            <Text style={styles.modalRowLabel}>{row.label}</Text>
            {row.label === 'Status' ? (
              <View style={[styles.modalStatusPill, { backgroundColor: statusColor }]}>
                <Text style={styles.modalStatusText}>{deal.status}</Text>
              </View>
            ) : (
              <Text style={styles.modalRowValue} numberOfLines={1}>{row.value}</Text>
            )}
          </View>
        ))}
        {phone ? (
          <View style={styles.modalActions}>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={`Call ${deal.customerName}`}
              onPress={() => openContactUrl(`tel:${phone}`, 'Open the Phone app and try again.')}
              style={({ pressed }) => [styles.modalActionButton, pressed && styles.pressed]}
            >
              <Ionicons name="call" size={16} color="#1687E8" />
              <Text style={styles.modalActionText}>Call</Text>
            </Pressable>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={`Message ${deal.customerName}`}
              onPress={() => openContactUrl(`sms:${phone}`, 'Open Messages and try again.')}
              style={({ pressed }) => [styles.modalActionButton, styles.modalActionMessage, pressed && styles.pressed]}
            >
              <Ionicons name="chatbubble-ellipses" size={16} color="#34C759" />
              <Text style={[styles.modalActionText, styles.modalActionTextMessage]}>Message</Text>
            </Pressable>
          </View>
        ) : null}
      </View>
    </PlainModal>
  );
}

export default function MyDealsScreen() {
  const navigation = useNavigation();
  const { session } = useSession();
  const isFocused = useIsFocused();
  const salesRepId = Number(session?.user?.id ?? 0);
  const authenticatedScopeKey = session?.token ? getUserScopeKey(session.user) : null;
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [activeFilter, setActiveFilter] = useState<MyDealFilter>('all');
  const [controlsScopeKey, setControlsScopeKey] = useState(authenticatedScopeKey);
  const [isPullRefreshing, setIsPullRefreshing] = useState(false);
  const [selectedDeal, setSelectedDeal] = useState<MyDeal | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
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
    // Focus is intentionally not part of isEnabled: disabling on blur wipes
    // the loaded deals, so every tab visit restarted from the spinner.
    isEnabled: Boolean(authenticatedScopeKey),
    loadPage: USE_SAMPLE_DEALS ? fetchSampleMyDeals : undefined,
  });

  useEffect(() => {
    if (!isLoading) {
      setIsPullRefreshing(false);
    }
  }, [isLoading]);

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
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Open menu"
          hitSlop={12}
          onPress={() => navigation.dispatch(DrawerActions.openDrawer())}
          style={styles.headerSide}
        >
          <MaterialIcons name="menu" size={28} color="#18181B" />
        </Pressable>
        <Text style={styles.headerTitle}>My Deals</Text>
        <View style={[styles.headerSide, styles.headerRight]}>
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
              style={[styles.filterChip, selected && styles.filterChipSelected]}
            >
              <Text style={[styles.filterText, selected && styles.filterTextSelected]}>
                {filter.label}
              </Text>
            </Pressable>
          );
        })}
      </View>
      <Text style={styles.summaryText}>{summary}</Text>

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

      <DealDetailModal
        deal={selectedDeal}
        visible={isDetailOpen}
        onClose={() => setIsDetailOpen(false)}
      />
      <FlatList
        automaticallyAdjustContentInsets={false}
        contentInsetAdjustmentBehavior="never"
        contentContainerStyle={[styles.listContent, deals.length === 0 && styles.emptyListContent]}
        data={deals}
        keyExtractor={(deal) => String(deal.id)}
        keyboardDismissMode="on-drag"
        keyboardShouldPersistTaps="handled"
        onEndReached={loadMore}
        onEndReachedThreshold={0.35}
        refreshControl={(
          <RefreshControl
            refreshing={isPullRefreshing}
            onRefresh={() => {
              setIsPullRefreshing(true);
              reload();
            }}
            tintColor="#1687E8"
          />
        )}
        renderItem={({ item }) => (
          <DealCard
            deal={item}
            onPress={(deal) => {
              setSelectedDeal(deal);
              setIsDetailOpen(true);
            }}
          />
        )}
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
    fontSize: 12,
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
    marginHorizontal: 20,
    marginTop: 8,
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
  listContent: {
    gap: 10,
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 24,
  },
  emptyListContent: {
    flexGrow: 1,
  },
  card: {
    borderRadius: 16,
    backgroundColor: '#FFFFFF',
    padding: 14,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  nameBlock: {
    flex: 1,
  },
  name: {
    color: '#18181B',
    fontSize: 16,
    fontWeight: '800',
  },
  dealNumber: {
    marginTop: 1,
    color: '#A1A1AA',
    fontSize: 11,
    fontWeight: '600',
  },
  statusPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    minHeight: 26,
    maxWidth: '40%',
    borderRadius: 7,
    paddingHorizontal: 9,
  },
  statusText: {
    flexShrink: 1,
    fontSize: 11,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  addressRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    marginTop: 10,
  },
  addressText: {
    flex: 1,
    color: '#71717A',
    fontSize: 13,
  },
  specRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginTop: 10,
  },
  specChip: {
    borderRadius: 9,
    backgroundColor: '#F4F4F5',
    paddingHorizontal: 9,
    paddingVertical: 5,
  },
  specLabel: {
    color: '#71717A',
    fontSize: 9,
    fontWeight: '800',
    textTransform: 'uppercase',
  },
  specValue: {
    marginTop: 1,
    color: '#3F3F46',
    fontSize: 12,
    fontWeight: '700',
  },
  campaignChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    borderRadius: 9,
    backgroundColor: '#EFF6FF',
    paddingHorizontal: 9,
    paddingVertical: 5,
    maxWidth: 180,
  },
  campaignText: {
    color: '#1687E8',
    fontSize: 12,
    fontWeight: '700',
  },
  notesText: {
    marginTop: 8,
    color: '#52525B',
    fontSize: 12,
    fontStyle: 'italic',
  },
  cardFooter: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    gap: 8,
    marginTop: 10,
  },
  metaBlock: {
    flex: 1,
    gap: 2,
  },
  metaText: {
    color: '#71717A',
    fontSize: 11,
  },
  contactActions: {
    flexDirection: 'row',
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
  cardPressed: {
    opacity: 0.85,
  },
  commissionRow: {
    flexDirection: 'row',
    gap: 8,
  },
  commissionBlock: {
    flex: 1,
    borderRadius: 14,
    backgroundColor: '#F4F4F5',
    alignItems: 'center',
    paddingVertical: 14,
  },
  commissionLabel: {
    color: '#71717A',
    fontSize: 10,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 0.3,
  },
  commissionValue: {
    marginTop: 4,
    color: '#18181B',
    fontSize: 22,
    fontWeight: '900',
  },
  commissionNote: {
    marginTop: 6,
    marginBottom: 10,
    textAlign: 'center',
    color: '#A1A1AA',
    fontSize: 10,
    fontWeight: '600',
  },
  modalRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    minHeight: 40,
    gap: 12,
  },
  modalRowDivider: {
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: '#E4E4E7',
  },
  modalRowLabel: {
    color: '#71717A',
    fontSize: 13,
  },
  modalRowValue: {
    flexShrink: 1,
    color: '#18181B',
    fontSize: 13,
    fontWeight: '600',
  },
  modalStatusPill: {
    borderRadius: 7,
    paddingHorizontal: 9,
    paddingVertical: 4,
  },
  modalStatusText: {
    color: 'white',
    fontSize: 11,
    fontWeight: '800',
  },
  modalActions: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 14,
  },
  modalActionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    minHeight: 42,
    borderRadius: 12,
    backgroundColor: '#E8F4FE',
  },
  modalActionMessage: {
    backgroundColor: '#E9F9EE',
  },
  modalActionText: {
    color: '#1687E8',
    fontSize: 14,
    fontWeight: '700',
  },
  modalActionTextMessage: {
    color: '#34C759',
  },
});
