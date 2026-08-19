import { useCallback, useEffect, useRef, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import type { GestureResponderEvent, LayoutChangeEvent } from 'react-native';
import type MapView from 'react-native-maps';
import { Polygon } from 'react-native-maps';
import type { Region } from 'react-native-maps';
import type { RefObject } from 'react';
import type { CoordinateProps } from 'types/componentsTypes';
import {
  fitScreenProjection,
  invertScreenPointWithFit,
  type ScreenProjectionFit,
} from 'utils/fit-screen-projection';
import type { StrokePoint } from 'utils/simplify-stroke-points';

type DraftAreaPolygonProps = {
  readonly coordinates: CoordinateProps[];
};

/**
 * The painted-but-unsaved boundary, rendered as a real MapView child so it
 * stays glued to the ground while the map pans and zooms.
 */
export function DraftAreaPolygon({ coordinates }: DraftAreaPolygonProps) {
  if (coordinates.length < 3) {
    return null;
  }
  return (
    <Polygon
      coordinates={coordinates}
      strokeColor="#32A0FF"
      fillColor="rgba(50, 160, 255, 0.2)"
      strokeWidth={2}
      tappable={false}
    />
  );
}

type DraftVertexHandlesProps = {
  readonly coordinates: CoordinateProps[];
  readonly region: Region | null;
  readonly mapRef: RefObject<MapView | null>;
  readonly hidden: boolean;
  readonly onMoveVertex: (index: number, coordinate: CoordinateProps) => void;
};

/**
 * Screen-space vertex handles for the draft boundary. Dot positions come
 * from the map's own `pointForCoordinate`, so they sit exactly on the drawn
 * line; those samples calibrate a local projection fit, and drags invert the
 * finger position through that fit — the dot and the polygon follow the
 * finger exactly, with no native calls during the gesture. Touches that miss
 * the dots pass through and pan the map normally.
 */
export function DraftVertexHandles({
  coordinates,
  region,
  mapRef,
  hidden,
  onMoveVertex,
}: DraftVertexHandlesProps) {
  const [points, setPoints] = useState<Array<StrokePoint | null>>([]);
  const [draggingIndex, setDraggingIndex] = useState<number | null>(null);
  const draggingRef = useRef(false);
  const projectionRequestIdRef = useRef(0);
  const fitRef = useRef<ScreenProjectionFit | null>(null);
  const layerOriginRef = useRef({ x: 0, y: 0 });
  const layerRef = useRef<View>(null);

  useEffect(() => {
    const map = mapRef.current;
    if (hidden || draggingRef.current || !map || coordinates.length < 3) {
      return;
    }
    const requestId = projectionRequestIdRef.current + 1;
    projectionRequestIdRef.current = requestId;
    Promise.all(coordinates.map(async (coordinate) => {
      try {
        const point = await map.pointForCoordinate(coordinate);
        return Number.isFinite(point.x) && Number.isFinite(point.y) ? point : null;
      } catch {
        return null;
      }
    })).then((projected) => {
      if (projectionRequestIdRef.current !== requestId || draggingRef.current) {
        return;
      }
      const pairs = coordinates.flatMap((coordinate, index) => {
        const point = projected[index];
        return point ? [{ coordinate, point }] : [];
      });
      fitRef.current = fitScreenProjection(pairs);
      setPoints(projected);
    });
  }, [coordinates, hidden, mapRef, region]);

  const handleLayout = useCallback((_event: LayoutChangeEvent) => {
    layerRef.current?.measureInWindow((x, y) => {
      layerOriginRef.current = { x, y };
    });
  }, []);

  const moveVertexToTouch = useCallback((index: number, event: GestureResponderEvent) => {
    const fit = fitRef.current;
    if (!fit) {
      return;
    }
    const point = {
      x: event.nativeEvent.pageX - layerOriginRef.current.x,
      y: event.nativeEvent.pageY - layerOriginRef.current.y,
    };
    const coordinate = invertScreenPointWithFit(fit, point);
    if (!coordinate) {
      return;
    }
    setPoints((current) => {
      const next = [...current];
      next[index] = point;
      return next;
    });
    onMoveVertex(index, coordinate);
  }, [onMoveVertex]);

  if (hidden || !region || coordinates.length < 3) {
    return null;
  }

  return (
    <View
      ref={layerRef}
      pointerEvents="box-none"
      style={styles.layer}
      onLayout={handleLayout}
    >
      {points.map((point, index) => {
        if (!point || index >= coordinates.length) {
          return null;
        }
        const isDragging = draggingIndex === index;
        return (
          <View
            key={`draft-vertex-${index}`}
            accessibilityLabel={`Area corner ${index + 1}. Drag to adjust the boundary.`}
            style={[styles.touchTarget, { left: point.x - 26, top: point.y - 26 }]}
            onStartShouldSetResponder={() => true}
            onMoveShouldSetResponder={() => true}
            onResponderTerminationRequest={() => false}
            onResponderGrant={() => {
              draggingRef.current = true;
              setDraggingIndex(index);
            }}
            onResponderMove={(event) => moveVertexToTouch(index, event)}
            onResponderRelease={(event) => {
              moveVertexToTouch(index, event);
              draggingRef.current = false;
              setDraggingIndex(null);
            }}
            onResponderTerminate={() => {
              draggingRef.current = false;
              setDraggingIndex(null);
            }}
          >
            <View style={[styles.vertexHandle, isDragging && styles.vertexHandleActive]} />
          </View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  layer: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 10,
  },
  touchTarget: {
    position: 'absolute',
    width: 52,
    height: 52,
    alignItems: 'center',
    justifyContent: 'center',
  },
  vertexHandle: {
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: 'white',
    borderWidth: 3,
    borderColor: '#32A0FF',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.3,
    shadowRadius: 2,
    elevation: 3,
  },
  vertexHandleActive: {
    width: 26,
    height: 26,
    borderRadius: 13,
    borderColor: '#1687E8',
  },
});
