import { useEffect, useRef } from 'react';
import { Animated, Easing, Pressable, StyleSheet, Text, View } from 'react-native';
import { getShortestHeadingDelta, normalizeHeading } from 'utils/normalize-heading';

type TrueNorthCompassProps = {
  /** Map camera rotation in degrees; drives the ring and the "N" marker. */
  readonly mapHeading: number;
  /** Live device heading in degrees; drives the needle. Null hides the needle. */
  readonly deviceHeading: number | null;
  readonly onResetNorth: () => void;
  readonly onAlignToDevice?: () => void;
};

/**
 * Always-visible compass with two independent rotation sources that never
 * fight over one element: the ring (with "N") turns with finger map rotation,
 * while the needle turns continuously with the phone's heading sensors and
 * always points at real-world true north. When the needle sits on the "N",
 * the map is aligned with the world. Tap resets the map to north; long-press
 * rotates the map to match the direction the phone is facing.
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
      onPress={onResetNorth}
      onLongPress={onAlignToDevice}
      style={({ pressed }) => [styles.compass, pressed && styles.pressed]}
    >
      <Animated.View style={[StyleSheet.absoluteFill, { transform: [{ rotate: ringRotation }] }]}>
        <View style={styles.northMarker}>
          <Text style={styles.northText}>N</Text>
        </View>
        <View style={[styles.tick, styles.tickEast]} />
        <View style={[styles.tick, styles.tickSouth]} />
        <View style={[styles.tick, styles.tickWest]} />
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
function useSmoothedHeadingRotation(heading: number, durationMs: number): Animated.AnimatedInterpolation<string> {
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

const COMPASS_SIZE = 46;

const styles = StyleSheet.create({
  compass: {
    position: 'absolute',
    top: 72,
    left: 16,
    width: COMPASS_SIZE,
    height: COMPASS_SIZE,
    borderRadius: COMPASS_SIZE / 2,
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderWidth: 1,
    borderColor: 'rgba(24, 24, 27, 0.15)',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.18,
    shadowRadius: 4,
    elevation: 5,
    zIndex: 12,
  },
  pressed: {
    opacity: 0.75,
  },
  northMarker: {
    position: 'absolute',
    top: 2,
    left: 0,
    right: 0,
    alignItems: 'center',
  },
  northText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#18181B',
  },
  tick: {
    position: 'absolute',
    backgroundColor: 'rgba(24, 24, 27, 0.35)',
  },
  tickEast: {
    right: 3,
    top: COMPASS_SIZE / 2 - 1,
    width: 5,
    height: 2,
  },
  tickWest: {
    left: 3,
    top: COMPASS_SIZE / 2 - 1,
    width: 5,
    height: 2,
  },
  tickSouth: {
    bottom: 3,
    left: COMPASS_SIZE / 2 - 1,
    width: 2,
    height: 5,
  },
  needleLayer: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
  },
  needleNorth: {
    width: 0,
    height: 0,
    borderLeftWidth: 4,
    borderRightWidth: 4,
    borderBottomWidth: 13,
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
    borderBottomColor: '#F90114',
    marginBottom: 1,
  },
  needleSouth: {
    width: 0,
    height: 0,
    borderLeftWidth: 4,
    borderRightWidth: 4,
    borderTopWidth: 13,
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
    borderTopColor: '#71717A',
    marginTop: 1,
  },
  pivot: {
    position: 'absolute',
    top: COMPASS_SIZE / 2 - 3,
    left: COMPASS_SIZE / 2 - 3,
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#18181B',
  },
});
