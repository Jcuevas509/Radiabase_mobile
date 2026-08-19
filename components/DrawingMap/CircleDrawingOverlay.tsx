import { useCallback, useEffect, useRef } from 'react';
import {
  StyleSheet,
  Text,
  View,
  type GestureResponderEvent,
} from 'react-native';
import type MapView from 'react-native-maps';
import type { CoordinateProps } from 'types/componentsTypes';
import { buildCircleCoordinates } from 'utils/build-circle-coordinates';

type ScreenPoint = { x: number; y: number };

type CircleDrawingOverlayProps = {
  readonly active: boolean;
  readonly mapRef: React.RefObject<MapView | null>;
  readonly onCircleChange: (coordinates: CoordinateProps[]) => void;
};

export function CircleDrawingOverlay({
  active,
  mapRef,
  onCircleChange,
}: CircleDrawingOverlayProps) {
  const gestureIdRef = useRef(0);
  const centerRef = useRef<CoordinateProps | null>(null);
  const latestPointRef = useRef<ScreenPoint | null>(null);
  const projectionInFlightRef = useRef(false);
  const gestureEndedRef = useRef(false);
  const mountedRef = useRef(true);
  const projectLatestRef = useRef<() => void>(() => undefined);

  const projectLatest = useCallback(async () => {
    if (projectionInFlightRef.current || !centerRef.current || !latestPointRef.current) {
      return;
    }

    const gestureId = gestureIdRef.current;
    const point = latestPointRef.current;
    latestPointRef.current = null;
    projectionInFlightRef.current = true;
    try {
      const edge = await mapRef.current?.coordinateForPoint(point);
      if (!mountedRef.current || gestureId !== gestureIdRef.current || !edge || !centerRef.current) {
        return;
      }
      const coordinates = buildCircleCoordinates(centerRef.current, edge);
      if (coordinates.length >= 3) {
        onCircleChange(coordinates);
      }
    } catch {
      // Ignore a projection that is cancelled while the map or gesture changes.
    } finally {
      projectionInFlightRef.current = false;
      if (mountedRef.current && latestPointRef.current) {
        projectLatestRef.current();
      } else if (gestureEndedRef.current) {
        gestureIdRef.current += 1;
        centerRef.current = null;
      }
    }
  }, [mapRef, onCircleChange]);

  projectLatestRef.current = () => {
    void projectLatest();
  };

  const handleGrant = useCallback(async (event: GestureResponderEvent) => {
    const gestureId = gestureIdRef.current + 1;
    gestureIdRef.current = gestureId;
    centerRef.current = null;
    latestPointRef.current = null;
    gestureEndedRef.current = false;
    try {
      const center = await mapRef.current?.coordinateForPoint({
        x: event.nativeEvent.locationX,
        y: event.nativeEvent.locationY,
      });
      if (!mountedRef.current || gestureId !== gestureIdRef.current || !center) {
        return;
      }
      centerRef.current = center;
      if (latestPointRef.current) {
        projectLatestRef.current();
      }
    } catch {
      // A new gesture can replace this center projection.
    }
  }, [mapRef]);

  const handleMove = useCallback((event: GestureResponderEvent) => {
    latestPointRef.current = {
      x: event.nativeEvent.locationX,
      y: event.nativeEvent.locationY,
    };
    projectLatestRef.current();
  }, []);

  const handleRelease = useCallback(() => {
    gestureEndedRef.current = true;
    if (!projectionInFlightRef.current && !latestPointRef.current) {
      gestureIdRef.current += 1;
      centerRef.current = null;
    }
  }, []);

  const handleTerminate = useCallback(() => {
    gestureIdRef.current += 1;
    gestureEndedRef.current = true;
    centerRef.current = null;
    latestPointRef.current = null;
  }, []);

  useEffect(() => {
    if (!active) {
      gestureIdRef.current += 1;
      centerRef.current = null;
      latestPointRef.current = null;
      gestureEndedRef.current = true;
    }
  }, [active]);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
      gestureIdRef.current += 1;
    };
  }, []);

  return (
    <View
      accessible={active}
      accessibilityLabel="Circle drawing canvas. Drag from the center of the area outward."
      onMoveShouldSetResponder={() => active}
      onResponderGrant={handleGrant}
      onResponderMove={handleMove}
      onResponderRelease={handleRelease}
      onResponderTerminate={handleTerminate}
      onStartShouldSetResponder={() => active}
      pointerEvents={active ? 'auto' : 'none'}
      style={styles.canvas}
    >
      {active ? (
        <View pointerEvents="none" style={styles.instruction}>
          <Text style={styles.instructionText}>Drag from the center outward to draw an area</Text>
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  canvas: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 8,
  },
  instruction: {
    position: 'absolute',
    top: 62,
    left: 24,
    right: 24,
    alignItems: 'center',
  },
  instructionText: {
    overflow: 'hidden',
    borderRadius: 14,
    backgroundColor: 'rgba(24, 24, 27, 0.9)',
    paddingHorizontal: 14,
    paddingVertical: 9,
    color: 'white',
    fontSize: 13,
    fontWeight: '700',
  },
});
