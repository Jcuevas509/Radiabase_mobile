import CompassIcon from '@hugeicons/core-free-icons/CompassIcon';
import { HugeiconsIcon } from '@hugeicons/react-native';
import { Pressable, StyleSheet, Text, View } from 'react-native';

type MapCompassProps = {
  readonly heading: number;
  readonly onResetNorth: () => void;
};

export function MapCompass({ heading, onResetNorth }: MapCompassProps) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`Map heading ${Math.round(heading)} degrees. Reset map to north.`}
      hitSlop={8}
      onPress={onResetNorth}
      style={({ pressed }) => [styles.button, pressed && styles.pressed]}
    >
      <Text style={styles.north}>N</Text>
      <View style={{ transform: [{ rotate: `${-heading}deg` }] }}>
        <HugeiconsIcon
          icon={CompassIcon}
          size={30}
          color="#18181B"
          strokeWidth={2}
        />
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    position: 'absolute',
    top: 112,
    left: 18,
    width: 48,
    height: 58,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.94)',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.18,
    shadowRadius: 5,
    elevation: 5,
    zIndex: 20,
  },
  north: {
    marginBottom: -2,
    color: '#E53935',
    fontSize: 10,
    fontWeight: '800',
  },
  pressed: {
    opacity: 0.7,
  },
});
