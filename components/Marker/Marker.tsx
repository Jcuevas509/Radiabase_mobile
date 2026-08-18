import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { Marker } from 'react-native-maps';
import { HugeiconsIcon } from '@hugeicons/react-native';
import Location01Icon from '@hugeicons/core-free-icons/Location01Icon';
import { BuildingProps } from 'types/componentsTypes';
import { leadStatuses } from 'constants/leadStatuses';
import React, { useCallback, useMemo } from 'react';

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

    // Memoiziramo status i stil za bolje performanse
    const status = useMemo(() =>
        leadStatuses.find(s => s.statusId === marker.statusId),
        [marker.statusId]
    );

    const markerStyle = useMemo(() => {
        if (type === 'polygon') return styles.polygonMarker;
        return styles.buildingMarker;
    }, [type]);

    // Koristimo useCallback za handlere
    const handleDragEnd = useCallback((e: any) => {
        if (onDragEnd) {
            onDragEnd(e);
        }
    }, [onDragEnd]);

    // Potpuno razdvajamo draggable i nedraggable markere
    if (draggable) {
        // Draggable marker - nema interaktivnosti osim povlačenja
        return (
            <Marker
                key={`marker-${id}-draggable`}
                coordinate={{ latitude: marker.latitude, longitude: marker.longitude }}
                draggable={true}
                onDragEnd={handleDragEnd}
                tracksViewChanges={false} // Važan prop za bolje performanse!
            />
        );
    } else {
        // Nedraggable marker - ima punu interaktivnost
        return (
            <Marker
                key={`marker-${id}-clickable`}
                coordinate={{ latitude: marker.latitude, longitude: marker.longitude }}
                title={type === 'polygon' ? marker.title : undefined}
                description={type === 'polygon' ? marker.subtitle : undefined}
                onPress={onClick}
                onCalloutPress={onClick}
                draggable={false}
                tracksViewChanges={false} // Važan prop za bolje performanse!
            >
                {onLongPress ? (
                    <TouchableOpacity onLongPress={onLongPress} activeOpacity={0.7}>
                        <View style={markerStyle}>
                            {type === 'building' && (
                                <HugeiconsIcon
                                    icon={Location01Icon}
                                    size={18}
                                    color={status?.color || '#18181B'}
                                    strokeWidth={2}
                                />
                            )}
                        </View>
                    </TouchableOpacity>
                ) : (
                    <View style={markerStyle}>
                        {type === 'building' && (
                            <HugeiconsIcon
                                icon={Location01Icon}
                                size={18}
                                color={status?.color || '#18181B'}
                                strokeWidth={2}
                            />
                        )}
                    </View>
                )}
            </Marker>
        );
    }
}

const styles = StyleSheet.create({
    buildingMarker: {
        width: 30,
        height: 30,
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
