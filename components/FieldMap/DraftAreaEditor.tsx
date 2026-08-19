import { useCallback, useRef, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import type { GestureResponderEvent, LayoutChangeEvent } from 'react-native';
import { Polygon } from 'react-native-maps';
import type { Region } from 'react-native-maps';
import type { CoordinateProps } from 'types/componentsTypes';
import {
  projectCoordinateToScreenPoint,
  projectScreenPointToCoordinate,
} from 'utils/project-screen-points-to-coordinates';

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
  readonly hidden: boolean;
  readonly onMoveVertex: (index: number, coordinate: CoordinateProps) => void;
};

/**
 * Screen-space vertex handles for the draft boundary. Native marker dragging
 * loses to the map pan gesture on iOS, so each dot is an ordinary view that
 * captures any touch that starts on it (44pt target) and converts finger
 * movement to coordinates with local Mercator math — dragging a dot reshapes
 * the polygon live, while touches anywhere else still pan and zoom the map.
 */
export function DraftVertexHandles({
  coordinates,
  region,
  hidden,
  onMoveVertex,
}: DraftVertexHandlesProps) {
  const [layerSize, setLayerSize] = useState({ width: 0, height: 0 });
  const [draggingIndex, setDraggingIndex] = useState<number | null>(null);
  const layerOriginRef = useRef({ x: 0, y: 0 });
  const layerRef = useRef<View>(null);

  const handleLayout = useCallback((event: LayoutChangeEvent) => {
    const { width, height } = event.nativeEvent.layout;
    setLayerSize({ width, height });
    layerRef.current?.measureInWindow((x, y) => {
      layerOriginRef.current = { x, y };
    });
  }, []);

  const moveVertexToTouch = useCallback((index: number, event: GestureResponderEvent) => {
    if (!region || layerSize.width <= 0 || layerSize.height <= 0) {
      return;
    }
    const point = {
      x: event.nativeEvent.pageX - layerOriginRef.current.x,
      y: event.nativeEvent.pageY - layerOriginRef.current.y,
    };
    const coordinate = projectScreenPointToCoordinate(point, {
      region,
      width: layerSize.width,
      height: layerSize.height,
    });
    if (coordinate) {
      onMoveVertex(index, coordinate);
    }
  }, [layerSize.height, layerSize.width, onMoveVertex, region]);

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
      {layerSize.width > 0 && coordinates.map((coordinate, index) => {
        const point = projectCoordinateToScreenPoint(coordinate, {
          region,
          width: layerSize.width,
          height: layerSize.height,
        });
        if (!point) {
          return null;
        }
        const isDragging = draggingIndex === index;
        return (
          <View
            key={`draft-vertex-${index}`}
            accessibilityLabel={`Area corner ${index + 1}. Drag to adjust the boundary.`}
            style={[styles.touchTarget, { left: point.x - 22, top: point.y - 22 }]}
            onStartShouldSetResponder={() => true}
            onMoveShouldSetResponder={() => true}
            onResponderTerminationRequest={() => false}
            onResponderGrant={() => setDraggingIndex(index)}
            onResponderMove={(event) => moveVertexToTouch(index, event)}
            onResponderRelease={(event) => {
              moveVertexToTouch(index, event);
              setDraggingIndex(null);
            }}
            onResponderTerminate={() => setDraggingIndex(null)}
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
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  vertexHandle: {
    width: 20,
    height: 20,
    borderRadius: 10,
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
