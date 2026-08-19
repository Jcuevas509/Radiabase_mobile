import React, { useRef, useState, useCallback, useEffect, useMemo } from 'react';
import * as Location from 'expo-location';
import {
    StyleSheet,
    View,
    Text,
    Dimensions,
    Alert,
    ActivityIndicator,
    Linking,
    Platform,
    Pressable,
} from 'react-native';
import { useIsFocused } from '@react-navigation/native';

import MapView, { MapPressEvent, Marker, Polygon, Region } from 'react-native-maps';
import { MyLocationSvg } from 'components/svg';
import { getAcronym, hexToRgba } from 'utils/helperFunctions';
import { BuildingProps, CoordinateProps, LeadStatus } from 'types/componentsTypes';
import FloatingButtons from './FloatingButtons';
import { AssignAreaModal } from './AssignAreaModal';
import { ManageAreaModal } from './ManageAreaModal';
import { QuickHouseOverviewModal } from './QuickHouseOverviewModal';
import { DetailedHouseOverviewModal } from './DetailedHouseOverviewModal';
import { SubmitLeadFromHouseModal } from './SubmitLeadFromHouseModal';
import { CustomAlert } from 'components/Alert/Alert';
import { useSession } from 'context/AuthenticationContext';
import { assignMapAreaRep, createMapArea, createMapHouseFromBuilding, createMapHouseStatus, deleteMapArea, fetchMapAreas, fetchMapHouseDetail, fetchMapHouses, MapBuildingResponse, updateMapHouseNotes } from 'services/area-api';
import { useMapBuildings } from 'hooks/useMapBuildings';
import { useMapHousesViewport } from 'hooks/useMapHousesViewport';
import { useAppIsActive } from 'hooks/useAppIsActive';
import { useLiveForegroundLocation } from 'hooks/useLiveForegroundLocation';
import { getUserScopeKey } from 'utils/get-user-scope-key';
import { convertMapHousesToBuildings } from 'utils/convert-map-houses-to-buildings';
import { convertMapHouseDetailToHouse } from 'utils/convert-map-house-detail-to-house';
import { getApiErrorMessage } from 'utils/get-api-error-message';
import { updateFieldLeadInfo } from 'services/leads-api';
import { convertCoordinatesToGeoJsonPolygon } from 'utils/convert-coordinates-to-geojson';
import { convertMapAreasToPolygons } from 'utils/convert-map-areas-to-polygons';
import { applyMapHouseDetailToBuilding } from 'utils/apply-map-house-detail-to-building';
import { getPolygonCentroid } from 'utils/get-polygon-centroid';
import { mapLeadStatusIdToHouseStatus } from 'utils/map-house-status';
import { isStreetZoomRegion } from 'utils/is-street-zoom-region';
import { MapCompass } from './MapCompass';
import { containsCoordinate, findMapBuildingAtCoordinate } from 'utils/find-map-building-at-coordinate';
import { MapDynamicOverlay, type MapAreaOverlay } from './MapDynamicOverlay';
import { mergeHouseDetailIntoPolygons } from 'utils/merge-house-detail-into-polygons';
import { MapHouseStatusFilter } from './MapHouseStatusFilter';
import {
    filterMapHousesByOutcome,
    type MapHouseOutcomeFilter,
} from 'utils/filter-map-houses-by-outcome';
import { selectMapOverlayItems } from 'utils/select-map-overlay-items';
import Route01Icon from '@hugeicons/core-free-icons/Route01Icon';
import { HugeiconsIcon } from '@hugeicons/react-native';
import { rankUnworkedDoorTargets } from 'utils/rank-unworked-door-targets';
import {
    buildWalkingDirectionsUrl,
    formatWalkingDistance,
} from 'utils/build-walking-directions-url';
import { isMapRouteReady } from 'utils/is-map-route-ready';
import { CircleDrawingOverlay } from './CircleDrawingOverlay';
import { useMapCameraHeading } from 'hooks/useMapCameraHeading';

const { width, height } = Dimensions.get('window');
const ASPECT_RATIO = width / height;
const LATITUDE_DELTA = 0.003;
const LONGITUDE_DELTA = LATITUDE_DELTA * ASPECT_RATIO;
const UNASSIGNED_AREA_STROKE = '#8B8682';
const UNASSIGNED_AREA_FILL = 'rgba(161, 161, 170, 0.32)';
const HIDDEN_POLYGON_COORDINATES = [
    { latitude: 0, longitude: 0 },
    { latitude: 0, longitude: 0.000001 },
    { latitude: 0.000001, longitude: 0 },
];
interface DrawingMapProps {
    // canDraw: boolean;
    // stopDrawing: () => void;
    // setCanFinishDrawing: (value: boolean) => void;
    // setShowDrawButton: (value: boolean) => void;
    // showDrawButton: boolean;
}
const PolygonCreator = ({ }: DrawingMapProps) => {
    const { session } = useSession()
    const isScreenFocused = useIsFocused();
    const isAppActive = useAppIsActive();
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
        buildingMarkers: Array<BuildingProps>;
    } | null>(null)
    const [canFinishArea, setCanFinishArea] = useState<boolean>(false)
    const [myLocation, setMyLocation] = useState<CoordinateProps>({} as CoordinateProps)
    const [hasLocationPermission, setHasLocationPermission] = useState(false);
    const [activeDrawing, setActiveDrawing] = useState(false)
    const [loading, setLoading] = useState(false)
    const [isAtCurrentLocation, setIsAtCurrentLocation] = useState(true);
    const [isMapMoving, setIsMapMoving] = useState(false);
    const [openManageAreaModal, setOpenManageAreaModal] = useState(false)
    const [selectedBuilding, setSelectedBuilding] = useState<any | null>(null);
    const [isReassignment, setIsReassignment] = useState(false)
    const [openQuickStatusModal, setOpenQuickStatusModal] = useState<boolean>(false)
    const [openDetailedHouseModal, setOpenDetailedHouseModal] = useState<boolean>(false)
    const [openSubmitLeadModal, setOpenSubmitLeadModal] = useState<boolean>(false)
    const [alertVisible, setAlertVisible] = useState<boolean>(false)
    const [deleteType, setDeleteType] = useState<'house' | 'area' | null>(null)
    const [message, setMessage] = useState<string>('')
    const [pendingKnock, setPendingKnock] = useState<{ houseId: number; statusId: number } | null>(null);
    const [loadingHouseDetail, setLoadingHouseDetail] = useState(false);
    const [mapRefreshKey, setMapRefreshKey] = useState(0);
    const [houseOutcomeFilter, setHouseOutcomeFilter] = useState<MapHouseOutcomeFilter>('all');
    const mapRef = useRef<MapView>(null);
    const isMapMovingRef = useRef(false);
    const pendingKnockHouseIdRef = useRef<number | null>(null);
    const houseSelectionRequestIdRef = useRef(0);
    const {
        heading: mapHeading,
        requestHeadingUpdate: updateCompassHeading,
        resetMapToNorth,
    } = useMapCameraHeading(mapRef);
    const {
        buildings: mapBuildings,
        hasError: hasBuildingDataError,
        isReady: isBuildingViewportReady,
    } = useMapBuildings({
        region: viewportRegion ?? region,
        isEnabled: Boolean(session?.token) && !activeDrawing && isScreenFocused && isAppActive,
        refreshKey: mapRefreshKey,
    });
    const areaIds = useMemo(() => polygons.map((polygon) => polygon.id), [polygons]);
    const {
        houses: viewportHouses,
        replaceHouse,
        hasError: hasHouseDataError,
        isReady: isHouseViewportReady,
    } = useMapHousesViewport({
        region: viewportRegion ?? region,
        areaIds,
        isEnabled: Boolean(session?.token) && !activeDrawing && isScreenFocused,
        refreshKey: mapRefreshKey,
        scopeKey: getUserScopeKey(session?.user),
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
        let cancelled = false;
        let animationTimeout: ReturnType<typeof setTimeout> | null = null;
        (async () => {
            const { status } = await Location.requestForegroundPermissionsAsync();
            if (cancelled) {
                return;
            }
            if (status !== 'granted') {
                Alert.alert('Permission to access location was denied');
                return;
            }
            setHasLocationPermission(true);
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
            setViewportRegion(initialRegion);
            setMyLocation({
                latitude: location.coords.latitude,
                longitude: location.coords.longitude,
            });
            animationTimeout = setTimeout(() => {
                if (mapRef.current) {
                    mapRef.current.animateToRegion(initialRegion, 1000);
                }
            }, 100);
        })().catch(() => {
            if (!cancelled) {
                Alert.alert('Could not get your location', 'Check Location Services and try again.');
            }
        });
        return () => {
            cancelled = true;
            if (animationTimeout !== null) {
                clearTimeout(animationTimeout);
            }
        };
    }, []);

    const hasFreshRouteLocation = useLiveForegroundLocation({
        isEnabled: hasLocationPermission && isScreenFocused && isAppActive,
        onCoordinate: setMyLocation,
    });

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
        isMapMovingRef.current = false;
        setIsMapMoving(false);
        if (
            !Number.isFinite(newRegion.latitude) ||
            !Number.isFinite(newRegion.longitude) ||
            !Number.isFinite(newRegion.latitudeDelta) ||
            !Number.isFinite(newRegion.longitudeDelta) ||
            newRegion.latitudeDelta <= 0 ||
            newRegion.longitudeDelta <= 0
        ) {
            return;
        }
        setViewportRegion(newRegion);
        if (isAtCurrentLocation && region) {
            const currentLocation = {
                latitude: newRegion.latitude,
                longitude: newRegion.longitude,
            };
            const locationThreshold = 0.0001; // Adjust this value as needed
            if (
                Math.abs(currentLocation.latitude - region.latitude) > locationThreshold ||
                Math.abs(currentLocation.longitude - region.longitude) > locationThreshold
            ) {
                setIsAtCurrentLocation(false);
            }
        }
        updateCompassHeading();
    };

    const handleRegionChange = () => {
        if (!isMapMovingRef.current) {
            isMapMovingRef.current = true;
            setIsMapMoving(true);
        }
        updateCompassHeading();
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

    const openDetailedBuilding = (building: BuildingProps) => {
        setSelectedBuilding(building);
        setOpenDetailedHouseModal(true);
    };

    const handleBuildingPress = (building: BuildingProps) => {
        if (pendingKnockHouseIdRef.current !== null) {
            return;
        }
        const requestId = houseSelectionRequestIdRef.current + 1;
        houseSelectionRequestIdRef.current = requestId;
        setLoadingHouseDetail(true);
        setOpenDetailedHouseModal(false);
        fetchMapHouseDetail(Number(building.id))
            .then((detail) => {
                if (houseSelectionRequestIdRef.current === requestId) {
                    setPolygons((current) => mergeHouseDetailIntoPolygons(
                        current,
                        detail,
                        building.additionalDetails?.externalId ?? null,
                    ));
                    openDetailedBuilding(applyMapHouseDetailToBuilding(building, detail));
                }
            })
            .catch((error) => {
                if (houseSelectionRequestIdRef.current === requestId) {
                    Alert.alert(
                        'Could not load house details',
                        getApiErrorMessage(error, 'The latest lead and knock history could not be loaded. Try again.'),
                    );
                }
            })
            .finally(() => {
                if (houseSelectionRequestIdRef.current === requestId) {
                    setLoadingHouseDetail(false);
                }
            });
    };

    const saveHouseKnockStatus = async (building: BuildingProps, status: LeadStatus) => {
        const houseId = Number(building.id);
        if (pendingKnockHouseIdRef.current !== null) {
            return;
        }
        pendingKnockHouseIdRef.current = houseId;
        setPendingKnock({ houseId, statusId: status.statusId });
        try {
            const detail = await createMapHouseStatus({
                houseId,
                status: mapLeadStatusIdToHouseStatus(status.statusId),
                notes: building.additionalDetails?.note,
            });
            setPolygons((current) => mergeHouseDetailIntoPolygons(
                current,
                detail,
                building.additionalDetails?.externalId ?? null,
            ));
            setSelectedBuilding((current: BuildingProps | null) =>
                current?.id === building.id
                    ? applyMapHouseDetailToBuilding(current, detail)
                    : current,
            );
            replaceHouse(convertMapHouseDetailToHouse(
                detail,
                building.additionalDetails?.externalId ?? null,
            ));
        } finally {
            pendingKnockHouseIdRef.current = null;
            setPendingKnock(null);
        }
    };

    const handleBuildingLongPress = (building: BuildingProps) => {
        if (pendingKnockHouseIdRef.current !== null) {
            return;
        }
        houseSelectionRequestIdRef.current += 1;
        setLoadingHouseDetail(false);
        setSelectedBuilding(building);
        setOpenQuickStatusModal(true);
    };

    const handleFootprintPress = async (building: MapBuildingResponse) => {
        if (activeDrawing || isSavingRoofRef.current || pendingKnockHouseIdRef.current !== null) {
            return;
        }
        const existing = viewportHouses.find((house) => house.externalId === building.id);
        if (existing) {
            handleBuildingPress(convertMapHousesToBuildings([existing])[0]);
            return;
        }
        const selectionRequestId = houseSelectionRequestIdRef.current + 1;
        houseSelectionRequestIdRef.current = selectionRequestId;
        isSavingRoofRef.current = true;
        setLoadingHouseDetail(true);
        try {
            const detail = await createMapHouseFromBuilding({
                overtureBuildingId: building.id,
                roofLat: building.roofLat,
                roofLng: building.roofLng,
            });
            replaceHouse(convertMapHouseDetailToHouse(detail, building.id));
            setPolygons((current) => mergeHouseDetailIntoPolygons(current, detail, building.id));
            const stub: BuildingProps = {
                id: detail.id,
                latitude: detail.latitude,
                longitude: detail.longitude,
                address: detail.address ?? 'Unknown Address',
            };
            if (houseSelectionRequestIdRef.current === selectionRequestId) {
                openDetailedBuilding(applyMapHouseDetailToBuilding(stub, detail));
            }
        } catch (error) {
            if (houseSelectionRequestIdRef.current === selectionRequestId) {
                Alert.alert('Could not open house', getApiErrorMessage(error, 'The roof was not saved. Check login and try again.'));
            }
        } finally {
            isSavingRoofRef.current = false;
            if (houseSelectionRequestIdRef.current === selectionRequestId) {
                setLoadingHouseDetail(false);
            }
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
    const handleCircleChange = useCallback((coordinates: CoordinateProps[]) => {
        if (coordinates.length < 3) {
            return;
        }
        setCanFinishArea(true);
        setEditing({ id: Date.now(), coordinates });
    }, []);

    const handleToggleDrawing = useCallback(() => {
        setActiveDrawing((current) => !current);
        setEditing(null);
        setCanFinishArea(false);
    }, []);

    const openRoofAtCoordinate = (coordinate: CoordinateProps): boolean => {
        const building = findMapBuildingAtCoordinate(mapBuildings, coordinate);
        if (!building) {
            return false;
        }
        void handleFootprintPress(building);
        return true;
    };

    const handleMapPress = (event: MapPressEvent) => {
        if (activeDrawing) {
            return;
        }
        const coordinate = event.nativeEvent.coordinate;
        if (openRoofAtCoordinate(coordinate)) {
            return;
        }
        const selectedPolygon = polygons.find((polygon) =>
            containsCoordinate(polygon.coordinates, coordinate),
        );
        if (selectedPolygon) {
            openManageArea(selectedPolygon);
        }
    };

    const visibleRegion = viewportRegion ?? region;
    const isStreetZoom = Boolean(visibleRegion && isStreetZoomRegion(visibleRegion));
    const hasFootprints = isStreetZoom && mapBuildings.length > 0;
    const hasMapDataError = isStreetZoom && (hasBuildingDataError || hasHouseDataError);
    const selectedHousePendingStatusId = pendingKnock && pendingKnock.houseId === selectedBuilding?.id
        ? pendingKnock.statusId
        : null;
    const areaOverlays = useMemo<MapAreaOverlay[]>(() => {
        return polygons.flatMap((polygon) => {
            const centroid = getPolygonCentroid(polygon.coordinates);
            if (!centroid) {
                return [];
            }
            return [{
                id: polygon.id,
                coordinate: centroid,
                coordinates: polygon.coordinates,
                strokeColor: polygon.assignee?.color ?? UNASSIGNED_AREA_STROKE,
                fillColor: polygon.assignee
                    ? hexToRgba(polygon.assignee.color, 0.2)
                    : UNASSIGNED_AREA_FILL,
                assignee: polygon.assignee ? {
                    id: polygon.assignee.id,
                    name: polygon.assignee.name,
                    lastname: polygon.assignee.lastname,
                    avatarUrl: polygon.assignee.avatarUrl,
                    color: polygon.assignee.color,
                } : null,
            }];
        });
    }, [polygons]);
    const visibleBuildingMarkers = useMemo(() => {
        if (!isStreetZoom) {
            return [];
        }
        return hasFootprints
            ? convertMapHousesToBuildings(viewportHouses)
            : polygons.flatMap((polygon) => polygon.buildingMarkers ?? []);
    }, [hasFootprints, isStreetZoom, polygons, viewportHouses]);
    const nearbyBuildingMarkers = useMemo(
        () => visibleRegion
            ? selectMapOverlayItems(visibleRegion, visibleBuildingMarkers, []).houses
            : [],
        [visibleBuildingMarkers, visibleRegion],
    );
    const filteredVisibleBuildingMarkers = useMemo(
        () => filterMapHousesByOutcome(nearbyBuildingMarkers, houseOutcomeFilter),
        [houseOutcomeFilter, nearbyBuildingMarkers],
    );
    const isRouteReady = isMapRouteReady({
        housesReady: isHouseViewportReady,
        buildingsReady: isBuildingViewportReady,
        buildingsFailed: hasBuildingDataError,
        locationReady: hasFreshRouteLocation,
    });
    const nextUnworkedDoor = useMemo(
        () => isRouteReady && visibleRegion
            ? rankUnworkedDoorTargets(myLocation, mapBuildings, viewportHouses, visibleRegion)[0] ?? null
            : null,
        [isRouteReady, mapBuildings, myLocation, viewportHouses, visibleRegion],
    );

    const handleNavigateToNextDoor = useCallback(() => {
        if (!hasFreshRouteLocation) {
            Alert.alert('Updating your location', 'Wait for the live location marker, then try again.');
            return;
        }
        if (!isHouseViewportReady) {
            Alert.alert('Updating door statuses', 'Wait for the current street data, then try again.');
            return;
        }
        if (!isBuildingViewportReady && !hasBuildingDataError) {
            Alert.alert('Updating nearby roofs', 'Wait for the current street footprints, then try again.');
            return;
        }
        if (!nextUnworkedDoor) {
            Alert.alert(
                'No unworked doors nearby',
                'Pan to another street-level area and wait for the roofs to load.',
            );
            return;
        }
        const label = nextUnworkedDoor.address?.trim() &&
            nextUnworkedDoor.address.trim().toLowerCase() !== 'unknown address'
            ? nextUnworkedDoor.address.trim()
            : 'Nearest unworked door';
        const distance = formatWalkingDistance(nextUnworkedDoor.distanceMeters);
        Alert.alert(
            label,
            `${distance} away. Open walking directions?`,
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Walk there',
                    onPress: () => {
                        Linking.openURL(buildWalkingDirectionsUrl(
                            nextUnworkedDoor.coordinate,
                            Platform.OS,
                        )).catch(() => {
                            Alert.alert('Could not open directions', 'Open your Maps app and try again.');
                        });
                    },
                },
            ],
        );
    }, [hasBuildingDataError, hasFreshRouteLocation, isBuildingViewportReady, isHouseViewportReady, nextUnworkedDoor]);

    const memoizedEditingPolygon = useMemo(() => {
        const isVisible = Boolean(editing && editing.coordinates.length >= 3);
        return (
            <Polygon
                coordinates={isVisible ? editing!.coordinates : HIDDEN_POLYGON_COORDINATES}
                strokeColor={isVisible ? '#32A0FF' : 'transparent'}
                fillColor={isVisible ? 'rgba(50, 160, 255, 0.2)' : 'transparent'}
                strokeWidth={2}
                tappable={false}
            />
        );
    }, [editing]);
    return (
        <View style={styles.container}>
            <FloatingButtons
                buttons={[
                    ...(isStreetZoom && !activeDrawing && isRouteReady ? [{
                        icon: <HugeiconsIcon icon={Route01Icon} size={22} color="#1F1F1F" strokeWidth={2} />,
                        onPress: handleNavigateToNextDoor,
                        accessibilityLabel: 'Navigate to the nearest unworked door',
                    }] : []),
                    {
                        icon: <MyLocationSvg color={isAtCurrentLocation ? "white" : "#1F1F1F"} />,
                        onPress: handleMyLocation,
                        style: { backgroundColor: isAtCurrentLocation ? "#32A0FF" : "white" },
                        accessibilityLabel: 'Center map on my location',
                    },
                ]}
                canFinishArea={canFinishArea}
                onFinish={handleFinish}
                activeDrawing={activeDrawing}
                onToggleDrawing={handleToggleDrawing}
                isManager={isManager}
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
                canManage={isManager}
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
                isStatusSaving={pendingKnock !== null}
                savingStatusId={selectedHousePendingStatusId}
                onDeletePin={() => {
                    setOpenQuickStatusModal(false)
                    setDeleteType('house')
                    setMessage('House is Deleted!')
                    setAlertVisible(true)
                }}
                onOpenHouseInfo={() => {
                    setOpenQuickStatusModal(false)
                    if (selectedBuilding) {
                        handleBuildingPress(selectedBuilding);
                    }
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
                isStatusSaving={pendingKnock !== null}
                savingStatusId={selectedHousePendingStatusId}
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
                        setPolygons((current) => mergeHouseDetailIntoPolygons(
                            current,
                            detail,
                            selectedBuilding.additionalDetails?.externalId ?? null,
                        ));
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
                onOpenSubmitLead={(updatedHouse) => {
                    if (!session?.user) {
                        Alert.alert('Not signed in', 'Log in again, then submit this lead.');
                        return;
                    }
                    setSelectedBuilding(updatedHouse);
                    setOpenDetailedHouseModal(false);
                    setOpenSubmitLeadModal(true);
                }}
                onUpdateLead={async (updatedHouse) => {
                    const existingLeadId = updatedHouse.additionalDetails?.leadId;
                    if (!existingLeadId) {
                        return;
                    }
                    try {
                        await updateFieldLeadInfo({
                            leadId: Number(existingLeadId),
                            firstName: updatedHouse.assignee?.name,
                            lastName: updatedHouse.assignee?.lastname,
                            phone: updatedHouse.assignee?.phone,
                            email: updatedHouse.assignee?.email,
                        });
                        setSelectedBuilding(updatedHouse);
                        setMessage('Lead updated in Radiabase.');
                        setAlertVisible(true);
                    } catch (error) {
                        Alert.alert('Could not update lead', getApiErrorMessage(error, 'The contact was not saved.'));
                    }
                }}
            />
            {selectedBuilding && session?.user ? (
                <SubmitLeadFromHouseModal
                    visible={openSubmitLeadModal}
                    house={selectedBuilding}
                    user={session.user}
                    onBack={() => {
                        setOpenSubmitLeadModal(false);
                        setOpenDetailedHouseModal(true);
                    }}
                    onSubmitted={async () => {
                        const detail = await fetchMapHouseDetail(Number(selectedBuilding.id));
                        setPolygons((current) => mergeHouseDetailIntoPolygons(
                            current,
                            detail,
                            selectedBuilding.additionalDetails?.externalId ?? null,
                        ));
                        replaceHouse(convertMapHouseDetailToHouse(
                            detail,
                            selectedBuilding.additionalDetails?.externalId ?? null,
                        ));
                        setSelectedBuilding(applyMapHouseDetailToBuilding(selectedBuilding, detail));
                        setOpenSubmitLeadModal(false);
                        setOpenDetailedHouseModal(true);
                        setMessage('Lead submitted to Radiabase.');
                        setAlertVisible(true);
                    }}
                />
            ) : null}
            {loading && (
                <View style={styles.loaderContainer}>
                    <ActivityIndicator size="large" color="#32A0FF" />
                    <Text style={styles.loaderText}>Creating area...</Text>
                </View>
            )}
            {loadingHouseDetail && (
                <View style={styles.loaderContainer}>
                    <ActivityIndicator size="large" color="#32A0FF" />
                    <Text style={styles.loaderText}>Loading house...</Text>
                </View>
            )}
            {region && <MapView
                style={styles.map}
                ref={mapRef}
                mapType="satellite"
                initialRegion={region}
                rotateEnabled={!activeDrawing}
                pitchEnabled={false}
                showsCompass={false}
                zoomEnabled={!activeDrawing}
                scrollEnabled={!activeDrawing}
                moveOnMarkerPress={false}
                onPress={handleMapPress}
                onRegionChange={handleRegionChange}
                onRegionChangeComplete={handleRegionChangeComplete}
            >
                <Marker
                    key="my-location-marker"
                    coordinate={Number.isFinite(myLocation.latitude) && Number.isFinite(myLocation.longitude)
                        ? { latitude: myLocation.latitude, longitude: myLocation.longitude }
                        : { latitude: region.latitude, longitude: region.longitude }}
                    title={displayName}
                    opacity={Number.isFinite(myLocation.latitude) && Number.isFinite(myLocation.longitude) ? 1 : 0}
                    tappable={false}
                    tracksViewChanges={false}
                >
                    <View style={styles.myLocationMarker} pointerEvents="none">
                        <Text style={styles.myLocationText}>
                            {getAcronym(displayName)}
                        </Text>
                    </View>
                </Marker>
                {memoizedEditingPolygon}
            </MapView>}
            {region ? (
                <CircleDrawingOverlay
                    active={activeDrawing}
                    mapRef={mapRef}
                    onCircleChange={handleCircleChange}
                />
            ) : null}
            {region ? (
                <MapDynamicOverlay
                    mapRef={mapRef}
                    region={visibleRegion}
                    hidden={isMapMoving}
                    interactiveHidden={activeDrawing}
                    houses={filteredVisibleBuildingMarkers}
                    areas={areaOverlays}
                    onHousePress={handleBuildingPress}
                    onHouseLongPress={handleBuildingLongPress}
                    onAreaPress={(areaId) => {
                        const polygon = polygons.find((candidate) => candidate.id === areaId);
                        if (polygon) {
                            openManageArea(polygon);
                        }
                    }}
                />
            ) : null}
            {region && !activeDrawing ? (
                <MapCompass heading={mapHeading} onResetNorth={resetMapToNorth} />
            ) : null}
            {isStreetZoom && !activeDrawing && !hasMapDataError ? (
                <MapHouseStatusFilter
                    houses={nearbyBuildingMarkers}
                    value={houseOutcomeFilter}
                    onChange={setHouseOutcomeFilter}
                />
            ) : null}
            {hasMapDataError ? (
                <Pressable
                    accessibilityRole="button"
                    accessibilityLabel="Retry loading street and house data"
                    onPress={() => setMapRefreshKey((current) => current + 1)}
                    style={({ pressed }) => [styles.mapDataError, pressed && styles.mapDataErrorPressed]}
                >
                    <Text style={styles.mapDataErrorTitle}>Some map data could not load</Text>
                    <Text style={styles.mapDataErrorAction}>Tap to retry</Text>
                </Pressable>
            ) : null}
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
    mapDataError: {
        position: 'absolute',
        top: 72,
        left: 16,
        right: 16,
        minHeight: 48,
        borderRadius: 12,
        backgroundColor: 'rgba(24, 24, 27, 0.92)',
        paddingHorizontal: 14,
        paddingVertical: 9,
        zIndex: 9,
    },
    mapDataErrorPressed: {
        opacity: 0.72,
    },
    mapDataErrorTitle: {
        color: 'white',
        fontSize: 13,
        fontWeight: '700',
    },
    mapDataErrorAction: {
        color: '#BAE6FD',
        fontSize: 11,
        fontWeight: '600',
        marginTop: 2,
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
