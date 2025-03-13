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
import { debounce } from 'lodash';

import MapView, { Marker, Polygon, Region } from 'react-native-maps';
import { peopleData } from 'constants/dataExample';
import { AddHouse, MyLocationSvg } from 'components/svg';
import { getAcronym, hexToRgba } from 'utils/helperFunctions';
import { CustomMarker } from 'components/Marker/Marker';
import { BuildingProps, CoordinateProps, LeadStatus } from 'types/componentsTypes';
import FloatingButtons from './FloatingButtons';
import { AssignAreaModal } from './AssignAreaModal';
import { ManageAreaModal } from './ManageAreaModal';
import { QuickHouseOverviewModal } from './QuickHouseOverviewModal';
import { DetailedHouseOverviewModal } from './DetailedHouseOverviewModal';
import { CustomAlert } from 'components/Alert/Alert';
import { useSession } from 'context/AuthenticationContext';
import { fetchOverpassData } from 'services/overpassApi';

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
    const { session } = useSession()
    const isManager = session?.user?.role === 'manager';
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
    const [openDetailedHouseModal, setOpenDetailedHouseModal] = useState<boolean>(false)
    const [alertVisible, setAlertVisible] = useState<boolean>(false)
    const [deleteType, setDeleteType] = useState<'house' | 'area' | null>(null)
    const [message, setMessage] = useState<string>('')
    const [mapType, setMapType] = useState<'satellite' | 'standard'>('satellite');
    const mapRef = useRef<MapView>(null);


    const timeoutRef = useRef<NodeJS.Timeout | null>(null);


    // TODO

    // The code is not the cleanest due to mocked data (APIs are still missing), so ignore that for now.
    // There's a lot of local state because it's currently the easiest way to store data.
    // Implement a simulation of 'onLongPress' instead of 'onPress' in memoizedPolygons.
    // Note: The Polygon object only has an 'onPress' prop and does not support 'onLongPress', 'onPressIn', or 'onPressOut'.


    const handlePolygonPress = () => {
        timeoutRef.current = setTimeout(() => {

        }, 1000);
    };


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
        setOpenDetailedHouseModal(true);
    };

    const handleBuildingLongPress = (building: any) => {
        setSelectedBuilding(building);
        setOpenQuickStatusModal(true);
    };
    const handleFetchOverpassData = async (polygon: any) => {
        try {
            setLoading(true);
            const newMarkers = await fetchOverpassData(polygon);
            setPolygons((prevPolygons: any) =>
                prevPolygons.map((p: any) =>
                    p.id === polygon.id
                        ? { ...p, buildingMarkers: newMarkers }
                        : p
                )
            );
        } catch (error: any) {
            Alert.alert("Error", error.message);
        } finally {
            setLoading(false);
        }
    };

    const handleFinish = async () => {
        if (editing) {
            setActiveDrawing(false);
            const newPolygon = JSON.parse(JSON.stringify(editing));
            setEditing(null)
            await Promise.resolve(setPolygons(prevPolygons => [...prevPolygons, { ...newPolygon, assignee: null }])).then(async () => {
                await Promise.resolve(handleFetchOverpassData({ ...newPolygon })).then(() => {
                    setCanFinishArea(false)
                    setMessage('Area is Created Successfully!');
                    setAlertVisible(true);
                }
                )
            })
            // setOpenAssignModal(true)
        }
    };

    const handleConfirmAndReassignArea = async () => {
        if (selectedArea && selectedAgent) {
            try {
                // Update the polygons array with the new assignee
                setPolygons(prevPolygons =>
                    prevPolygons.map(polygon =>
                        polygon.id === selectedArea.id
                            ? {
                                ...polygon, assignee: selectedAgent,
                                buildingMarkers: polygon?.buildingMarkers?.map(building => ({
                                    ...building,
                                    assignee: selectedAgent
                                }))
                            }
                            : polygon
                    )
                );

                // Close the assign modal
                setOpenAssignModal(false);
                // Reset states
                setSelectedArea(null);
                setSelectedAgent(null);
                setIsReassignment(false);
                setMessage('Area is Reassigned Successfully!');
                setAlertVisible(true);

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
            setIsReassignment(false);
            setOpenManageAreaModal(false);
        }
    };
    const handleReassignArea = async () => {
        setSelectedAgent(selectedArea?.assignee || null)
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


    const debouncedSetEditing = useCallback(
        debounce((newCoordinates) => {
            setEditing(prev => {
                if (!prev) return null;
                return { ...prev, coordinates: newCoordinates };
            });
        }, 16), // 16ms debounce, which is roughly 60fps
        []
    );
    const handleMarkerDragEnd = useCallback((e: any, index: number) => {
        const { latitude, longitude } = e.nativeEvent.coordinate;
        setEditing(prev => {
            if (!prev) return null;
            const newCoordinates = [...prev.coordinates];
            newCoordinates[index] = { latitude, longitude };
            debouncedSetEditing(newCoordinates);
            return prev; // Return the previous state to avoid unnecessary re-renders
        });
    }, [debouncedSetEditing]);

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
            // <TouchableOpacity
            //     onLongPress={async () => await Promise.resolve(setSelectedArea(polygon)).then(() => setOpenManageAreaModal(true))}
            // >
            <Polygon
                key={polygon.id}
                coordinates={polygon.coordinates}
                strokeColor={polygon?.assignee ? polygon?.assignee?.color : '#32A0FF'}
                fillColor={polygon?.assignee ? hexToRgba(polygon?.assignee?.color, 0.2) : 'rgba(50, 160, 255, 0.2)'}
                strokeWidth={2}
                onPress={async () => {

                    await Promise.resolve(setSelectedArea(polygon)).then(() => setOpenManageAreaModal(true))
                }}
            />
            // </TouchableOpacity>
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
                    id={`${index}`}
                    marker={{
                        ...marker,
                        id: index,
                        title: `Marker ${index + 1}`,
                        subtitle: `Marker ${index + 1}`
                    }}
                    draggable={true}
                    onDragEnd={(e: any) => handleMarkerDragEnd(e, index)}
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
                    console.log('first')
                }}
            />
        );
    }, [editing]);
    return (
        <View style={styles.container}>
            <FloatingButtons
                buttons={[
                    ...(polygons.length > 0 ? [{ icon: <AddHouse />, onPress: () => console.log('add') }] : []),
                    {
                        icon: <MyLocationSvg color={isAtCurrentLocation ? "white" : "#1F1F1F"} />,
                        onPress: handleMyLocation,
                        style: { backgroundColor: isAtCurrentLocation ? "#32A0FF" : "white" }
                    },
                ]}
                setMapType={setMapType}
                mapType={mapType}
                canFinishArea={canFinishArea}
                onFinish={handleFinish}
                activeDrawing={activeDrawing}
                onToggleDrawing={() => {
                    setActiveDrawing(!activeDrawing);
                    setCanFinishArea(false);
                }}
                isManager={isManager}
                showUndoButton={!!editing}
                onUndo={handleUndo}
            />
            <CustomAlert
                visible={alertVisible}
                onDismiss={() => {
                    setAlertVisible(false)
                    setDeleteType(null)
                }}
                type={deleteType ? 'confirm' : 'success'}
                onConfirm={() => {
                    if (deleteType === 'area') {
                        if (isReassignment) {
                            handleDeleteExistingArea()
                        }
                        else {
                            handleDeleteArea()
                        }
                    }
                    else {
                        handleDeletePin()
                    }
                    setDeleteType(null)
                    setAlertVisible(false)
                }}
                message={message}
            />
            <AssignAreaModal
                visible={openAssignModal}
                onClose={() => setOpenAssignModal(false)}
                isReassignment={isReassignment}
                loading={loading}
                selectedAgent={selectedAgent}
                setSelectedAgent={setSelectedAgent}
                onDeleteArea={() => {
                    setMessage('Area is Deleted!')
                    setOpenAssignModal(false)
                    setDeleteType('area')
                    setAlertVisible(true)
                }}
                hasNoAssignee={!selectedArea?.assignee}
                onConfirmAndAssign={() => handleConfirmAndReassignArea()}
                peopleData={peopleData}
            />
            <ManageAreaModal
                visible={openManageAreaModal}
                onClose={() => setOpenManageAreaModal(false)}
                selectedArea={selectedArea}
                setSelectedAgent={setSelectedAgent}
                onDeleteArea={() => {
                    setIsReassignment(true)
                    setOpenManageAreaModal(false)
                    setDeleteType('area')
                    setMessage('Area is Deleted!')
                    setAlertVisible(true)
                }}
                onReassignArea={handleReassignArea}
            />
            <QuickHouseOverviewModal
                onClose={() => setOpenQuickStatusModal(false)}
                visible={openQuickStatusModal}
                selectedHouse={selectedBuilding}
                onDeletePin={() => {
                    setOpenQuickStatusModal(false)
                    setDeleteType('house')
                    setMessage('House is Deleted!')
                    setAlertVisible(true)
                }}
                onOpenHouseInfo={() => {
                    setOpenDetailedHouseModal(true)
                    setOpenQuickStatusModal(false)
                }}
                onChangeHouseStatus={(status: LeadStatus) => {
                    if (selectedBuilding) {
                        setPolygons(prevPolygons =>
                            prevPolygons.map(polygon => ({
                                ...polygon,
                                buildingMarkers: polygon.buildingMarkers?.map((building: BuildingProps) =>
                                    building.id === selectedBuilding.id
                                        ? {
                                            ...building,
                                            statusId: status.statusId,
                                            statuses: [...(building?.statuses || []), status.statusId]
                                        }
                                        : building
                                )
                            }))
                        );
                        setSelectedBuilding((prevBuilding: BuildingProps) =>
                            prevBuilding ? { ...prevBuilding, statusId: status.statusId, statuses: [...(prevBuilding?.statuses || []), status.statusId] } : null
                        );
                        setOpenQuickStatusModal(false);
                        setMessage("House Status Updated Successfully!");
                        setAlertVisible(true);
                    }
                }}
            />
            <DetailedHouseOverviewModal
                onClose={() => setOpenDetailedHouseModal(false)}
                visible={openDetailedHouseModal}
                selectedHouse={selectedBuilding}
                onSaveAndClose={(updatedHouse) => {
                    setSelectedBuilding(updatedHouse)
                    setPolygons((prevPolygons: any) =>
                        prevPolygons.map((polygon: any) => ({
                            ...polygon,
                            buildingMarkers: polygon.buildingMarkers?.map((building: BuildingProps) =>
                                building.id === updatedHouse.id
                                    ? {
                                        ...building,
                                        ...updatedHouse,
                                        statuses: [...(building?.statuses || []), updatedHouse.statusId].filter((v, i, a) => a.indexOf(v) === i)
                                    }
                                    : building
                            )
                        }))
                    );
                    setOpenDetailedHouseModal(false)
                }}
                onSaveAndSend={() => setOpenDetailedHouseModal(false)}
            />
            {region && <MapView
                style={styles.map}
                ref={mapRef}
                mapType={mapType}
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