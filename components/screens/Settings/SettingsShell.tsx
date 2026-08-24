import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useState, type ReactNode } from 'react';
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { GlassSurface } from 'components/GlassSurface';

/**
 * Shared frame and row kit for the settings sub-screens: back-arrow header,
 * grouped white cards on the gray page, and the three row types the designs
 * use. Screens compose these; none of them talk to services yet — they are
 * clickable design placeholders.
 */
export function SettingsShell({
  title,
  children,
  headerRight,
  glassHeader = false,
}: {
  readonly title: string;
  readonly children: ReactNode;
  readonly headerRight?: ReactNode;
  /** Floats the header over the scrolling content on native glass — the
   * material needs content sliding beneath it to lens, so the bar overlays
   * the scroll view instead of stacking above it (nav-bar recipe). */
  readonly glassHeader?: boolean;
}) {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  if (glassHeader) {
    return (
      <View style={styles.safeArea}>
        {/* Faint diagonal tonal shift on the page ground so the floating
            glass always has a value change to refract, even at rest. */}
        <LinearGradient
          colors={['#FAFBFC', '#F1F2F4', '#E7EAEE']}
          locations={[0, 0.45, 1]}
          start={{ x: 0.15, y: 0 }}
          end={{ x: 0.85, y: 1 }}
          style={StyleSheet.absoluteFill}
        />
        <View style={[styles.header, styles.headerFloating, { top: insets.top }]}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Go back"
            hitSlop={12}
            onPress={() => router.back()}
            style={styles.headerSide}
          >
            <GlassSurface
              glassEffectStyle="clear"
              isInteractive
              style={styles.glassButton}
              fallbackStyle={styles.glassButtonFallback}
            >
              <Ionicons name="chevron-back" size={22} color="#18181B" />
            </GlassSurface>
          </Pressable>
          <GlassSurface
            glassEffectStyle="clear"
            style={styles.glassTitle}
            fallbackStyle={styles.glassButtonFallback}
          >
            <Text style={styles.headerTitle}>{title}</Text>
          </GlassSurface>
          <View style={[styles.headerSide, styles.headerSideRight]}>{headerRight}</View>
        </View>
        <ScrollView contentContainerStyle={[styles.content, { paddingTop: insets.top + 76 }]}>
          {children}
        </ScrollView>
      </View>
    );
  }
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
        <View style={[styles.headerSide, styles.headerSideRight]}>{headerRight}</View>
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

export function SettingsInput({
  label,
  value,
  onChangeText,
  placeholder,
  secureTextEntry = false,
  multiline = false,
}: {
  readonly label: string;
  readonly value: string;
  readonly onChangeText: (value: string) => void;
  readonly placeholder?: string;
  readonly secureTextEntry?: boolean;
  readonly multiline?: boolean;
}) {
  return (
    <View style={styles.inputBlock}>
      <Text style={styles.inputLabel}>{label}</Text>
      <TextInput
        accessibilityLabel={label}
        autoCapitalize="none"
        autoCorrect={false}
        multiline={multiline}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor="#A1A1AA"
        secureTextEntry={secureTextEntry}
        style={[styles.input, multiline && styles.inputMultiline]}
        value={value}
      />
    </View>
  );
}

export function SettingsPrimaryButton({
  label,
  onPress,
  isDisabled = false,
  isLoading = false,
}: {
  readonly label: string;
  readonly onPress: () => void;
  readonly isDisabled?: boolean;
  readonly isLoading?: boolean;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ disabled: isDisabled, busy: isLoading }}
      disabled={isDisabled || isLoading}
      onPress={onPress}
      style={({ pressed }) => [
        styles.primaryButton,
        (isDisabled || isLoading) && styles.primaryButtonDisabled,
        pressed && styles.pressed,
      ]}
    >
      {isLoading ? (
        <ActivityIndicator color="white" size="small" />
      ) : (
        <Text style={styles.primaryButtonText}>{label}</Text>
      )}
    </Pressable>
  );
}

export function SettingsParagraphs({
  paragraphs,
}: {
  readonly paragraphs: readonly { readonly heading?: string; readonly body: string }[];
}) {
  return (
    <View style={styles.paragraphCard}>
      {paragraphs.map((paragraph, index) => (
        <View key={index} style={index > 0 ? styles.paragraphSpacing : undefined}>
          {paragraph.heading ? (
            <Text style={styles.paragraphHeading}>{paragraph.heading}</Text>
          ) : null}
          <Text style={styles.paragraphBody}>{paragraph.body}</Text>
        </View>
      ))}
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
  headerSideRight: {
    alignItems: 'flex-end',
  },
  headerFloating: {
    position: 'absolute',
    left: 0,
    right: 0,
    zIndex: 10,
  },
  glassTitle: {
    height: 40,
    borderRadius: 20,
    paddingHorizontal: 18,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
  },
  // Bare native glass circle — no background or shadow on the glass node,
  // exactly like the nav bar.
  glassButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
  },
  glassButtonFallback: {
    backgroundColor: 'rgba(255, 255, 255, 0.5)',
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
  inputBlock: {
    paddingVertical: 10,
  },
  inputLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#71717A',
    marginBottom: 6,
  },
  input: {
    minHeight: 42,
    borderWidth: 1,
    borderColor: '#E4E4E7',
    borderRadius: 10,
    paddingHorizontal: 12,
    fontSize: 15,
    color: '#18181B',
    backgroundColor: '#FAFAFA',
  },
  inputMultiline: {
    minHeight: 110,
    paddingTop: 10,
    textAlignVertical: 'top',
  },
  primaryButton: {
    marginTop: 18,
    minHeight: 48,
    borderRadius: 14,
    backgroundColor: '#18181B',
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryButtonDisabled: {
    opacity: 0.4,
  },
  primaryButtonText: {
    color: 'white',
    fontSize: 15,
    fontWeight: '700',
  },
  paragraphCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 16,
  },
  paragraphSpacing: {
    marginTop: 14,
  },
  paragraphHeading: {
    fontSize: 14,
    fontWeight: '800',
    color: '#18181B',
    marginBottom: 4,
  },
  paragraphBody: {
    fontSize: 13,
    lineHeight: 19,
    color: '#52525B',
  },
});
