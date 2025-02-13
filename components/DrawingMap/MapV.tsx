import * as Location from 'expo-location';
import { useNavigation } from '@react-navigation/native';
import React, { useRef, useState, useCallback, useEffect, useMemo } from 'react';
import { Button } from 'components/Button/Button';
import { PlainModal } from 'components/Modal/Modal';
import moment from 'moment'
import {
    StyleSheet,
    View,
    Text,
    Animated,
    Dimensions,
    TouchableOpacity,
    Alert,
    LogBox,
} from 'react-native';
import MapView, { Marker, Polygon, Region } from 'react-native-maps';
import { FloatingButton } from 'components/Button/FloatingButton';
import { peopleData } from 'constants/dataExample';
import { AgentCard } from 'components/Card/AgentCard';
import { Ionicons } from '@expo/vector-icons';
import { AddSvg, DrawSvg, MyLocationSvg, UndoSvg } from 'components/svg';
import { getAcronym, hexToRgba } from 'utils/helperFunctions';
import axios from 'axios';
import { CustomMarker } from 'components/Marker/Marker';
import { CoordinateProps } from 'types/componentsTypes';
const { width, height } = Dimensions.get('window');

const ASPECT_RATIO = width / height;
const LATITUDE_DELTA = 0.003;
const LONGITUDE_DELTA = LATITUDE_DELTA * ASPECT_RATIO;
interface DrawingMapProps {
    // canDraw: boolean;
    // stopDrawing: () => void;
    // setCanFinishDrawing: (value: boolean) => void;
    // setShowDrawButton: (value: boolean) => void;
    // showDrawButton: boolean;
}
LogBox.ignoreAllLogs(true);
const PolygonCreator = ({ }: DrawingMapProps) => {
    const [region, setRegion] = useState<Region | null>(null);
    const [polygons, setPolygons] = useState<Array<{
        id: number;
        assignee: any;
        coordinates: Array<{ latitude: number; longitude: number }>;
        buildingMarkers: Array<{ latitude: number; longitude: number }>;
    }>>([]);
    const [editing, setEditing] = useState<{
        id: number;
        coordinates: Array<{ latitude: number; longitude: number }>;
    } | null>(null);
    const [openAssignModal, setOpenAssignModal] = useState<boolean>(false)
    const [selectedAgent, setSelectedAgent] = useState<any>(null)
    const [selectedArea, setSelectedArea] = useState<{
        id: number;
        assignee: any;
        coordinates: Array<{ latitude: number; longitude: number }>;
        buildingMarkers: Array<{ latitude: number; longitude: number }>;
    } | null>(null)
    const [canFinishArea, setCanFinishArea] = useState<boolean>(false)
    const [myLocation, setMyLocation] = useState<CoordinateProps>({} as CoordinateProps)
    const [activeDrawing, setActiveDrawing] = useState(false)
    const [loading, setLoading] = useState(false)
    const [isAtCurrentLocation, setIsAtCurrentLocation] = useState(true);
    const [forceRender, setForceRender] = useState(false);
    const [openManageAreaModal, setOpenManageAreaModal] = useState(false)
    const [isReassignment, setIsReassignment] = useState(false)
    const mapRef = useRef<MapView>(null);

    const buttons = [
        { icon: <AddSvg />, onPress: () => console.log('add') },
        {
            icon: <MyLocationSvg color={isAtCurrentLocation ? "white" : "#1F1F1F"} />,
            onPress: () => handleMyLocation(),
            style: { backgroundColor: isAtCurrentLocation ? "#32A0FF" : "white" }
        },
    ];

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

    const fetchOverpassData = async (polygon: any) => {
        const polygonCoordinates = polygon.coordinates;
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

            const newMarkers = data.map((item: any) => ({
                latitude: item.center?.lat,
                longitude: item.center?.lon,
                title: item.tags?.name || "Unnamed Way",
                subtitle: item.tags?.amenity || "No Amenity",
            }));
            setPolygons((prevPolygons) =>
                prevPolygons.map((p) =>
                    p.id === polygon.id
                        ? { ...p, buildingMarkers: newMarkers }
                        : p
                )
            );

            setLoading(false);
        } catch (error) {
            console.error("Error fetching data: ", error);
            setLoading(false);
        }
    };

    const handleFinish = async () => {
        if (editing) {
            setActiveDrawing(false);
            setOpenAssignModal(true)
        }
    };

    const handleConfirmAndAssignArea = async () => {
        if (editing) {
            const newPolygon = JSON.parse(JSON.stringify(editing));
            setEditing(null)
            await Promise.resolve(setPolygons(prevPolygons => [...prevPolygons, { ...newPolygon, assignee: selectedAgent }])).then(async () => {
                await Promise.resolve(fetchOverpassData({ ...newPolygon, assignee: selectedAgent })).then(() => {
                    setOpenAssignModal(false);
                    setSelectedAgent(null)
                    setCanFinishArea(false)
                }
                )
            })
        }
    }


    const handleConfirmAndReassignArea = async () => {
        if (selectedArea && selectedAgent) {
            try {
                // Update the polygons array with the new assignee
                setPolygons(prevPolygons =>
                    prevPolygons.map(polygon =>
                        polygon.id === selectedArea.id
                            ? { ...polygon, assignee: selectedAgent }
                            : polygon
                    )
                );

                // Close the assign modal
                setOpenAssignModal(false);

                // Reset states
                setSelectedArea(null);
                setSelectedAgent(null);
                setIsReassignment(false);

                // Show success modal or alert
                Alert.alert(
                    "Success",
                    "Area has been successfully reassigned.",
                    [{ text: "OK" }]
                );

            } catch (error) {
                console.error("Error reassigning area:", error);
                Alert.alert("Error", "Failed to reassign the area. Please try again.");
            }
        } else {
            Alert.alert("Error", "Please select an area and an agent to reassign.");
        }
    };

    const handleDeleteArea = async () => {
        if (editing) {
            await Promise.resolve(setEditing(null)).then(() => {
                setOpenAssignModal(false);
                setCanFinishArea(false)
                setSelectedAgent(null)
            })

        }
    }
    const handleDeleteExistingArea = async () => {
        if (selectedArea) {
            setPolygons(prevPolygons => prevPolygons.filter(polygon => polygon.id !== selectedArea.id));
            setSelectedArea(null);
            setOpenManageAreaModal(false);
            Alert.alert("Area Deleted", "The selected area has been successfully deleted.");
        }
    };
    const handleReassignArea = async () => {
        setSelectedAgent(selectedArea?.assignee)
        setIsReassignment(true)
        setOpenManageAreaModal(false)
        setOpenAssignModal(true)
    }
    const handleUndo = useCallback(() => {
        setEditing(prev => {
            if (!prev || prev.coordinates.length === 0) return null;
            const newCoords = [...prev.coordinates];
            newCoords.pop();
            if (newCoords.length < 3) {
                setCanFinishArea(false)
            }
            return { ...prev, coordinates: newCoords };
        });
    }, []);

    const handleMapPress = useCallback((e: any) => {
        const newCoord = e.nativeEvent.coordinate;
        setEditing(prev => {
            if (!prev) {
                return {
                    id: Date.now(),
                    coordinates: [newCoord],
                };
            }
            if ([...prev.coordinates, newCoord]?.length > 2) {
                setCanFinishArea(true);
            }
            const updatedEditing = {
                ...prev,
                coordinates: [...prev.coordinates, newCoord],
            };

            setForceRender(prev => !prev); // Forsira re-render
            return updatedEditing;
        });

    }, []);

    const memoizedPolygons = useMemo(() => {
        return polygons.map(polygon => (
            <Polygon
                key={polygon.id}
                coordinates={polygon.coordinates}
                strokeColor={polygon?.assignee?.color}
                fillColor={hexToRgba(polygon?.assignee?.color, 0.2)}
                strokeWidth={2}
                onPress={async () => await Promise.resolve(setSelectedArea(polygon)).then(() => setOpenManageAreaModal(true))}
            />
        ));
    }, [polygons]);
    const memoizedBuildingMarkers = useMemo(() => {
        return polygons.map(polygon =>
            polygon?.buildingMarkers?.map((marker: any, index) =>
                marker.latitude && marker.longitude ? (
                    <CustomMarker
                        type='building'
                        id={marker?.id}
                        marker={marker}
                    />
                ) : null
            )
        );
    }, [polygons]);
    const editingMarkers = useMemo(() => {
        if (!editing || editing.coordinates.length === 0) return null;
        return editing.coordinates.map((marker, index) =>
            marker.latitude && marker.longitude ? (
                <CustomMarker
                    key={index}
                    type='polygon'
                    id={`1`}
                    marker={{ ...marker, title: `Marker ${index + 1}`, subtitle: `Marker ${index + 1}` }}
                />
            ) : null
        );
    }, [editing, forceRender]);
    const memoizedEditingPolygon = useMemo(() => {
        if (!editing || editing.coordinates.length === 0) return null;
        return (
            <Polygon
                coordinates={editing.coordinates}
                strokeColor="#32A0FF"
                fillColor="rgba(50, 160, 255, 0.2)"
                strokeWidth={2}
                onPress={() => {
                    Alert.alert('Poly pressed' + editing);
                }}
            />
        );
    }, [editing]);
    return (
        <View style={styles.container}>
            <PlainModal
                visible={openAssignModal}
                onClose={() => setOpenAssignModal(false)}
                title={`${isReassignment ? "Reassign" : "Assign"} Area to User`}
                isLoading={loading}
                buttons={
                    < >
                        <Button
                            text='Delete Area'
                            textStyle={{ color: '#CA0105' }}
                            onPress={() => { isReassignment ? handleDeleteExistingArea() : handleDeleteArea() }}
                        />
                        <Button
                            text={`Confirm & ${isReassignment ? "Reassign" : "Assign"}`}
                            buttonStyle={{ backgroundColor: 'black' }}
                            textStyle={{ color: 'white' }}
                            onPress={() => isReassignment ? handleConfirmAndReassignArea() : handleConfirmAndAssignArea()}
                            isDisabled={!selectedAgent}
                        />
                    </>
                }
            >
                <>
                    {peopleData?.map((person) => <AgentCard
                        data={person}
                        setIsSelected={setSelectedAgent}
                        isSelected={selectedAgent?.id === person?.id} />)}
                </>
            </PlainModal>
            <View style={styles.floatingButtonsContainer}>
                {canFinishArea && <Button
                    text='Complete'
                    onPress={handleFinish}
                    buttonStyle={styles.completeButtonStyle}
                    textStyle={styles.buttonTextStyle}
                    startIcon={<Ionicons name="checkmark-circle-outline" size={24} color="black" />}
                />}
                <View style={styles.buttonContainer} >
                    <FloatingButton
                        buttonStyle={{ backgroundColor: activeDrawing ? "#32A0FF" : 'white' }}
                        onPress={() => {
                            setActiveDrawing(!activeDrawing)
                            setCanFinishArea(false)
                        }}
                        buttonIcon={<DrawSvg color={activeDrawing ? 'white' : '#1F1F1F'} />}
                    />
                </View>
                {buttons?.map((btn, index) => (
                    <View style={styles.buttonContainer} key={index}>
                        <FloatingButton
                            key={index}
                            onPress={btn.onPress}
                            buttonIcon={btn.icon}
                            buttonStyle={btn.style}
                        />
                    </View>
                ))}
            </View>
            {editing && <View style={styles.undoButtonContainer}>
                <Button
                    text='Undo'
                    onPress={handleUndo}
                    buttonStyle={styles.completeButtonStyle}
                    textStyle={styles.buttonTextStyle}
                    startIcon={<UndoSvg />}
                />
            </View>}
            <PlainModal
                visible={openManageAreaModal}
                onClose={() => setOpenManageAreaModal(false)}
                title="Manage Area"
                // isLoading={loading}
                buttons={
                    < >
                        <Button
                            text='Delete Area'
                            textStyle={{ color: '#CA0105' }}
                            onPress={() => handleDeleteExistingArea()}
                        />
                        <Button
                            text='Reassign'
                            buttonStyle={{ backgroundColor: 'black', width: 149 }}
                            textStyle={{ color: 'white' }}
                            onPress={() => handleReassignArea()}
                        />
                    </>
                }
            >
                <>
                    <AgentCard
                        data={selectedArea?.assignee}
                        isAssigned={true}
                        setIsSelected={setSelectedAgent} />
                    <View style={styles.textContainer}>
                        <Text style={styles.manageAreaText}>You have assigned this area on{' '}
                            <Text style={styles.boldText}>
                                {moment(new Date()).format('DD.MM.YYYY HH:mm:ss')}.
                            </Text>
                        </Text>
                    </View>
                </>
            </PlainModal>

            {region && <MapView
                style={styles.map}
                ref={mapRef}
                mapType={'satellite'}
                initialRegion={region}
                onPress={(e) => activeDrawing && handleMapPress(e)}
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
                {memoizedPolygons}
                {memoizedBuildingMarkers}
                {memoizedEditingPolygon}
                {editingMarkers}
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
    button: {
        backgroundColor: '#7243FF',
        paddingVertical: 12,
        paddingHorizontal: 20,
        borderRadius: 8,
    },
    buttonText: {
        color: 'white',
        fontWeight: '500',
    },

    completeButtonStyle: {
        backgroundColor: 'white',
        borderRadius: 16,
        paddingVertical: 6,
        height: 34,
        width: 113,
        marginBottom: 24
    },
    buttonTextStyle: {
        marginLeft: 4
    },
    floatingButtonsContainer: {
        flexDirection: 'column',
        position: 'absolute',
        bottom: 70,
        right: 26,
        zIndex: 10,
        alignItems: 'flex-end',
    },
    undoButtonContainer: {
        position: 'absolute',
        bottom: 70,
        left: 25,
        zIndex: 10,
        alignItems: 'flex-end',
    },
    buttonContainer: {
        marginBottom: 24,
        alignItems: 'flex-end',
    },
    textContainer: {
        paddingVertical: 24
    },
    manageAreaText: {
        fontSize: 12,
        fontWeight: '400',
        color: 'black'
    },
    boldText: {
        fontWeight: 600
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

export default PolygonCreator;