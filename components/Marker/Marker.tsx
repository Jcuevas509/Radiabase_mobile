import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { Marker } from 'react-native-maps';
import { MarkerProps } from 'types/componentsTypes';
interface ComponentMarkerProps {
    marker: MarkerProps;
    id: string | number;
    type: 'building' | 'polygon',
    onClick?: () => void,
}

/**
 * @description A component that can be used as a marker in the map
 */

export function CustomMarker({
    marker,
    type,
    id
}: ComponentMarkerProps) {
    return (
        <Marker
            key={`marker-${id}`}
            coordinate={{ latitude: marker.latitude, longitude: marker.longitude }}
            title={marker.title}
            description={marker.subtitle}
        >
            <View style={type === 'building' ? styles.buildingMarker : styles.polygonMarker} />
        </Marker>
    );
}

const styles = StyleSheet.create({
    buildingMarker: {
        width: 30,
        height: 30,
        borderRadius: 15,
        borderWidth: 2,
        borderColor: "black",
    },
    polygonMarker: {
        width: 10,
        height: 10,
        borderRadius: 5,
        borderWidth: 2,
        backgroundColor: "#32A0FF",
        borderColor: "#32A0FF",
    },
});
