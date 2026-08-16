import React, { useRef, useState, useCallback, useEffect, useMemo } from 'react';
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

import MapView, { Marker, Polygon, Region } from 'react-native-maps';
import { AddHouse, MyLocationSvg } from 'components/svg';
import { getAcronym, hexToRgba } from 'utils/helperFunctions';
import { CustomMarker } from 'components/Marker/Marker';
import { AssigneeMapLabel } from 'components/DrawingMap/AssigneeMapLabel';
import { UnassignedMapLabel } from 'components/DrawingMap/UnassignedMapLabel';
import { BuildingProps, CoordinateProps, LeadStatus } from 'types/componentsTypes';
import FloatingButtons from './FloatingButtons';
import { AssignAreaModal } from './AssignAreaModal';
import { ManageAreaModal } from './ManageAreaModal';
import { QuickHouseOverviewModal } from './QuickHouseOverviewModal';
import { DetailedHouseOverviewModal } from './DetailedHouseOverviewModal';
import { CustomAlert } from 'components/Alert/Alert';
import { useSession } from 'context/AuthenticationContext';
import { assignMapAreaRep, createMapArea, createMapHouseFromBuilding, createMapHouseStatus, deleteMapArea, fetchMapAreas, fetchMapHouseDetail, fetchMapHouses, MapBuildingResponse, updateMapHouseNotes } from 'services/area-api';
import { useMapBuildings } from 'hooks/useMapBuildings';
import { useMapHousesViewport } from 'hooks/useMapHousesViewport';
import { convertMapHousesToBuildings } from 'utils/convert-map-houses-to-buildings';
import { convertMapHouseDetailToHouse } from 'utils/convert-map-house-detail-to-house';
import { pickFootprintColors } from 'utils/pick-footprint-colors';
import { getApiErrorMessage } from 'utils/get-api-error-message';
import { createFieldLead, updateFieldLeadInfo } from 'services/leads-api';
import { convertCoordinatesToGeoJsonPolygon } from 'utils/convert-coordinates-to-geojson';
import { convertMapAreasToPolygons } from 'utils/convert-map-areas-to-polygons';
import { applyMapHouseDetailToBuilding } from 'utils/apply-map-house-detail-to-building';
import { getPolygonCentroid } from 'utils/get-polygon-centroid';
import { mapLeadStatusIdToHouseStatus } from 'utils/map-house-status';

const { width, height } = Dimensions.get('window');
const ASPECT_RATIO = width / height;
const LATITUDE_DELTA = 0.003;
const LONGITUDE_DELTA = LATITUDE_DELTA * ASPECT_RATIO;
const UNASSIGNED_AREA_STROKE = '#8B8682';
const UNASSIGNED_AREA_FILL = 'rgba(161, 161, 170, 0.32)';
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
    const displayName = `${session?.user?.firstName ?? ''} ${session?.user?.lastName ?? ''}`.trim() || 'You';
    const [region, setRegion] = useState<Region | null>(null);
    const [viewportRegion, setViewportRegion] = useState<Region | null>(null);
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
    const mapBuildings = useMapBuildings({
        region: viewportRegion ?? region,
        isEnabled: Boolean(session?.token) && !activeDrawing,
    });
    const areaIds = useMemo(() => polygons.map((polygon) => polygon.id), [polygons]);
    const { houses: viewportHouses, replaceHouse } = useMapHousesViewport({
        region: viewportRegion ?? region,
        areaIds,
        isEnabled: Boolean(session?.token) && !activeDrawing,
    });


    const isSavingRoofRef = useRef(false);


    // TODO

    // The code is not the cleanest due to mocked data (APIs are still missing), so ignore that for now.
    // There's a lot of local state because it's currently the easiest way to store data.
    // Implement a simulation of 'onLongPress' instead of 'onPress' in memoizedPolygons.
    // Note: The Polygon object only has an 'onPress' prop and does not support 'onLongPress', 'onPressIn', or 'onPressOut'.


    const openManageArea = (polygon: (typeof polygons)[number]) => {
        if (activeDrawing) {
            return;
        }
        setSelectedArea(polygon);
        setOpenManageAreaModal(true);
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
            setViewportRegion(initialRegion);
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

    const loadFieldData = async () => {
        const areas = await fetchMapAreas();
        const houses = await fetchMapHouses(areas.map((area) => area.id));
        setPolygons(convertMapAreasToPolygons(areas, houses));
    };

    useEffect(() => {
        if (!session?.token) {
            return;
        }
        loadFieldData().catch(() => {
            Alert.alert('Could not load areas', 'Check login and EXPO_PUBLIC_API_URL.');
        });
    }, [session?.token]);

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
        setViewportRegion(newRegion);
        setIsAtCurrentLocation(true);

    };

    const handleRegionChangeComplete = (newRegion: Region) => {
        setViewportRegion(newRegion);
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

    const handleBuildingPress = (building: BuildingProps) => {
        setSelectedBuilding(building);
        setOpenDetailedHouseModal(true);
        fetchMapHouseDetail(Number(building.id))
            .then((detail) => {
                setSelectedBuilding(applyMapHouseDetailToBuilding(building, detail));
            })
            .catch(() => undefined);
    };

    const saveHouseKnockStatus = async (building: BuildingProps, status: LeadStatus) => {
        const detail = await createMapHouseStatus({
            houseId: Number(building.id),
            status: mapLeadStatusIdToHouseStatus(status.statusId),
            notes: building.additionalDetails?.note,
        });
        const updatedBuilding = applyMapHouseDetailToBuilding(building, detail);
        setPolygons(prevPolygons =>
            prevPolygons.map(polygon => ({
                ...polygon,
                buildingMarkers: polygon.buildingMarkers?.map((marker: BuildingProps) =>
                    marker.id === building.id ? updatedBuilding : marker
                )
            }))
        );
        setSelectedBuilding(updatedBuilding);
        replaceHouse(convertMapHouseDetailToHouse(detail, building.additionalDetails?.externalId ?? null));
    };

    const handleBuildingLongPress = (building: BuildingProps) => {
        setSelectedBuilding(building);
        setOpenQuickStatusModal(true);
    };

    const handleFootprintPress = async (building: MapBuildingResponse) => {
        if (activeDrawing || isSavingRoofRef.current) {
            return;
        }
        const existing = viewportHouses.find((house) => house.externalId === building.id);
        if (existing) {
            handleBuildingPress(convertMapHousesToBuildings([existing])[0]);
            return;
        }
        isSavingRoofRef.current = true;
        try {
            const detail = await createMapHouseFromBuilding({
                overtureBuildingId: building.id,
                roofLat: building.roofLat,
                roofLng: building.roofLng,
            });
            replaceHouse(convertMapHouseDetailToHouse(detail, building.id));
            const stub: BuildingProps = {
                id: detail.id,
                latitude: detail.latitude,
                longitude: detail.longitude,
                address: detail.address ?? 'Unknown Address',
            };
            handleBuildingPress(applyMapHouseDetailToBuilding(stub, detail));
        } catch (error) {
            Alert.alert('Could not open house', getApiErrorMessage(error, 'The roof was not saved. Check login and try again.'));
        } finally {
            isSavingRoofRef.current = false;
        }
    };

    const handleFinish = async () => {
        if (!editing) {
            return;
        }
        if (!session?.user?.salesOrgId || !session?.user?.officeId) {
            Alert.alert('Missing office', 'Set a current office on this user in Radiabase, then try again.');
            return;
        }
        try {
            setLoading(true);
            setActiveDrawing(false);
            await createMapArea({
                officeId: session.user.officeId,
                salesOrgId: session.user.salesOrgId,
                boundary: convertCoordinatesToGeoJsonPolygon(editing.coordinates),
            });
            setEditing(null);
            setCanFinishArea(false);
            await loadFieldData();
            setMessage('Area is Created Successfully!');
            setAlertVisible(true);
        } catch (error) {
            console.error("Error creating area:", error);
            setMessage('Failed to create area. Please try again.');
            setAlertVisible(true);
        } finally {
            setLoading(false);
        }
    };

    const handleConfirmAndReassignArea = async () => {
        if (!selectedArea || !selectedAgent) {
            Alert.alert("Error", "Please select an area and an agent to reassign.");
            return;
        }
        try {
            await assignMapAreaRep({ areaId: selectedArea.id, repId: selectedAgent.id });
            setPolygons((prevPolygons) =>
                prevPolygons.map((polygon) =>
                    polygon.id === selectedArea.id ? { ...polygon, assignee: selectedAgent } : polygon
                )
            );
            await loadFieldData();
            setOpenAssignModal(false);
            setSelectedArea(null);
            setSelectedAgent(null);
            setIsReassignment(false);
            setMessage('Area is Reassigned Successfully!');
            setAlertVisible(true);
        } catch (error) {
            console.error("Error reassigning area:", error);
            Alert.alert("Error", "Failed to reassign the area. Please try again.");
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
        if (!selectedArea) {
            return;
        }
        try {
            await deleteMapArea(selectedArea.id);
            await loadFieldData();
            setSelectedArea(null);
            setIsReassignment(false);
            setOpenManageAreaModal(false);
        } catch (error) {
            Alert.alert(
                'Could not delete area',
                getApiErrorMessage(error, 'Only managers can delete areas, or the API is unreachable.'),
            );
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
    const hasFootprints = mapBuildings.length > 0;
    const memoizedPolygons = useMemo(() => {
        return polygons.map(polygon => (
            <Polygon
                key={polygon.id}
                coordinates={polygon.coordinates}
                strokeColor={polygon?.assignee ? polygon?.assignee?.color : UNASSIGNED_AREA_STROKE}
                fillColor={polygon?.assignee ? hexToRgba(polygon?.assignee?.color, 0.2) : UNASSIGNED_AREA_FILL}
                strokeWidth={2}
                tappable={!activeDrawing}
                zIndex={1}
                onPress={() => openManageArea(polygon)}
            />
        ));
    }, [activeDrawing, polygons]);
    const memoizedFootprints = useMemo(() => {
        const houseByExternalId = new Map(
            viewportHouses
                .filter((house) => house.externalId)
                .map((house) => [house.externalId as string, house]),
        );
        return mapBuildings.map((building) => {
            const colors = pickFootprintColors(houseByExternalId.get(building.id)?.currentStatus);
            return (
                <Polygon
                    key={building.id}
                    coordinates={building.coordinates}
                    strokeColor={colors.strokeColor}
                    fillColor={colors.fillColor}
                    strokeWidth={1}
                    tappable={!activeDrawing}
                    zIndex={2}
                    onPress={() => {
                        handleFootprintPress(building).catch(() => undefined);
                    }}
                />
            );
        });
    }, [activeDrawing, mapBuildings, viewportHouses]);
    const memoizedAssigneeLabels = useMemo(() => {
        return polygons.flatMap((polygon) => {
            const centroid = getPolygonCentroid(polygon.coordinates);
            if (!centroid) {
                return [];
            }
            if (!polygon.assignee) {
                return (
                    <UnassignedMapLabel
                        key={`unassigned-${polygon.id}`}
                        areaId={polygon.id}
                        latitude={centroid.latitude}
                        longitude={centroid.longitude}
                        onPress={activeDrawing ? undefined : () => openManageArea(polygon)}
                    />
                );
            }
            return (
                <AssigneeMapLabel
                    key={`assignee-${polygon.id}-${polygon.assignee.id}`}
                    areaId={polygon.id}
                    latitude={centroid.latitude}
                    longitude={centroid.longitude}
                    name={polygon.assignee.name}
                    lastname={polygon.assignee.lastname}
                    imageUrl={polygon.assignee.avatarUrl}
                    color={polygon.assignee.color}
                    onPress={activeDrawing ? undefined : () => openManageArea(polygon)}
                />
            );
        });
    }, [activeDrawing, polygons]);
    const memoizedBuildingMarkers = useMemo(() => {
        const markers = hasFootprints
            ? convertMapHousesToBuildings(viewportHouses)
            : polygons.flatMap((polygon) => polygon.buildingMarkers ?? []);
        return markers.map((marker) =>
            marker.latitude && marker.longitude ? (
                <CustomMarker
                    type='building'
                    id={marker.id}
                    key={marker.id}
                    marker={marker}
                    onClick={() => handleBuildingPress(marker)}
                    onLongPress={() => handleBuildingLongPress(marker)}
                />
            ) : null
        );
    }, [hasFootprints, polygons, viewportHouses]);

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
                showUndoButton={!!editing && editing?.coordinates?.length > 0}
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
                officeId={session?.user?.officeId ?? null}
                onConfirmAndAssign={() => handleConfirmAndReassignArea()}
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
                onEditArea={() => {
                    Alert.alert('Edit area', 'Moving turf points is not available yet.');
                }}
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
                onChangeHouseStatus={async (status: LeadStatus) => {
                    if (!selectedBuilding) {
                        return;
                    }
                    try {
                        await saveHouseKnockStatus(selectedBuilding, status);
                        setOpenQuickStatusModal(false);
                    } catch (error) {
                        Alert.alert('Could not update status', getApiErrorMessage(error, 'The knock was not saved to the API.'));
                    }
                }}
            />
            <DetailedHouseOverviewModal
                onClose={() => setOpenDetailedHouseModal(false)}
                visible={openDetailedHouseModal}
                selectedHouse={selectedBuilding}
                onChangeHouseStatus={async (status: LeadStatus) => {
                    if (!selectedBuilding) {
                        return;
                    }
                    try {
                        await saveHouseKnockStatus(selectedBuilding, status);
                    } catch (error) {
                        Alert.alert('Could not update status', getApiErrorMessage(error, 'The knock was not saved to the API.'));
                    }
                }}
                onSaveNotes={async (note: string) => {
                    if (!selectedBuilding) {
                        return;
                    }
                    try {
                        const detail = await updateMapHouseNotes({
                            houseId: Number(selectedBuilding.id),
                            notes: note,
                        });
                        setSelectedBuilding(applyMapHouseDetailToBuilding(selectedBuilding, detail));
                    } catch (error) {
                        Alert.alert('Could not save note', getApiErrorMessage(error, 'The note was not saved.'));
                    }
                }}
                onSaveHomeowner={async (updatedHouse: BuildingProps) => {
                    setSelectedBuilding(updatedHouse);
                    const leadId = updatedHouse.additionalDetails?.leadId;
                    if (!leadId) {
                        return;
                    }
                    try {
                        await updateFieldLeadInfo({
                            leadId: Number(leadId),
                            firstName: updatedHouse.assignee?.name,
                            lastName: updatedHouse.assignee?.lastname,
                            phone: updatedHouse.assignee?.phone,
                            email: updatedHouse.assignee?.email,
                        });
                    } catch (error) {
                        Alert.alert('Could not save homeowner', getApiErrorMessage(error, 'The contact was not saved.'));
                    }
                }}
                onSendCard={async (updatedHouse) => {
                    if (!session?.user) {
                        Alert.alert('Not signed in', 'Log in again, then submit the lead.');
                        return;
                    }
                    try {
                        const leadId = updatedHouse.additionalDetails?.leadId;
                        if (leadId) {
                            await updateFieldLeadInfo({
                                leadId: Number(leadId),
                                firstName: updatedHouse.assignee?.name,
                                lastName: updatedHouse.assignee?.lastname,
                                phone: updatedHouse.assignee?.phone,
                                email: updatedHouse.assignee?.email,
                            });
                        } else {
                            await createFieldLead({
                                user: session.user,
                                houseId: Number(updatedHouse.id),
                                firstName: updatedHouse.assignee?.name ?? '',
                                lastName: updatedHouse.assignee?.lastname ?? '',
                                phone: updatedHouse.assignee?.phone,
                                email: updatedHouse.assignee?.email,
                                notes: updatedHouse.additionalDetails?.note,
                                address: updatedHouse.address,
                                city: updatedHouse.additionalDetails?.city,
                                state: updatedHouse.additionalDetails?.state,
                                zip: updatedHouse.additionalDetails?.zip,
                                latitude: updatedHouse.latitude,
                                longitude: updatedHouse.longitude,
                                statusId: updatedHouse.statusId,
                            });
                        }
                        setOpenDetailedHouseModal(false);
                        setMessage(leadId ? 'Lead updated in Radiabase.' : 'Lead sent to Radiabase.');
                        setAlertVisible(true);
                    } catch (error) {
                        Alert.alert('Could not send lead', error instanceof Error ? error.message : 'Check the API and try again.');
                    }
                }}
            />
            {loading && (
                <View style={styles.loaderContainer}>
                    <ActivityIndicator size="large" color="#32A0FF" />
                    <Text style={styles.loaderText}>Creating area...</Text>
                </View>
            )}
            {region && <MapView
                style={styles.map}
                ref={mapRef}
                mapType={mapType}
                initialRegion={region}
                rotateEnabled={false}
                pitchEnabled={false}
                zoomEnabled
                scrollEnabled
                moveOnMarkerPress={false}
                onPress={(e) => activeDrawing && handleMapPress(e)}
                onRegionChangeComplete={handleRegionChangeComplete}
            >
                {myLocation && (
                    <Marker
                        key="my-location-marker"
                        coordinate={{ latitude: myLocation.latitude, longitude: myLocation.longitude }}
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
                )}
                {memoizedPolygons}
                {memoizedFootprints}
                {memoizedAssigneeLabels}
                {memoizedBuildingMarkers}
                {memoizedEditingPolygon}
                {editingMarkers}
            </MapView>}
            {hasFootprints && (
                <Text style={styles.buildingAttribution} pointerEvents="none">
                    Buildings © Overture Maps / OSM contributors
                </Text>
            )}
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
    buildingAttribution: {
        position: 'absolute',
        bottom: 8,
        left: 8,
        right: 8,
        color: 'white',
        fontSize: 10,
        textShadowColor: 'rgba(0, 0, 0, 0.8)',
        textShadowOffset: { width: 0, height: 1 },
        textShadowRadius: 2,
        zIndex: 7,
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
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 10
    },
    loaderBox: {
        backgroundColor: 'white',
        padding: 20,
        borderRadius: 10,
        alignItems: 'center',
        justifyContent: 'center',
    },
    loaderText: {
        marginTop: 10,
        fontSize: 16,
        fontWeight: 'bold',
        color: 'white'
    }
});

export default PolygonCreator;