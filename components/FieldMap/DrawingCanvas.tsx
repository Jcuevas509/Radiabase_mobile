import { useCallback, useRef, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import type { GestureResponderEvent, LayoutChangeEvent } from 'react-native';
import Svg, { Path } from 'react-native-svg';
import type { StrokePoint } from 'utils/simplify-stroke-points';

export type CanvasSize = {
  readonly width: number;
  readonly height: number;
};

type DrawingCanvasProps = {
  readonly onStrokeComplete: (points: StrokePoint[], size: CanvasSize) => void;
};

const STROKE_COLOR = '#32A0FF';
const STROKE_FILL = 'rgba(50, 160, 255, 0.16)';

/**
 * Full-screen paint surface for turf drawing. Every touch sample is handled
 * synchronously in screen space, so the stroke follows the finger at frame
 * rate; conversion to map coordinates happens once, on release. Mounting this
 * view is what puts the map into drawing mode — the map keeps all of its own
 * gestures, this surface simply sits above it while active.
 */
export function DrawingCanvas({ onStrokeComplete }: DrawingCanvasProps) {
  const sizeRef = useRef<CanvasSize>({ width: 0, height: 0 });
  const pointsRef = useRef<StrokePoint[]>([]);
  const [pathData, setPathData] = useState('');

  const handleLayout = useCallback((event: LayoutChangeEvent) => {
    const { width, height } = event.nativeEvent.layout;
    sizeRef.current = { width, height };
  }, []);

  const appendPoint = useCallback((event: GestureResponderEvent) => {
    const { locationX, locationY } = event.nativeEvent;
    if (!Number.isFinite(locationX) || !Number.isFinite(locationY)) {
      return;
    }
    pointsRef.current.push({ x: locationX, y: locationY });
    setPathData(buildPathData(pointsRef.current));
  }, []);

  const handleGrant = useCallback((event: GestureResponderEvent) => {
    pointsRef.current = [];
    appendPoint(event);
  }, [appendPoint]);

  const handleRelease = useCallback(() => {
    const points = pointsRef.current;
    pointsRef.current = [];
    setPathData('');
    if (points.length >= 3) {
      onStrokeComplete(points, sizeRef.current);
    }
  }, [onStrokeComplete]);

  const handleTerminate = useCallback(() => {
    pointsRef.current = [];
    setPathData('');
  }, []);

  return (
    <View
      accessibilityLabel="Area painting canvas"
      style={styles.canvas}
      onLayout={handleLayout}
      onStartShouldSetResponder={() => true}
      onMoveShouldSetResponder={() => true}
      onResponderGrant={handleGrant}
      onResponderMove={appendPoint}
      onResponderRelease={handleRelease}
      onResponderTerminate={handleTerminate}
    >
      <View pointerEvents="none" style={styles.hint}>
        <Text style={styles.hintText}>Paint around the homes for this area</Text>
      </View>
      {pathData ? (
        <Svg pointerEvents="none" style={StyleSheet.absoluteFill}>
          <Path
            d={pathData}
            stroke={STROKE_COLOR}
            strokeWidth={3}
            strokeLinecap="round"
            strokeLinejoin="round"
            fill={STROKE_FILL}
          />
        </Svg>
      ) : null}
    </View>
  );
}

function buildPathData(points: readonly StrokePoint[]): string {
  if (points.length === 0) {
    return '';
  }
  const [first, ...rest] = points;
  const segments = rest.map((point) => `L ${point.x} ${point.y}`).join(' ');
  return `M ${first.x} ${first.y} ${segments}`;
}

const styles = StyleSheet.create({
  canvas: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 9,
  },
  hint: {
    position: 'absolute',
    top: 72,
    left: 16,
    right: 16,
    alignItems: 'center',
  },
  hintText: {
    backgroundColor: 'rgba(24, 24, 27, 0.9)',
    color: 'white',
    fontSize: 13,
    fontWeight: '600',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 16,
    overflow: 'hidden',
  },
});
