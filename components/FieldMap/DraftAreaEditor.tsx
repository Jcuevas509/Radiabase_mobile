import { StyleSheet, View } from 'react-native';
import { Marker, Polygon } from 'react-native-maps';
import type { CoordinateProps } from 'types/componentsTypes';

type DraftAreaEditorProps = {
  readonly coordinates: CoordinateProps[];
  readonly onMoveVertex: (index: number, coordinate: CoordinateProps) => void;
};

/**
 * The painted-but-unsaved turf polygon with draggable vertex handles, rendered
 * as real MapView children so the draft stays glued to the map while the
 * manager fine-tunes the boundary.
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
          onDragEnd={(event) => onMoveVertex(index, event.nativeEvent.coordinate)}
        >
          <View style={styles.vertexHandle} />
        </Marker>
      ))}
    </>
  );
}

const styles = StyleSheet.create({
  vertexHandle: {
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: 'white',
    borderWidth: 3,
    borderColor: '#32A0FF',
  },
});
