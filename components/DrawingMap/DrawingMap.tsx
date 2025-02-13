import React, { useState, useEffect, useRef, useCallback } from 'react';
import { View, StyleSheet, Alert, Button, ActivityIndicator, LogBox } from 'react-native';
import MapView, { Marker, Polygon } from 'react-native-maps';
import axios from 'axios';

export function DrawingMap() {
    const [markers, setMarkers] = useState([]);
    const [polygonCoordinates, setPolygonCoordinates] = useState([]);
    const mapViewRef = useRef(null);
    const [loading, setLoading] = useState(false)

    const handleMapPress = (event: any) => {
        const { coordinate } = event.nativeEvent;
        //@ts-ignore
        setPolygonCoordinates((prev: any) => [...prev, coordinate]);
    };

    const fetchOverpassData = async () => {

        if (polygonCoordinates.length < 3) {
            Alert.alert("Error", "Please draw a polygon with at least 3 points.");
            return;
        }
        setLoading(true);
        const polygonString = polygonCoordinates
            .map((coord: any) => `${coord.latitude} ${coord.longitude}`)
            .join(' ');

        const overpassUrl = `https://overpass-api.de/api/interpreter`;
        const query = `[out:json];
            (
                way["building"](poly:"${polygonString}");
            );
            out center;`;
        try {
            const response = await axios.post(overpassUrl, query, { headers: { 'Content-Type': 'application/x-www-form-urlencoded' } });
            const data = response.data.elements;
            console.log('data', data)
            const newMarkers = data.map((item: any) => ({
                // id: item?.id,
                latitude: item.center?.lat,
                longitude: item.center?.lon,
                title: item.tags?.name || "Unnamed Way",
                subtitle: item.tags?.amenity || "No Amenity",
            }));
            setMarkers(newMarkers);
            setLoading(false)
        } catch (error) {
            console.error("Error fetching data: ", error);
            setLoading(false)
        }
    };

    useEffect(() => {
        if (polygonCoordinates.length > 0) {
            setMarkers((prev) => [...prev]);
        }
    }, [polygonCoordinates]);

    useEffect(() => {
        if (markers.length > 0) {
            setPolygonCoordinates((prev) => [...prev]);
        }
    }, [markers]);

    const clearPolygon = useCallback(() => {
        setPolygonCoordinates([]);
        setMarkers([]);
    }, []);


    return (
        <View style={styles.container}>
            {loading && <View style={styles.loaderContainer}>
                <ActivityIndicator size="large" color="#0000ff" />
            </View>}
            <MapView
                ref={mapViewRef}
                mapType='satellite'
                initialRegion={{
                    latitude: 33.589290,
                    longitude: -112.407839,
                    latitudeDelta: 0.003,
                    longitudeDelta: 0.003,
                }}
                // key={markers?.length}
                scrollEnabled={true}
                zoomEnabled={true}
                style={styles.map}
                onPress={handleMapPress}
            >
                {polygonCoordinates.length > 0 && (
                    <Polygon
                        coordinates={polygonCoordinates}
                        strokeColor="#000"
                        fillColor="rgba(255,0,0,0.5)"
                        strokeWidth={1}
                    />
                )}
                {polygonCoordinates.map((coord, index) => (
                    <Marker
                        key={`polygon-marker-${index}`}
                        coordinate={coord}
                        title={`Point ${index + 1}`}
                    >
                        <View style={styles.polygonMarker}>

                        </View>

                    </Marker>
                ))}
                {markers.map((marker: any, index) => (
                    marker.latitude && marker.longitude ? (
                        <Marker
                            key={`building-marker-${marker.id}`} // Use unique id for key
                            coordinate={{ latitude: marker.latitude, longitude: marker.longitude }}
                            title={marker.title}
                            description={marker.subtitle}
                        >
                            <View style={styles.buildingMarker} />
                        </Marker>
                    ) : null
                ))}
            </MapView>
            {/* <View style={styles.buttonContainer}>
                <Button title="Fetch Buildings" onPress={fetchOverpassData} />
                <Button title="Clear Polygon" onPress={clearPolygon} />
            </View> */}
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: 'white',
        width: '100%',
        height: '100%',
    },
    polygonMarker: {
        width: 30,
        height: 30,
        borderRadius: 15,
        borderWidth: 2,
        borderColor: "red",
        backgroundColor: 'red'
    },
    buildingMarker: {
        width: 30,
        height: 30,
        borderRadius: 15,
        borderWidth: 2,
        borderColor: "blue",
    },
    map: {
        width: '100%',
        height: '100%',
    },
    buttonContainer: {
        flexDirection: 'row',
        justifyContent: 'space-around',
        padding: 10,
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
    },
});