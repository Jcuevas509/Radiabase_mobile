import React, { useRef, useState, useEffect, useMemo } from 'react';
import * as Location from 'expo-location';
import {
    StyleSheet,
    View,
    Text,
    Dimensions,
    Alert,
    LogBox,
} from 'react-native';

import MapView, { Marker, Region } from 'react-native-maps';
import { MyLocationSvg } from 'components/svg';
import { getAcronym } from 'utils/helperFunctions';
import { CustomMarker } from 'components/Marker/Marker';
import { BuildingProps, CoordinateProps } from 'types/componentsTypes';
import { useSession } from 'context/AuthenticationContext';
import FloatingButtons from 'components/DrawingMap/FloatingButtons';

const { width, height } = Dimensions.get('window');
const ASPECT_RATIO = width / height;
const LATITUDE_DELTA = 0.03;
const LONGITUDE_DELTA = LATITUDE_DELTA * ASPECT_RATIO;
interface MapProps {
    // canDraw: boolean;
    // stopDrawing: () => void;
    // setCanFinishDrawing: (value: boolean) => void;
    // setShowDrawButton: (value: boolean) => void;
    // showDrawButton: boolean;
}
LogBox.ignoreAllLogs(true);
const MapComponent = ({ }: MapProps) => {
    const { session } = useSession()
    const isManager = session?.user?.role === 'manager';
    const [region, setRegion] = useState<Region | null>(null);
    const [buildingMarkers, buildingMarkerssetfirst] = useState<Array<BuildingProps>>([])
    const [myLocation, setMyLocation] = useState<CoordinateProps>({} as CoordinateProps)
    const [isAtCurrentLocation, setIsAtCurrentLocation] = useState(true);
    const [mapType, setMapType] = useState<'satellite' | 'standard'>('satellite');
    const mapRef = useRef<MapView>(null);

    useEffect(() => {
        (async () => {
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
        })();
    }, []);


    useEffect(() => {
        // TODO:
        // - When "My Location" in the sidebar is opened, it should enable free-roam mode (unzoomed map).
        // - Once the user zooms in, trigger the Overpass API request based on the visible portion of the map.
        // - Render points for houses on the screen, allowing users to tap on them to check open house status or create a new entry in the database.
        // - Extract coordinates from the visible screen area to fetch data from Overpass.
        // - The Overpass API fetch function is already implemented: 
        //   import { fetchOverpassData } from 'services/overpassApi';
        //   It requires an object with:
        //   {
        //      id: number;
        //      coordinates: Array<{ latitude: number; longitude: number }>;
        //   }
        // - The coordinates array must contain at least three points, but in this case, it needs four (representing the four corners of the screen).
        // - Fetch Overpass data only when a specific zoom level is reached and store it inside `buildingMarkers`.
        // - Rendering of building markers is already handled in `memoizedBuildingMarkers`.
        // - If anything is unclear, ask Ahmed in `#map-mobile-project` channel.
    }, []);



    const handleMyLocation = async () => {
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

    };

    const handleRegionChangeComplete = (newRegion: Region) => {
        if (isAtCurrentLocation) {
            const currentLocation = {
                latitude: newRegion.latitude,
                longitude: newRegion.longitude,
            };
            const locationThreshold = 0.0001; // Adjust this value as needed
            if (
                Math.abs(currentLocation.latitude - region!.latitude) > locationThreshold ||
                Math.abs(currentLocation.longitude - region!.longitude) > locationThreshold
            ) {
                setIsAtCurrentLocation(false);
            }
        }
    };


    const memoizedBuildingMarkers = useMemo(() => {
        return buildingMarkers?.map((marker: any) =>
            marker.latitude && marker.longitude ? (
                <CustomMarker
                    type='building'
                    id={marker?.id}
                    key={marker?.id}
                    marker={marker}
                />
            ) : null
        )
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
            {region && <MapView
                style={styles.map}
                ref={mapRef}
                mapType={mapType}
                initialRegion={region}
                onRegionChangeComplete={handleRegionChangeComplete}
            >
                {myLocation && (
                    <Marker
                        key="my-location-marker"
                        coordinate={{ latitude: myLocation.latitude, longitude: myLocation.longitude }}
                        title={"John Doe"}
                    >
                        <View style={styles.myLocationMarker}>
                            <Text style={styles.myLocationText}>
                                {getAcronym("John Doe")}
                            </Text>
                        </View>
                    </Marker>
                )}
                {memoizedBuildingMarkers}
            </MapView>}
        </View >
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
    }
});

export default MapComponent;