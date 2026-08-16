import React, { useRef, useState, useEffect, useCallback } from 'react';
import * as Location from 'expo-location';
import {
    StyleSheet,
    View,
    Text,
    Dimensions,
    Alert,
    LogBox,
    ActivityIndicator,
} from 'react-native';
import { debounce } from 'lodash';

import MapView, { Marker, Region } from 'react-native-maps';
import { MyLocationSvg } from 'components/svg';
import { getAcronym } from 'utils/helperFunctions';
import { CustomMarker } from 'components/Marker/Marker';
import { BuildingProps, CoordinateProps } from 'types/componentsTypes';
import { useSession } from 'context/AuthenticationContext';
import FloatingButtons from 'components/DrawingMap/FloatingButtons';
import { fetchOverpassData } from 'services/overpassApi';

const { width, height } = Dimensions.get('window');
const ASPECT_RATIO = width / height;
const LATITUDE_DELTA = 0.03;
const LONGITUDE_DELTA = LATITUDE_DELTA * ASPECT_RATIO;
const ZOOM_THRESHOLD = 0.01;

LogBox.ignoreAllLogs(true);

const MapComponent = () => {
    const { session } = useSession();
    const isManager = session?.user?.role === 'manager';
    const displayName = `${session?.user?.firstName ?? ''} ${session?.user?.lastName ?? ''}`.trim() || 'You';
    const [region, setRegion] = useState<Region | null>(null);
    const [buildingMarkers, setBuildingMarkers] = useState<Array<BuildingProps>>([]);
    const [myLocation, setMyLocation] = useState<CoordinateProps>({} as CoordinateProps);
    const [isAtCurrentLocation, setIsAtCurrentLocation] = useState(true);
    const [mapType, setMapType] = useState<'satellite' | 'standard'>('satellite');
    const [loading, setLoading] = useState(false);
    const mapRef = useRef<MapView>(null);
    const [lastFetchedRegion, setLastFetchedRegion] = useState<Region | null>(null);

    useEffect(() => {
        (async () => {
            try {
                let { status } = await Location.requestForegroundPermissionsAsync();
                if (status !== 'granted') {
                    Alert.alert('Permission to access location was denied');
                    return;
                }
                const location = await Location.getCurrentPositionAsync({});
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
                setTimeout(() => {
                    if (mapRef.current) {
                        mapRef.current.animateToRegion(initialRegion, 1000);
                    }
                }, 100);
            } catch (error) {
                console.error('Error initializing location:', error);
                Alert.alert('Error', 'Failed to initialize location');
            }
        })();
    }, []);

    const fetchBuildingData = useCallback(async (newRegion: Region) => {
        if (!newRegion) return;
        try {
            setLoading(true);
            const visibleRegion = {
                id: Date.now(),
                coordinates: [
                    { latitude: newRegion.latitude - newRegion.latitudeDelta / 2, longitude: newRegion.longitude - newRegion.longitudeDelta / 2 },
                    { latitude: newRegion.latitude + newRegion.latitudeDelta / 2, longitude: newRegion.longitude - newRegion.longitudeDelta / 2 },
                    { latitude: newRegion.latitude + newRegion.latitudeDelta / 2, longitude: newRegion.longitude + newRegion.longitudeDelta / 2 },
                    { latitude: newRegion.latitude - newRegion.latitudeDelta / 2, longitude: newRegion.longitude + newRegion.longitudeDelta / 2 },
                ],
                assignee: null,
            };

            const newMarkers = await fetchOverpassData(visibleRegion);
            if (newMarkers && Array.isArray(newMarkers)) {
                setBuildingMarkers(newMarkers);
                setLastFetchedRegion(newRegion);
            }
        } catch (error) {
            console.error("Error fetching building data:", error);
            setBuildingMarkers([]);
        } finally {
            setLoading(false);
        }
    }, []);

    const debouncedFetchBuildingData = useCallback(debounce(fetchBuildingData, 500), [fetchBuildingData]);

    const handleRegionChangeComplete = useCallback((newRegion: Region) => {
        if (!newRegion || !region) return;

        // Check if the region change is significant enough to warrant a new fetch
        const isSignificantChange = !lastFetchedRegion ||
            Math.abs(newRegion.latitude - lastFetchedRegion.latitude) > 0.0001 ||
            Math.abs(newRegion.longitude - lastFetchedRegion.longitude) > 0.0001 ||
            Math.abs(newRegion.latitudeDelta - lastFetchedRegion.latitudeDelta) > 0.0001;

        if (isAtCurrentLocation) {
            const currentLocation = {
                latitude: newRegion.latitude,
                longitude: newRegion.longitude,
            };
            const locationThreshold = 0.0001;
            if (
                Math.abs(currentLocation.latitude - region.latitude) > locationThreshold ||
                Math.abs(currentLocation.longitude - region.longitude) > locationThreshold
            ) {
                setIsAtCurrentLocation(false);
            }
        }

        if (newRegion.latitudeDelta <= ZOOM_THRESHOLD && isSignificantChange) {
            fetchBuildingData(newRegion);
        } else if (newRegion.latitudeDelta > ZOOM_THRESHOLD) {
            setBuildingMarkers([]);
        }
    }, [region, isAtCurrentLocation, fetchBuildingData, lastFetchedRegion]);

    const handleMyLocation = useCallback(async () => {
        try {
            let location = await Location.getCurrentPositionAsync({});
            const newRegion = {
                latitude: location.coords.latitude,
                longitude: location.coords.longitude,
                latitudeDelta: LATITUDE_DELTA,
                longitudeDelta: LONGITUDE_DELTA,
            };

            if (mapRef.current) {
                mapRef.current.animateToRegion(newRegion, 1000);
            }
            setMyLocation({
                latitude: location.coords.latitude,
                longitude: location.coords.longitude,
            });
            setRegion(newRegion);
            setIsAtCurrentLocation(true);
        } catch (error) {
            console.error('Error getting current location:', error);
            Alert.alert('Error', 'Failed to get current location');
        }
    }, []);

    const handleBuildingPress = useCallback((building: BuildingProps) => {
        console.log('Building pressed:', building);
    }, []);

    useEffect(() => {
        console.log("Updated markers:", buildingMarkers);
    }, [buildingMarkers]);

    return (
        <View style={styles.container}>
            <FloatingButtons
                buttons={[
                    {
                        icon: <MyLocationSvg color={isAtCurrentLocation ? "white" : "#1F1F1F"} />,
                        onPress: handleMyLocation,
                        style: { backgroundColor: isAtCurrentLocation ? "#32A0FF" : "white" }
                    },
                ]}
                setMapType={setMapType}
                mapType={mapType}
                isManager={isManager}
            />
            {region && (
                <MapView
                    style={styles.map}
                    ref={mapRef}
                    mapType={mapType}
                    initialRegion={region}
                    onRegionChangeComplete={handleRegionChangeComplete}
                >
                    {myLocation?.latitude && myLocation?.longitude && (
                        <Marker
                            key="my-location-marker"
                            coordinate={{ latitude: myLocation.latitude, longitude: myLocation.longitude }}
                            title={displayName}
                        >
                            <View style={styles.myLocationMarker}>
                                <Text style={styles.myLocationText}>
                                    {getAcronym(displayName)}
                                </Text>
                            </View>
                        </Marker>
                    )}
                    {buildingMarkers.map((marker) => (
                        <CustomMarker
                            type='building'
                            id={marker.id}
                            key={marker.id}
                            marker={marker}
                            onClick={() => handleBuildingPress(marker)}
                        />
                    ))}
                </MapView>
            )}
            {loading && (
                <View style={styles.loaderContainer}>
                    <ActivityIndicator size="large" color="#32A0FF" />
                </View>
            )}
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        ...StyleSheet.absoluteFillObject,
        justifyContent: 'flex-end',
        zIndex: 6
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
        alignItems: 'center'
    },
    myLocationText: {
        color: '#32A0FF',
        fontWeight: 'bold'
    },
    loaderContainer: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(255, 255, 255, 0.7)',
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 10,
    }
});

export default MapComponent;