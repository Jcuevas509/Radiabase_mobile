import * as Location from 'expo-location';
import React, { useEffect, useRef, useState } from 'react';
import { Alert, Dimensions, StyleSheet, Text, View } from 'react-native';
import MapView, { Marker, Region } from 'react-native-maps';

import FloatingButtons from 'components/DrawingMap/FloatingButtons';
import {
    MapCompassController,
    type CompassControllerHandle,
} from 'components/FieldMap/MapCompassController';
import { MyLocationSvg } from 'components/svg';
import { useSession } from 'context/AuthenticationContext';
import { useAppIsActive } from 'hooks/useAppIsActive';
import { CoordinateProps } from 'types/componentsTypes';
import { getAcronym } from 'utils/helperFunctions';

const { width, height } = Dimensions.get('window');
const ASPECT_RATIO = width / height;
const LATITUDE_DELTA = 0.01;
const LONGITUDE_DELTA = LATITUDE_DELTA * ASPECT_RATIO;

/**
 * The My Location screen: a satellite map centered on the signed-in rep with
 * a recenter button. Field data (turf, roofs, doors) lives on the field map.
 */
const MapComponent = () => {
    const { session } = useSession();
    const isManager = session?.user?.role === 'manager';
    const displayName = `${session?.user?.firstName ?? ''} ${session?.user?.lastName ?? ''}`.trim() || 'You';
    const [region, setRegion] = useState<Region | null>(null);
    const [myLocation, setMyLocation] = useState<CoordinateProps | null>(null);
    const [isAtCurrentLocation, setIsAtCurrentLocation] = useState(true);
    const mapRef = useRef<MapView>(null);
    const isAppActive = useAppIsActive();
    const compassControllerRef = useRef<CompassControllerHandle | null>(null);

    useEffect(() => {
        let cancelled = false;
        (async () => {
            const { status } = await Location.requestForegroundPermissionsAsync();
            if (cancelled) {
                return;
            }
            if (status !== 'granted') {
                Alert.alert('Permission to access location was denied');
                return;
            }
            const location = await Location.getCurrentPositionAsync({
                accuracy: Location.Accuracy.Balanced,
            });
            if (cancelled) {
                return;
            }
            const initialRegion = {
                latitude: location.coords.latitude,
                longitude: location.coords.longitude,
                latitudeDelta: LATITUDE_DELTA,
                longitudeDelta: LONGITUDE_DELTA,
            };
            setRegion(initialRegion);
            setMyLocation({
                latitude: location.coords.latitude,
                longitude: location.coords.longitude,
            });
        })().catch(() => {
            if (!cancelled) {
                Alert.alert('Could not get your location', 'Check Location Services and try again.');
            }
        });
        return () => {
            cancelled = true;
        };
    }, []);

    const handleMyLocation = async () => {
        try {
            const location = await Location.getCurrentPositionAsync({});
            const newRegion = {
                latitude: location.coords.latitude,
                longitude: location.coords.longitude,
                latitudeDelta: LATITUDE_DELTA,
                longitudeDelta: LONGITUDE_DELTA,
            };
            mapRef.current?.animateToRegion(newRegion, 1000);
            setMyLocation({
                latitude: location.coords.latitude,
                longitude: location.coords.longitude,
            });
            setRegion(newRegion);
            setIsAtCurrentLocation(true);
        } catch {
            Alert.alert('Could not get your location', 'Check Location Services and try again.');
        }
    };

    const handleRegionChangeComplete = (newRegion: Region) => {
        compassControllerRef.current?.requestHeadingUpdate();
        if (!region || !isAtCurrentLocation) {
            return;
        }
        const locationThreshold = 0.0001;
        if (
            Math.abs(newRegion.latitude - region.latitude) > locationThreshold ||
            Math.abs(newRegion.longitude - region.longitude) > locationThreshold
        ) {
            setIsAtCurrentLocation(false);
        }
    };

    return (
        <View style={styles.container}>
            <FloatingButtons
                buttons={[
                    {
                        icon: <MyLocationSvg color={isAtCurrentLocation ? 'white' : '#1F1F1F'} />,
                        onPress: handleMyLocation,
                        accessibilityLabel: 'Center map on my location',
                        style: { backgroundColor: isAtCurrentLocation ? '#32A0FF' : 'white' },
                    },
                ]}
                isManager={isManager}
            />
            {region && (
                <MapView
                    style={styles.map}
                    ref={mapRef}
                    mapType="hybrid"
                    initialRegion={region}
                    rotateEnabled
                    pitchEnabled={false}
                    showsCompass={false}
                    onRegionChange={() => compassControllerRef.current?.requestHeadingUpdate()}
                    onRegionChangeComplete={handleRegionChangeComplete}
                >
                    {myLocation ? (
                        <Marker
                            key="my-location-marker"
                            coordinate={myLocation}
                            title={displayName}
                            tappable={false}
                            tracksViewChanges={false}
                        >
                            <View style={styles.myLocationMarker} pointerEvents="none">
                                <Text style={styles.myLocationText}>
                                    {getAcronym(displayName)}
                                </Text>
                            </View>
                        </Marker>
                    ) : null}
                </MapView>
            )}
            <MapCompassController
                mapRef={mapRef}
                isEnabled={isAppActive}
                controllerRef={compassControllerRef}
            />
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        ...StyleSheet.absoluteFillObject,
        justifyContent: 'flex-end',
        zIndex: 6,
    },
    map: {
        ...StyleSheet.absoluteFillObject,
    },
    myLocationMarker: {
        backgroundColor: 'white',
        borderColor: '#32A0FF',
        borderWidth: 2,
        borderRadius: 16,
        width: 32,
        height: 32,
        justifyContent: 'center',
        alignItems: 'center',
    },
    myLocationText: {
        color: '#32A0FF',
        fontWeight: 'bold',
    },
});

export default MapComponent;
