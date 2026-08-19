import CompassIcon from '@hugeicons/core-free-icons/CompassIcon';
import { HugeiconsIcon } from '@hugeicons/react-native';
import { useEffect, useRef } from 'react';
import { Animated, Easing, Pressable, StyleSheet, Text } from 'react-native';
import { getShortestHeadingDelta, normalizeHeading } from 'utils/normalize-heading';

type TrueNorthCompassProps = {
  /** Map camera rotation in degrees; drives the red "N" marker. */
  readonly mapHeading: number;
  /** Live device heading in degrees; drives the black compass glyph. Null falls back to map heading. */
  readonly deviceHeading: number | null;
  readonly onResetNorth: () => void;
  readonly onAlignToDevice?: () => void;
};

/**
 * Always-visible compass with two independent rotation sources that never
 * fight over one element: the red "N" turns with finger map rotation
 * (showing map north), while the black compass glyph turns continuously with
 * the phone's heading sensors and tracks real-world true north. When the
 * glyph points at the "N", the map is aligned with the world. Tap resets the
 * map to north; long-press rotates the map to where the phone is facing.
 */
export function TrueNorthCompass({
  mapHeading,
  deviceHeading,
  onResetNorth,
  onAlignToDevice,
}: TrueNorthCompassProps) {
  const ringRotation = useSmoothedHeadingRotation(mapHeading, 160);
  const glyphRotation = useSmoothedHeadingRotation(deviceHeading ?? mapHeading, 90);

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel="Compass. Tap to point the map north; long-press to rotate the map to where you are facing."
      hitSlop={8}
      onPress={onResetNorth}
      onLongPress={onAlignToDevice}
      style={({ pressed }) => [styles.button, pressed && styles.pressed]}
    >
      <Animated.View
        pointerEvents="none"
        style={[styles.ring, { transform: [{ rotate: ringRotation }] }]}
      >
        <Text style={styles.north}>N</Text>
      </Animated.View>
      <Animated.View style={{ transform: [{ rotate: glyphRotation }] }}>
        <HugeiconsIcon
          icon={CompassIcon}
          size={30}
          color="#18181B"
          strokeWidth={2}
        />
      </Animated.View>
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

const COMPASS_SIZE = 56;

const styles = StyleSheet.create({
  button: {
    position: 'absolute',
    top: 112,
    left: 18,
    width: COMPASS_SIZE,
    height: COMPASS_SIZE,
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
  ring: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
  },
  north: {
    marginTop: 1,
    color: '#E53935',
    fontSize: 10,
    fontWeight: '800',
  },
  pressed: {
    opacity: 0.7,
  },
});
