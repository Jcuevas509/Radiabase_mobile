import { Pressable, StyleSheet, Text } from 'react-native';

type UnassignedMapLabelProps = {
  readonly areaId: number;
  readonly onPress?: () => void;
};

/**
 * Light chip on an unassigned turf.
 */
export function UnassignedMapLabel({
  areaId,
  onPress,
}: UnassignedMapLabelProps) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`Open unassigned area ${areaId}`}
      disabled={!onPress}
      onPress={onPress}
      style={({ pressed }) => [styles.chip, pressed && styles.pressed]}
    >
      <Text style={styles.label}>Unassigned</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  chip: {
    backgroundColor: '#F4F4F5',
    borderRadius: 16,
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderWidth: 1.5,
    borderColor: '#A1A1AA',
  },
  label: {
    fontSize: 12,
    fontWeight: '700',
    color: '#71717A',
  },
  pressed: {
    opacity: 0.75,
  },
});
