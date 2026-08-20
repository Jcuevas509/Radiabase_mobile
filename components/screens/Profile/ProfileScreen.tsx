import { useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { UserAvatar } from 'components/Avatar/UserAvatar';
import type { FieldStatsResponse } from 'services/area-api';
import type { ProfileViewModel } from 'utils/build-profile-view-model';
import { pickFieldStatsBucket } from 'utils/pick-field-stats-bucket';

const PERIODS = ['Today', 'This Week', 'This Month'] as const;

type ProfileScreenProps = {
  readonly profile: ProfileViewModel;
  readonly stats: FieldStatsResponse | null;
  readonly isLoadingStats: boolean;
  readonly appVersion: string;
  readonly onSignOut: () => void;
};

/**
 * Purely presentational profile. Everything shown arrives through props —
 * the route wrapper owns data (session today, a profile API later), so
 * connecting a real backend never touches this file.
 */
export function ProfileScreen({
  profile,
  stats,
  isLoadingStats,
  appVersion,
  onSignOut,
}: ProfileScreenProps) {
  const [activePeriod, setActivePeriod] = useState<string>('Today');
  const bucket = stats ? pickFieldStatsBucket(stats, activePeriod) : null;

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.identityCard}>
        <UserAvatar
          firstName={profile.firstName}
          lastName={profile.lastName}
          size={72}
        />
        <Text style={styles.name}>{profile.fullName}</Text>
        <View style={styles.roleChip}>
          <Text style={styles.roleChipText}>{profile.roleLabel}</Text>
        </View>
        {profile.email ? <Text style={styles.email}>{profile.email}</Text> : null}
      </View>

      {profile.detailRows.length > 0 ? (
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Organization</Text>
          {profile.detailRows.map((row) => (
            <View key={row.label} style={styles.detailRow}>
              <Text style={styles.detailLabel}>{row.label}</Text>
              <Text style={styles.detailValue} numberOfLines={1}>{row.value}</Text>
            </View>
          ))}
        </View>
      ) : null}

      <View style={styles.card}>
        <Text style={styles.cardTitle}>My activity</Text>
        <View style={styles.periodRow}>
          {PERIODS.map((period) => {
            const isSelected = activePeriod === period;
            return (
              <Pressable
                key={period}
                accessibilityRole="tab"
                accessibilityState={{ selected: isSelected }}
                onPress={() => setActivePeriod(period)}
                style={[styles.periodChip, isSelected && styles.periodChipSelected]}
              >
                <Text style={[styles.periodText, isSelected && styles.periodTextSelected]}>
                  {period}
                </Text>
              </Pressable>
            );
          })}
        </View>
        {isLoadingStats ? (
          <ActivityIndicator color="#1687E8" style={styles.statsLoader} />
        ) : (
          <View style={styles.statRow}>
            <StatTile label="Leads" value={bucket?.leads ?? 0} />
            <StatTile label="Knocks" value={bucket?.knocks ?? 0} />
            <StatTile label="Customers" value={bucket?.customers ?? 0} />
          </View>
        )}
      </View>

      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Log out of Radiabase"
        onPress={onSignOut}
        style={({ pressed }) => [styles.signOutButton, pressed && styles.pressed]}
      >
        <Text style={styles.signOutText}>Log out</Text>
      </Pressable>

      <Text style={styles.version}>Radiabase v{appVersion}</Text>
    </ScrollView>
  );
}

function StatTile({ label, value }: { readonly label: string; readonly value: number }) {
  return (
    <View style={styles.statTile}>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F4F4F5',
  },
  content: {
    padding: 16,
    paddingBottom: 32,
    gap: 14,
  },
  identityCard: {
    backgroundColor: 'white',
    borderRadius: 16,
    paddingVertical: 22,
    alignItems: 'center',
    gap: 8,
  },
  name: {
    fontSize: 20,
    fontWeight: '800',
    color: '#18181B',
    marginTop: 4,
  },
  roleChip: {
    backgroundColor: '#EFF6FF',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 4,
  },
  roleChipText: {
    color: '#1687E8',
    fontSize: 12,
    fontWeight: '700',
  },
  email: {
    color: '#71717A',
    fontSize: 13,
  },
  card: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 16,
    gap: 10,
  },
  cardTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#18181B',
    marginBottom: 2,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    minHeight: 28,
    gap: 12,
  },
  detailLabel: {
    color: '#71717A',
    fontSize: 13,
  },
  detailValue: {
    color: '#18181B',
    fontSize: 13,
    fontWeight: '600',
    flexShrink: 1,
  },
  periodRow: {
    flexDirection: 'row',
    gap: 8,
  },
  periodChip: {
    borderRadius: 14,
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: '#F4F4F5',
  },
  periodChipSelected: {
    backgroundColor: '#18181B',
  },
  periodText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#3F3F46',
  },
  periodTextSelected: {
    color: 'white',
  },
  statsLoader: {
    marginVertical: 14,
  },
  statRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 4,
  },
  statTile: {
    flex: 1,
    backgroundColor: '#F4F4F5',
    borderRadius: 12,
    padding: 12,
  },
  statValue: {
    fontSize: 20,
    fontWeight: '800',
    color: '#18181B',
  },
  statLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: '#71717A',
    marginTop: 2,
  },
  signOutButton: {
    backgroundColor: 'white',
    borderRadius: 16,
    minHeight: 50,
    alignItems: 'center',
    justifyContent: 'center',
  },
  signOutText: {
    color: '#CA0105',
    fontSize: 15,
    fontWeight: '700',
  },
  pressed: {
    opacity: 0.7,
  },
  version: {
    textAlign: 'center',
    color: '#A1A1AA',
    fontSize: 11,
    marginTop: 4,
  },
});
