import { StyleSheet, Text, View } from 'react-native';
import { Marker } from 'react-native-maps';

type UnassignedMapLabelProps = {
  readonly areaId: number;
  readonly latitude: number;
  readonly longitude: number;
  readonly onPress?: () => void;
};

/**
 * Light chip on an unassigned turf.
 */
export function UnassignedMapLabel({
  areaId,
  latitude,
  longitude,
  onPress,
}: UnassignedMapLabelProps) {
  return (
    <Marker
      identifier={`area-${areaId}-unassigned`}
      coordinate={{ latitude, longitude }}
      tracksViewChanges={false}
      anchor={{ x: 0.5, y: 0.5 }}
      tappable={Boolean(onPress)}
      zIndex={4}
      onPress={onPress}
    >
      <View style={styles.chip} pointerEvents="none">
        <Text style={styles.label}>Unassigned</Text>
      </View>
    </Marker>
  );
}

const styles = StyleSheet.create({
  chip: {
    backgroundColor: '#F4F4F5',
    borderRadius: 16,
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderWidth: 1.5,
    borderColor: '#A1A1AA',
  },
  label: {
    fontSize: 12,
    fontWeight: '700',
    color: '#71717A',
  },
});
