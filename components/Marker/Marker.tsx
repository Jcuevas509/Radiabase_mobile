import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { Marker } from 'react-native-maps';
import { BuildingProps, LeadStatus, MarkerProps } from 'types/componentsTypes';
import { leadStatuses } from 'constants/leadStatuses';
interface ComponentMarkerProps {
    marker: BuildingProps;
    id: string | number;
    type: 'building' | 'polygon',
    onClick?: () => void;
    onLongPress?: () => void;
    draggable?: boolean;
    onDragEnd?: (e: any) => void;

}

/**
 * @description A component that can be used as a marker in the map
 */

export function CustomMarker({
    marker,
    type,
    id,
    onClick,
    onLongPress,
    draggable = false,
    onDragEnd
}: ComponentMarkerProps) {

    const status = leadStatuses.find(s => s.statusId === marker.statusId);
    const StatusIcon = status?.icon;
    const getMarkerStyle = () => {
        if (type === 'polygon') return styles.polygonMarker;

        if (type === 'building' && marker.statusId !== undefined) {
            return {
                ...styles.buildingMarker,
                borderColor: status ? status.color : 'black',
            };
        }

        return styles.buildingMarker;
    };
    return (
        <Marker
            key={`marker-${id}`}
            coordinate={{ latitude: marker.latitude, longitude: marker.longitude }}
            title={!draggable && type === 'polygon' ? marker.title : undefined}
            description={!draggable && type === 'polygon' ? marker.subtitle : undefined}
            onPress={onClick}
            draggable={draggable}
            onCalloutPress={onClick}
            onDragEnd={onDragEnd}
        >
            <TouchableOpacity onLongPress={onLongPress}>
                <View style={getMarkerStyle()}>
                    {type === 'building' && StatusIcon && (
                        <StatusIcon color={status?.color || 'gray'} />
                    )}
                </View>
            </TouchableOpacity>
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
        backgroundColor: 'white',
        justifyContent: 'center',
        alignItems: 'center'
    },
    polygonMarker: {
        width: 30,
        height: 30,
        borderRadius: 15,
        borderWidth: 2,
        backgroundColor: "#32A0FF",
        borderColor: "#32A0FF",
    },
});
