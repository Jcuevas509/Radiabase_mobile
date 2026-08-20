import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useState, type ReactNode } from 'react';
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

/**
 * Shared frame and row kit for the settings sub-screens: back-arrow header,
 * grouped white cards on the gray page, and the three row types the designs
 * use. Screens compose these; none of them talk to services yet — they are
 * clickable design placeholders.
 */
export function SettingsShell({
  title,
  children,
}: {
  readonly title: string;
  readonly children: ReactNode;
}) {
  const router = useRouter();
  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <View style={styles.header}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Go back"
          hitSlop={12}
          onPress={() => router.back()}
          style={styles.headerSide}
        >
          <Ionicons name="chevron-back" size={26} color="#18181B" />
        </Pressable>
        <Text style={styles.headerTitle}>{title}</Text>
        <View style={styles.headerSide} />
      </View>
      <ScrollView contentContainerStyle={styles.content}>{children}</ScrollView>
    </SafeAreaView>
  );
}

export function SettingsCard({
  header,
  children,
}: {
  readonly header?: string;
  readonly children: ReactNode;
}) {
  return (
    <>
      {header ? <Text style={styles.sectionHeader}>{header}</Text> : null}
      <View style={styles.card}>{children}</View>
    </>
  );
}

export function ValueRow({
  label,
  value,
  showDivider = false,
}: {
  readonly label: string;
  readonly value: string;
  readonly showDivider?: boolean;
}) {
  return (
    <View style={[styles.row, showDivider && styles.rowDivider]}>
      <Text style={styles.rowLabel}>{label}</Text>
      <Text style={styles.rowValue} numberOfLines={1}>{value}</Text>
    </View>
  );
}

export function LinkRow({
  label,
  icon,
  destructive = false,
  showDivider = false,
  onPress,
}: {
  readonly label: string;
  readonly icon?: keyof typeof Ionicons.glyphMap;
  readonly destructive?: boolean;
  readonly showDivider?: boolean;
  readonly onPress?: () => void;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      onPress={onPress}
      style={({ pressed }) => [styles.row, showDivider && styles.rowDivider, pressed && styles.pressed]}
    >
      {icon ? (
        <View style={styles.rowIcon}>
          <Ionicons name={icon} size={18} color={destructive ? '#CA0105' : '#18181B'} />
        </View>
      ) : null}
      <Text style={[styles.rowLabel, styles.rowLabelGrow, destructive && styles.rowLabelDestructive]}>
        {label}
      </Text>
      <Ionicons name="chevron-forward" size={16} color="#A1A1AA" />
    </Pressable>
  );
}

export function ToggleRow({
  label,
  initialValue = false,
  showDivider = false,
}: {
  readonly label: string;
  readonly initialValue?: boolean;
  readonly showDivider?: boolean;
}) {
  // Local-only until settings persistence exists.
  const [isEnabled, setIsEnabled] = useState(initialValue);
  return (
    <View style={[styles.row, showDivider && styles.rowDivider]}>
      <Text style={[styles.rowLabel, styles.rowLabelGrow]}>{label}</Text>
      <Switch
        accessibilityLabel={label}
        value={isEnabled}
        onValueChange={setIsEnabled}
        trackColor={{ true: '#1687E8', false: '#D4D4D8' }}
      />
    </View>
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
    fontSize: 17,
    fontWeight: '800',
    color: '#18181B',
  },
  headerSide: {
    width: 44,
    height: 44,
    alignItems: 'flex-start',
    justifyContent: 'center',
  },
  content: {
    padding: 16,
    paddingBottom: 32,
  },
  sectionHeader: {
    marginTop: 14,
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
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: 48,
    gap: 12,
  },
  rowDivider: {
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: '#E4E4E7',
  },
  rowIcon: {
    width: 24,
    alignItems: 'center',
  },
  rowLabel: {
    fontSize: 15,
    color: '#18181B',
  },
  rowLabelGrow: {
    flex: 1,
  },
  rowLabelDestructive: {
    color: '#CA0105',
  },
  rowValue: {
    flex: 1,
    textAlign: 'right',
    fontSize: 15,
    color: '#71717A',
  },
  pressed: {
    opacity: 0.65,
  },
});
