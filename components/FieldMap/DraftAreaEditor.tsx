import { StyleSheet, View } from 'react-native';
import { Marker, Polygon } from 'react-native-maps';
import type { CoordinateProps } from 'types/componentsTypes';

type DraftAreaEditorProps = {
  readonly coordinates: CoordinateProps[];
  readonly onMoveVertex: (index: number, coordinate: CoordinateProps) => void;
};

/**
 * The painted-but-unsaved turf polygon with draggable vertex handles rendered
 * as real MapView children. Each handle is a 44pt touch target (the visible
 * dot is smaller) and reports every drag movement, so the boundary reshapes
 * live under the finger instead of jumping on release.
 */
export function DraftAreaEditor({ coordinates, onMoveVertex }: DraftAreaEditorProps) {
  if (coordinates.length < 3) {
    return null;
  }
  return (
    <>
      <Polygon
        coordinates={coordinates}
        strokeColor="#32A0FF"
        fillColor="rgba(50, 160, 255, 0.2)"
        strokeWidth={2}
        tappable={false}
      />
      {coordinates.map((coordinate, index) => (
        <Marker
          key={`draft-vertex-${index}`}
          coordinate={coordinate}
          anchor={{ x: 0.5, y: 0.5 }}
          draggable
          tracksViewChanges={false}
          onDrag={(event) => onMoveVertex(index, event.nativeEvent.coordinate)}
          onDragEnd={(event) => onMoveVertex(index, event.nativeEvent.coordinate)}
        >
          <View style={styles.touchTarget}>
            <View style={styles.vertexHandle} />
          </View>
        </Marker>
      ))}
    </>
  );
}

const styles = StyleSheet.create({
  touchTarget: {
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
});
