import React, { useState, useEffect, useRef } from 'react';
import { View, StyleSheet } from 'react-native';
import MapView, { Marker } from 'react-native-maps';
import axios from 'axios';

export default function Map() {

    const [markers, setMarkers] = useState<any>([]);
    const mapViewRef = useRef(null);

    const fetchOverpassData = async () => {
        const overpassUrl = `https://overpass-api.de/api/interpreter`;
        const query = `[out:json];
                        (                      
                         way["building"](around:100,33.589290,-112.407839);
                        );
                        out center;`;
        try {
            const response = await axios.post(overpassUrl, query, { headers: { 'Content-Type': 'application/x-www-form-urlencoded' } });
            const data = response.data.elements;
            const markers = data.map((item: any) => {
                let lat, lon, title, subtitle;
                if (item.type === "node") {
                    lat = item.center?.lat;
                    lon = item.center?.lon;
                    title = item.tags?.name || "Unnamed Node";
                    subtitle = item.tags?.amenity || "No Amenity";
                } else if (item.type === "way") {
                    lat = item.center?.lat;
                    lon = item.center?.lon;
                    title = item.tags?.name || "Unnamed Way";
                    subtitle = item.tags?.amenity || "No Amenity";
                }
                return {
                    latitude: lat,
                    longitude: lon,
                    title: title,
                    subtitle: subtitle,
                };
            });
            setMarkers(markers);

        } catch (error) {
            console.error("Error fetching data: ", error);
        }
    };

    useEffect(() => {
        fetchOverpassData();
    }, []);

    useEffect(() => {
        if (markers.length > 0) {
            const region = {
                latitude: markers[0]?.latitude,
                longitude: markers[0]?.longitude,
                latitudeDelta: 0.003,
                longitudeDelta: 0.003,
            };
            if (mapViewRef.current) {
                //@ts-ignore
                mapViewRef.current.animateToRegion(region, 1000); // Smooth transition to the region
            }
        }
    }, [markers]);

    return (
        <View style={styles.container}>
            <MapView
                key={markers.length}
                ref={mapViewRef}
                mapType='satellite'
                initialRegion={{
                    latitude: 33.589290,
                    longitude: -112.407839,
                    latitudeDelta: 0.003,
                    longitudeDelta: 0.003,
                }}
                scrollEnabled={true}
                zoomEnabled={true}
                style={styles.map}
            >
                {markers.map((marker: any, index: number) => (
                    <Marker
                        key={index}
                        coordinate={{
                            latitude: marker.latitude,
                            longitude: marker.longitude,
                        }}
                        title={marker.title}
                        description={marker.subtitle}
                    ><View style={styles.customMarker} />
                    </Marker>
                ))}
            </MapView>
        </View >
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: 'white',
        width: '100%',
        height: '100%',
    },
    map: {
        width: '100%',
        height: '100%',
    },
    customMarker: {
        width: 30,
        height: 30,
        borderRadius: 15,
        borderWidth: 2,
        borderColor: "blue",
    },
});
