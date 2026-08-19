import { useEffect, useRef } from 'react';
import { Animated, Easing, Pressable, StyleSheet, Text, View } from 'react-native';
import { getShortestHeadingDelta, normalizeHeading } from 'utils/normalize-heading';

type TrueNorthCompassProps = {
  /** Map camera rotation in degrees; drives the cardinal ring and the "N". */
  readonly mapHeading: number;
  /** Live device heading in degrees; drives the needle. Null hides the needle. */
  readonly deviceHeading: number | null;
  readonly onResetNorth: () => void;
  readonly onAlignToDevice?: () => void;
};

/**
 * Always-visible realistic compass on a black face, with two independent
 * rotation sources that never fight over one element: the cardinal ring
 * (red "N") turns with finger map rotation, while the needle turns
 * continuously with the phone's heading sensors and points at real-world
 * true north. Needle on "N" means the map is aligned with the world. Tap
 * resets the map to north; long-press rotates the map to where the phone
 * is facing.
 */
export function TrueNorthCompass({
  mapHeading,
  deviceHeading,
  onResetNorth,
  onAlignToDevice,
}: TrueNorthCompassProps) {
  const ringRotation = useSmoothedHeadingRotation(mapHeading, 160);
  const needleRotation = useSmoothedHeadingRotation(deviceHeading ?? 0, 90);

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel="Compass. Tap to point the map north; long-press to rotate the map to where you are facing."
      hitSlop={8}
      onPress={onResetNorth}
      onLongPress={onAlignToDevice}
      style={({ pressed }) => [styles.face, pressed && styles.pressed]}
    >
      <Animated.View
        pointerEvents="none"
        style={[StyleSheet.absoluteFill, { transform: [{ rotate: ringRotation }] }]}
      >
        <Text style={[styles.cardinal, styles.cardinalNorth]}>N</Text>
        <Text style={[styles.cardinal, styles.cardinalEast]}>E</Text>
        <Text style={[styles.cardinal, styles.cardinalSouth]}>S</Text>
        <Text style={[styles.cardinal, styles.cardinalWest]}>W</Text>
      </Animated.View>
      {deviceHeading !== null ? (
        <Animated.View
          pointerEvents="none"
          style={[styles.needleLayer, { transform: [{ rotate: needleRotation }] }]}
        >
          <View style={styles.needleNorth} />
          <View style={styles.needleSouth} />
        </Animated.View>
      ) : null}
      <View pointerEvents="none" style={styles.pivot} />
    </Pressable>
  );
}

/**
 * Animates `-heading` degrees along the shortest arc, accumulating past 360
 * so a 350° -> 10° change turns 20° instead of unwinding a full circle.
 */
function useSmoothedHeadingRotation(
  heading: number,
  durationMs: number,
): Animated.AnimatedInterpolation<string> {
  const cumulativeRef = useRef(-normalizeHeading(heading));
  const animatedValue = useRef(new Animated.Value(cumulativeRef.current)).current;

  useEffect(() => {
    const currentHeading = normalizeHeading(-cumulativeRef.current);
    const delta = getShortestHeadingDelta(currentHeading, heading);
    if (delta === 0) {
      return;
    }
    cumulativeRef.current -= delta;
    Animated.timing(animatedValue, {
      toValue: cumulativeRef.current,
      duration: durationMs,
      easing: Easing.out(Easing.quad),
      useNativeDriver: true,
    }).start();
  }, [animatedValue, durationMs, heading]);

  return animatedValue.interpolate({
    inputRange: [0, 360],
    outputRange: ['0deg', '360deg'],
  });
}

const COMPASS_SIZE = 58;

const styles = StyleSheet.create({
  face: {
    position: 'absolute',
    top: 112,
    left: 18,
    width: COMPASS_SIZE,
    height: COMPASS_SIZE,
    borderRadius: COMPASS_SIZE / 2,
    backgroundColor: 'rgba(20, 20, 23, 0.92)',
    borderWidth: 1.5,
    borderColor: 'rgba(255, 255, 255, 0.28)',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
    elevation: 6,
    zIndex: 20,
  },
  pressed: {
    opacity: 0.75,
  },
  cardinal: {
    position: 'absolute',
    color: 'rgba(255, 255, 255, 0.85)',
    fontSize: 9,
    fontWeight: '700',
  },
  cardinalNorth: {
    top: 3,
    left: 0,
    right: 0,
    textAlign: 'center',
    color: '#FF453A',
    fontWeight: '800',
  },
  cardinalSouth: {
    bottom: 3,
    left: 0,
    right: 0,
    textAlign: 'center',
  },
  cardinalEast: {
    right: 5,
    top: COMPASS_SIZE / 2 - 8,
  },
  cardinalWest: {
    left: 5,
    top: COMPASS_SIZE / 2 - 8,
  },
  needleLayer: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
  },
  needleNorth: {
    width: 0,
    height: 0,
    borderLeftWidth: 4.5,
    borderRightWidth: 4.5,
    borderBottomWidth: 15,
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
    borderBottomColor: '#FF453A',
    marginBottom: 1,
  },
  needleSouth: {
    width: 0,
    height: 0,
    borderLeftWidth: 4.5,
    borderRightWidth: 4.5,
    borderTopWidth: 15,
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
    borderTopColor: 'rgba(255, 255, 255, 0.88)',
    marginTop: 1,
  },
  pivot: {
    position: 'absolute',
    top: COMPASS_SIZE / 2 - 3.5,
    left: COMPASS_SIZE / 2 - 3.5,
    width: 7,
    height: 7,
    borderRadius: 3.5,
    backgroundColor: 'white',
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.4)',
  },
});
