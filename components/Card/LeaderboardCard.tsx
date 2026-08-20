import { LinearGradient } from 'expo-linear-gradient';
import { StyleSheet, Text, View } from 'react-native';
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
  /** Shows a small tag marking the data as sample until the API exists. */
  readonly isSampleData?: boolean;
};

type MedalTheme = {
  readonly disc: readonly [string, string, string];
  readonly rim: string;
  readonly ribbonLeft: string;
  readonly ribbonRight: string;
};

const MEDAL_THEMES: Record<number, MedalTheme> = {
  1: {
    disc: ['#FDE68A', '#F5B301', '#B45309'],
    rim: '#92610A',
    ribbonLeft: '#DC2626',
    ribbonRight: '#B91C1C',
  },
  2: {
    disc: ['#F8FAFC', '#C7CCD4', '#8E9196'],
    rim: '#6B7280',
    ribbonLeft: '#3B82F6',
    ribbonRight: '#1D4ED8',
  },
  3: {
    disc: ['#FBD38D', '#C97B34', '#8C4A18'],
    rim: '#713F12',
    ribbonLeft: '#16A34A',
    ribbonRight: '#15803D',
  },
};

function Medal({ rank }: { readonly rank: number }) {
  const theme = MEDAL_THEMES[rank];
  if (!theme) {
    return (
      <View style={styles.rankBubble}>
        <Text style={styles.rankText}>{rank}</Text>
      </View>
    );
  }
  return (
    <View style={styles.medal}>
      <View style={[styles.ribbon, styles.ribbonLeft, { backgroundColor: theme.ribbonLeft }]} />
      <View style={[styles.ribbon, styles.ribbonRight, { backgroundColor: theme.ribbonRight }]} />
      <LinearGradient
        colors={[...theme.disc]}
        start={{ x: 0.2, y: 0.1 }}
        end={{ x: 0.8, y: 1 }}
        style={[styles.medalDisc, { borderColor: theme.rim }]}
      >
        <View style={styles.medalInnerRing}>
          <Text style={styles.medalRankText}>{rank}</Text>
        </View>
      </LinearGradient>
    </View>
  );
}

/**
 * Ranked rep list. Purely presentational: hand it entries from the future
 * leaderboard API (sorted descending by value) and it renders them; until
 * then the caller passes sample rows and the Sample tag stays visible.
 */
export function LeaderboardCard({
  entries,
  metricLabel,
  isSampleData = false,
}: LeaderboardCardProps) {
  if (entries.length === 0) {
    return null;
  }
  return (
    <View style={styles.card}>
      {isSampleData ? (
        <View style={styles.sampleTag}>
          <Text style={styles.sampleTagText}>Sample</Text>
        </View>
      ) : null}
      {entries.map((entry, index) => {
        const rank = index + 1;
        return (
          <View
            key={entry.id}
            style={[styles.row, entry.isCurrentUser && styles.rowCurrentUser]}
          >
            <Medal rank={rank} />
            <UserAvatar
              firstName={entry.firstName}
              lastName={entry.lastName}
              imageUrl={entry.avatarUrl}
              size={34}
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
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
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
    borderRadius: 12,
  },
  rowCurrentUser: {
    backgroundColor: '#EFF6FF',
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
  medal: {
    width: 30,
    height: 38,
    alignItems: 'center',
    justifyContent: 'flex-end',
  },
  ribbon: {
    position: 'absolute',
    top: 0,
    width: 9,
    height: 16,
    borderRadius: 2,
  },
  ribbonLeft: {
    left: 5,
    transform: [{ rotate: '18deg' }],
  },
  ribbonRight: {
    right: 5,
    transform: [{ rotate: '-18deg' }],
  },
  medalDisc: {
    width: 28,
    height: 28,
    borderRadius: 14,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.3,
    shadowRadius: 2,
    elevation: 3,
  },
  medalInnerRing: {
    width: 21,
    height: 21,
    borderRadius: 10.5,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.55)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  medalRankText: {
    fontSize: 11,
    fontWeight: '900',
    color: 'white',
    textShadowColor: 'rgba(0, 0, 0, 0.35)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 1,
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
});
