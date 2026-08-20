import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { UserAvatar } from 'components/Avatar/UserAvatar';
import type { ProfileViewModel } from 'utils/build-profile-view-model';

// Temp portrait until the profile API serves a real avatar URL.
const AVATAR_URL_PLACEHOLDER = 'https://randomuser.me/api/portraits/men/32.jpg';

type SettingsRow = {
  readonly icon: keyof typeof Ionicons.glyphMap;
  readonly label: string;
  readonly route: string;
};

const PERSONAL_DETAIL_ROWS: readonly SettingsRow[] = [
  { icon: 'person-outline', label: 'Personal information', route: '/settings/personal-information' },
  { icon: 'notifications-outline', label: 'Notification preferences', route: '/settings/notifications' },
  { icon: 'map-outline', label: 'Map settings', route: '/settings/map' },
];

const GENERAL_ROWS: readonly SettingsRow[] = [
  { icon: 'settings-outline', label: 'Account settings', route: '/settings/account' },
  { icon: 'help-buoy-outline', label: 'Contact support', route: '/settings/support' },
  { icon: 'document-text-outline', label: 'Legal', route: '/settings/legal' },
];

type ProfileScreenProps = {
  readonly profile: ProfileViewModel;
  readonly appVersion: string;
  readonly onSignOut: () => void;
};

/**
 * Settings-style grouped profile: centered identity, an Account card of
 * label/value rows, chevron rows for details, and a red log out. Purely
 * presentational — data arrives through props, so wiring a real profile API
 * never touches this file. The chevron rows are design placeholders until
 * their screens exist.
 */
export function ProfileScreen({ profile, appVersion, onSignOut }: ProfileScreenProps) {
  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <LinearGradient
        colors={['#1687E8', '#0E5CAB', '#0A2E55']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.heroBanner}
      >
        <View style={[styles.heroCircle, styles.heroCircleLarge]} />
        <View style={[styles.heroCircle, styles.heroCircleMedium]} />
        <View style={[styles.heroCircle, styles.heroCircleSmall]} />
        <UserAvatar
          firstName={profile.firstName}
          lastName={profile.lastName}
          imageUrl={AVATAR_URL_PLACEHOLDER}
          size={84}
          color="#FFFFFF"
          ringWidth={2}
        />
        <Text style={styles.name}>{profile.fullName}</Text>
        <Text style={styles.role}>{profile.roleLabel}</Text>
      </LinearGradient>

      <Text style={styles.sectionHeader}>Account</Text>
      <View style={styles.card}>
        {profile.detailRows.map((row, index) => (
          <View key={row.label} style={[styles.valueRow, index > 0 && styles.rowDivider]}>
            <Text style={styles.valueRowLabel}>{row.label}</Text>
            <Text style={styles.valueRowValue} numberOfLines={1}>{row.value}</Text>
          </View>
        ))}
        {profile.email ? (
          <View style={[styles.valueRow, profile.detailRows.length > 0 && styles.rowDivider]}>
            <Text style={styles.valueRowLabel}>Email</Text>
            <Text style={styles.valueRowValue} numberOfLines={1}>{profile.email}</Text>
          </View>
        ) : null}
      </View>

      <Text style={styles.sectionHeader}>Personal details</Text>
      <View style={styles.card}>
        {PERSONAL_DETAIL_ROWS.map((row, index) => (
          <SettingsLinkRow key={row.label} row={row} showDivider={index > 0} />
        ))}
      </View>

      <Text style={styles.sectionHeader}>General</Text>
      <View style={styles.card}>
        {GENERAL_ROWS.map((row, index) => (
          <SettingsLinkRow key={row.label} row={row} showDivider={index > 0} />
        ))}
      </View>

      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Log out of Radiabase"
        onPress={onSignOut}
        style={({ pressed }) => [styles.card, styles.signOutButton, pressed && styles.pressed]}
      >
        <Text style={styles.signOutText}>Log out</Text>
      </Pressable>

      <Text style={styles.version}>Radiabase v{appVersion}</Text>
    </ScrollView>
  );
}

function SettingsLinkRow({
  row,
  showDivider,
}: {
  readonly row: SettingsRow;
  readonly showDivider: boolean;
}) {
  const router = useRouter();
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={row.label}
      onPress={() => router.push(row.route as never)}
      style={({ pressed }) => [styles.linkRow, showDivider && styles.rowDivider, pressed && styles.pressed]}
    >
      <View style={styles.linkIcon}>
        <Ionicons name={row.icon} size={18} color="#18181B" />
      </View>
      <Text style={styles.linkLabel}>{row.label}</Text>
      <Ionicons name="chevron-forward" size={16} color="#A1A1AA" />
    </Pressable>
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
  },
  heroBanner: {
    alignItems: 'center',
    paddingVertical: 26,
    gap: 3,
    borderRadius: 20,
    overflow: 'hidden',
  },
  heroCircle: {
    position: 'absolute',
    backgroundColor: 'rgba(255, 255, 255, 0.09)',
    borderRadius: 999,
  },
  heroCircleLarge: {
    width: 220,
    height: 220,
    top: -110,
    right: -70,
  },
  heroCircleMedium: {
    width: 140,
    height: 140,
    bottom: -60,
    left: -40,
  },
  heroCircleSmall: {
    width: 64,
    height: 64,
    top: 24,
    left: 34,
    backgroundColor: 'rgba(255, 255, 255, 0.07)',
  },
  name: {
    marginTop: 10,
    fontSize: 22,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  role: {
    fontSize: 14,
    fontWeight: '600',
    color: 'rgba(255, 255, 255, 0.85)',
  },
  sectionHeader: {
    marginTop: 18,
    marginBottom: 6,
    marginLeft: 14,
    fontSize: 12,
    fontWeight: '600',
    color: '#71717A',
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    paddingHorizontal: 14,
  },
  valueRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    minHeight: 46,
    gap: 14,
  },
  valueRowLabel: {
    fontSize: 15,
    color: '#18181B',
  },
  valueRowValue: {
    flexShrink: 1,
    fontSize: 15,
    color: '#71717A',
  },
  linkRow: {
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: 48,
    gap: 12,
  },
  linkIcon: {
    width: 24,
    alignItems: 'center',
  },
  linkLabel: {
    flex: 1,
    fontSize: 15,
    color: '#18181B',
  },
  rowDivider: {
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: '#E4E4E7',
  },
  signOutButton: {
    marginTop: 24,
    minHeight: 50,
    alignItems: 'center',
    justifyContent: 'center',
  },
  signOutText: {
    color: '#CA0105',
    fontSize: 16,
    fontWeight: '600',
  },
  pressed: {
    opacity: 0.65,
  },
  version: {
    textAlign: 'center',
    color: '#A1A1AA',
    fontSize: 11,
    marginTop: 16,
  },
});
