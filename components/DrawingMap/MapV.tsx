import React, { useRef, useState, useCallback, useEffect, useMemo } from 'react';
import * as Location from 'expo-location';
import {
    StyleSheet,
    View,
    Text,
    Dimensions,
    Alert,
    LogBox,
} from 'react-native';
import MapView, { Marker, Polygon, Region } from 'react-native-maps';
import { peopleData } from 'constants/dataExample';
import { AddSvg, MyLocationSvg } from 'components/svg';
import { getAcronym, hexToRgba } from 'utils/helperFunctions';
import axios from 'axios';
import { CustomMarker } from 'components/Marker/Marker';
import { BuildingProps, CoordinateProps, LeadStatus } from 'types/componentsTypes';
import FloatingButtons from './FloatingButtons';
import { AssignAreaModal } from './AssignAreaModal';
import { ManageAreaModal } from './ManageAreaModal';
import { QuickHouseOverviewModal } from './QuickHouseOverviewModal';

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
        buildingMarkers: Array<BuildingProps>;
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
    const [selectedBuilding, setSelectedBuilding] = useState<any | null>(null);
    const [isReassignment, setIsReassignment] = useState(false)
    const [openQuickStatusModal, setOpenQuickStatusModal] = useState<boolean>(false)
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

    const handleDeletePin = useCallback(() => {
        if (selectedBuilding) {
            setPolygons(prevPolygons =>
                prevPolygons.map(polygon => ({
                    ...polygon,
                    buildingMarkers: polygon.buildingMarkers?.filter(
                        (building: BuildingProps) => building.id !== selectedBuilding.id
                    )
                }))
            );
            setSelectedBuilding(null);
            setOpenQuickStatusModal(false);
        }
    }, [selectedBuilding]);

    const handleBuildingPress = (building: any) => {
        setSelectedBuilding(building);
        // You can add more logic here, such as opening a modal
        Alert.alert("Building Selected", `${building.title}\n${building.subtitle}`);
    };

    const handleBuildingLongPress = (building: any) => {
        setSelectedBuilding(building);
        setOpenQuickStatusModal(true);
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
                id: item.id || `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
                latitude: item.center?.lat,
                longitude: item.center?.lon,
                title: item.tags?.name || "Unnamed Way",
                subtitle: item.tags?.amenity || "No Amenity",
                address: item.tags?.["addr:street"] ? `${item.tags["addr:housenumber"] || ''} ${item.tags["addr:street"]}` : "Unknown Address",
                statusId: 0,
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
                        key={marker?.id}
                        marker={marker}
                        onClick={() => handleBuildingPress(marker)}
                        onLongPress={() => handleBuildingLongPress(marker)}
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
                    marker={{ ...marker, id: index, title: `Marker ${index + 1}`, subtitle: `Marker ${index + 1},` }}
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
            <FloatingButtons
                buttons={[
                    { icon: <AddSvg />, onPress: () => console.log('add') },
                    {
                        icon: <MyLocationSvg color={isAtCurrentLocation ? "white" : "#1F1F1F"} />,
                        onPress: handleMyLocation,
                        style: { backgroundColor: isAtCurrentLocation ? "#32A0FF" : "white" }
                    },
                ]}
                canFinishArea={canFinishArea}
                onFinish={handleFinish}
                activeDrawing={activeDrawing}
                onToggleDrawing={() => {
                    setActiveDrawing(!activeDrawing);
                    setCanFinishArea(false);
                }}
                showUndoButton={!!editing}
                onUndo={handleUndo}
            />
            <AssignAreaModal
                visible={openAssignModal}
                onClose={() => setOpenAssignModal(false)}
                isReassignment={isReassignment}
                loading={loading}
                selectedAgent={selectedAgent}
                setSelectedAgent={setSelectedAgent}
                onDeleteArea={() => isReassignment ? handleDeleteExistingArea() : handleDeleteArea()}
                onConfirmAndAssign={() => isReassignment ? handleConfirmAndReassignArea() : handleConfirmAndAssignArea()}
                peopleData={peopleData}
            />
            <ManageAreaModal
                visible={openManageAreaModal}
                onClose={() => setOpenManageAreaModal(false)}
                selectedArea={selectedArea}
                setSelectedAgent={setSelectedAgent}
                onDeleteArea={handleDeleteExistingArea}
                onReassignArea={handleReassignArea}
            />
            <QuickHouseOverviewModal
                onClose={() => setOpenQuickStatusModal(false)}
                visible={openQuickStatusModal}
                selectedHouse={selectedBuilding}
                onDeletePin={handleDeletePin}
                onOpenHouseInfo={() => console.log('open')}
                onChangeHouseStatus={(status: LeadStatus) => {
                    if (selectedBuilding) {
                        setPolygons(prevPolygons =>
                            prevPolygons.map(polygon => ({
                                ...polygon,
                                buildingMarkers: polygon.buildingMarkers?.map((building: BuildingProps) =>
                                    building.id === selectedBuilding.id
                                        ? { ...building, statusId: status.statusId }
                                        : building
                                )
                            }))
                        );
                        setSelectedBuilding((prevBuilding: BuildingProps) =>
                            prevBuilding ? { ...prevBuilding, statusId: status.statusId } : null
                        );
                        setOpenQuickStatusModal(false);
                        Alert.alert("Status Updated", `House status has been updated to ${status.fullName}.`);
                    }
                }}
            />
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