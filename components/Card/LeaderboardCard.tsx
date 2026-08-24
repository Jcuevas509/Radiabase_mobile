import { Ionicons } from '@expo/vector-icons';
import { Image, Pressable, StyleSheet, Text, View } from 'react-native';
import { UserAvatar } from 'components/Avatar/UserAvatar';

export type LeaderboardEntry = {
  readonly id: number;
  readonly firstName: string;
  readonly lastName: string;
  readonly avatarUrl?: string | null;
  readonly officeName?: string | null;
  readonly value: number;
  readonly isCurrentUser?: boolean;
};

type LeaderboardCardProps = {
  /** Render without its own surface (hosted on a glass card). */
  readonly transparent?: boolean;
  readonly entries: LeaderboardEntry[];
  readonly metricLabel: string;
  /** Overall rank of the first entry minus one (paging offset). */
  readonly rankOffset?: number;
  readonly page?: number;
  readonly pageCount?: number;
  readonly totalCount?: number;
  readonly onPageChange?: (page: number) => void;
  /** Shows a small tag marking the data as sample until the API exists. */
  readonly isSampleData?: boolean;
  /**
   * Pads short pages with invisible placeholder rows up to this count so the
   * card keeps one height across pages (the host's animated border and the
   * pager don't jump).
   */
  readonly fillToCount?: number;
};

const MEDAL_IMAGES: Record<number, ReturnType<typeof require>> = {
  1: require('../../assets/images/medals/gold.jpg'),
  2: require('../../assets/images/medals/silver.jpg'),
  3: require('../../assets/images/medals/bronze.jpg'),
};

function Medal({ rank }: { readonly rank: number }) {
  const image = MEDAL_IMAGES[rank];
  if (!image) {
    return (
      <View style={styles.rankBubble}>
        <Text style={styles.rankText}>{rank}</Text>
      </View>
    );
  }
  return <Image source={image} style={styles.medalImage} resizeMode="contain" />;
}

/**
 * Ranked rep list. Purely presentational: hand it entries from the future
 * leaderboard API (sorted descending by value) and it renders them; until
 * then the caller passes sample rows and the Sample tag stays visible.
 */
export function LeaderboardCard({
  entries,
  metricLabel,
  rankOffset = 0,
  page = 1,
  pageCount = 1,
  totalCount,
  onPageChange,
  isSampleData = false,
  transparent = false,
  fillToCount,
}: LeaderboardCardProps) {
  if (entries.length === 0) {
    return null;
  }
  const showPager = pageCount > 1 && onPageChange;
  const placeholderCount = Math.max(0, (fillToCount ?? 0) - entries.length);
  return (
    <View style={[styles.card, transparent && styles.cardTransparent]}>
      {isSampleData ? (
        <View style={styles.sampleTag}>
          <Text style={styles.sampleTagText}>Sample</Text>
        </View>
      ) : null}
      {entries.map((entry, index) => {
        const rank = rankOffset + index + 1;
        return (
          <View key={entry.id} style={[styles.row, index > 0 && styles.rowDivider]}>
            <Medal rank={rank} />
            <UserAvatar
              firstName={entry.firstName}
              lastName={entry.lastName}
              imageUrl={entry.avatarUrl}
              size={34}
              color="#18181B"
              ringWidth={1}
            />
            <View style={styles.nameBlock}>
              <Text style={styles.name} numberOfLines={1}>
                {`${entry.firstName} ${entry.lastName}`.trim()}
                {entry.isCurrentUser ? ' (you)' : ''}
              </Text>
              {entry.officeName ? (
                <Text style={styles.office} numberOfLines={1}>{entry.officeName}</Text>
              ) : null}
            </View>
            <View style={styles.valueBlock}>
              <Text style={styles.value}>{entry.value.toLocaleString()}</Text>
              <Text style={styles.valueLabel}>{metricLabel}</Text>
            </View>
          </View>
        );
      })}
      {Array.from({ length: placeholderCount }, (_, index) => (
        <View
          key={`placeholder-${index}`}
          style={[styles.row, styles.placeholderRow, styles.rowDivider]}
          accessibilityElementsHidden
          importantForAccessibility="no-hide-descendants"
        >
          <View style={styles.rankBubble} />
          <View style={styles.placeholderAvatar} />
          <View style={styles.nameBlock}>
            <Text style={styles.name}> </Text>
            <Text style={styles.office}> </Text>
          </View>
          <View style={styles.valueBlock}>
            <Text style={styles.value}> </Text>
            <Text style={styles.valueLabel}> </Text>
          </View>
        </View>
      ))}
      {showPager ? (
        <View style={styles.pager}>
          <Text style={styles.pagerCount}>
            {entries.length}/{totalCount ?? entries.length}
          </Text>
          <View style={styles.pagerControls}>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Previous leaderboard page"
              accessibilityState={{ disabled: page <= 1 }}
              disabled={page <= 1}
              hitSlop={8}
              onPress={() => onPageChange(page - 1)}
              style={({ pressed }) => [
                styles.pagerButton,
                page <= 1 && styles.pagerButtonDisabled,
                pressed && styles.pagerPressed,
              ]}
            >
              <Ionicons name="chevron-back" size={17} color={page <= 1 ? '#C4C4CC' : '#18181B'} />
            </Pressable>
            <Text style={styles.pagerText}>{page} / {pageCount}</Text>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Next leaderboard page"
              accessibilityState={{ disabled: page >= pageCount }}
              disabled={page >= pageCount}
              hitSlop={8}
              onPress={() => onPageChange(page + 1)}
              style={({ pressed }) => [
                styles.pagerButton,
                page >= pageCount && styles.pagerButtonDisabled,
                pressed && styles.pagerPressed,
              ]}
            >
              <Ionicons name="chevron-forward" size={17} color={page >= pageCount ? '#C4C4CC' : '#18181B'} />
            </Pressable>
          </View>
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(24, 24, 27, 0.07)',
    boxShadow: '0 1px 2px rgba(24, 24, 27, 0.05), 0 10px 26px rgba(24, 24, 27, 0.07), inset 0 1px 0 rgba(255, 255, 255, 0.95)',
    paddingVertical: 6,
    paddingHorizontal: 10,
  },
  cardTransparent: {
    backgroundColor: 'transparent',
    borderWidth: 0,
  },
  sampleTag: {
    position: 'absolute',
    top: 8,
    right: 10,
    backgroundColor: '#F4F4F5',
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 2,
    zIndex: 1,
  },
  sampleTagText: {
    fontSize: 10,
    fontFamily: 'ClashGrotesk-Bold',
    color: '#A1A1AA',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 8,
    paddingHorizontal: 6,
  },
  placeholderRow: {
    opacity: 0,
  },
  placeholderAvatar: {
    width: 34,
    height: 34,
  },
  rowDivider: {
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: '#E4E4E7',
  },
  rankBubble: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: '#F4F4F5',
    alignItems: 'center',
    justifyContent: 'center',
  },
  rankText: {
    fontSize: 12,
    fontFamily: 'ClashGrotesk-Bold',
    color: '#71717A',
  },
  medalImage: {
    width: 30,
    height: 40,
  },
  nameBlock: {
    flex: 1,
    gap: 1,
  },
  name: {
    fontSize: 14,
    fontFamily: 'ClashGrotesk-Semibold',
    color: '#18181B',
  },
  office: {
    fontSize: 11,
    color: '#A1A1AA',
    fontFamily: 'ClashGrotesk-Semibold',
  },
  valueBlock: {
    alignItems: 'flex-end',
  },
  value: {
    fontSize: 15,
    fontFamily: 'ClashGrotesk-Bold',
    color: '#18181B',
  },
  valueLabel: {
    fontSize: 10,
    fontFamily: 'ClashGrotesk-Semibold',
    color: '#A1A1AA',
  },
  pager: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: '#E4E4E7',
    paddingVertical: 8,
    paddingHorizontal: 6,
    marginTop: 2,
  },
  pagerCount: {
    fontSize: 12,
    fontFamily: 'ClashGrotesk-Bold',
    color: '#71717A',
  },
  pagerControls: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  pagerButton: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: '#F4F4F5',
    alignItems: 'center',
    justifyContent: 'center',
  },
  pagerButtonDisabled: {
    opacity: 0.5,
  },
  pagerPressed: {
    opacity: 0.7,
  },
  pagerText: {
    fontSize: 12,
    fontFamily: 'ClashGrotesk-Bold',
    color: '#71717A',
  },
});
