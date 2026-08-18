import { HugeiconsIcon, type IconSvgElement } from '@hugeicons/react-native';
import { StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

type EmptyCollectionScreenProps = {
  readonly title: string;
  readonly message: string;
  readonly icon: IconSvgElement;
};

export function EmptyCollectionScreen({
  title,
  message,
  icon,
}: EmptyCollectionScreenProps) {
  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>{title}</Text>
      </View>
      <View style={styles.content}>
        <View style={styles.iconCircle}>
          <HugeiconsIcon
            icon={icon}
            size={34}
            color="#1687E8"
            strokeWidth={1.8}
          />
        </View>
        <Text style={styles.title}>No {title.toLowerCase()} yet</Text>
        <Text style={styles.message}>{message}</Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#FAFAF9',
  },
  header: {
    minHeight: 52,
    justifyContent: 'center',
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#E4E4E7',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 20,
  },
  headerTitle: {
    color: '#18181B',
    fontSize: 20,
    fontWeight: '700',
  },
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
    paddingBottom: 90,
  },
  iconCircle: {
    width: 72,
    height: 72,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 36,
    backgroundColor: '#E8F4FE',
  },
  title: {
    marginTop: 18,
    color: '#18181B',
    fontSize: 20,
    fontWeight: '700',
  },
  message: {
    marginTop: 8,
    color: '#71717A',
    fontSize: 14,
    lineHeight: 21,
    textAlign: 'center',
  },
});
