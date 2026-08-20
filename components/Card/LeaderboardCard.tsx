import { Ionicons } from '@expo/vector-icons';
import { Image, Pressable, StyleSheet, Text, View } from 'react-native';
import { UserAvatar } from 'components/Avatar/UserAvatar';

export type LeaderboardEntry = {
  readonly id: number;
  readonly firstName: string;
  readonly lastName: string;
  readonly avatarUrl?: string | null;
  readonly value: number;
  readonly isCurrentUser?: boolean;
};

type LeaderboardCardProps = {
  readonly entries: LeaderboardEntry[];
  readonly metricLabel: string;
  /** Overall rank of the first entry minus one (paging offset). */
  readonly rankOffset?: number;
  readonly page?: number;
  readonly pageCount?: number;
  readonly onPageChange?: (page: number) => void;
  /** Shows a small tag marking the data as sample until the API exists. */
  readonly isSampleData?: boolean;
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
  onPageChange,
  isSampleData = false,
}: LeaderboardCardProps) {
  if (entries.length === 0) {
    return null;
  }
  const showPager = pageCount > 1 && onPageChange;
  return (
    <View style={styles.card}>
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
            <Text style={styles.name} numberOfLines={1}>
              {`${entry.firstName} ${entry.lastName}`.trim()}
              {entry.isCurrentUser ? ' (you)' : ''}
            </Text>
            <View style={styles.valueBlock}>
              <Text style={styles.value}>{entry.value.toLocaleString()}</Text>
              <Text style={styles.valueLabel}>{metricLabel}</Text>
            </View>
          </View>
        );
      })}
      {showPager ? (
        <View style={styles.pager}>
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
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#D4D4D8',
    paddingVertical: 6,
    paddingHorizontal: 10,
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
    fontWeight: '700',
    color: '#A1A1AA',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 8,
    paddingHorizontal: 6,
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
    fontWeight: '800',
    color: '#71717A',
  },
  medalImage: {
    width: 30,
    height: 40,
  },
  name: {
    flex: 1,
    fontSize: 14,
    fontWeight: '600',
    color: '#18181B',
  },
  valueBlock: {
    alignItems: 'flex-end',
  },
  value: {
    fontSize: 15,
    fontWeight: '800',
    color: '#18181B',
  },
  valueLabel: {
    fontSize: 10,
    fontWeight: '600',
    color: '#A1A1AA',
  },
  pager: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 14,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: '#E4E4E7',
    paddingVertical: 8,
    marginTop: 2,
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
    fontWeight: '700',
    color: '#71717A',
  },
});
