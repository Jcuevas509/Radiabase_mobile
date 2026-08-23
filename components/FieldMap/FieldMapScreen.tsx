import { Ionicons } from '@expo/vector-icons';
import { useIsFocused } from '@react-navigation/native';
import * as Location from 'expo-location';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  AppState,
  Dimensions,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import MapView, { MapPressEvent, Marker, Region } from 'react-native-maps';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { CustomAlert } from 'components/Alert/Alert';
import { AssignAreaModal } from 'components/DrawingMap/AssignAreaModal';
import { DetailedHouseOverviewModal } from 'components/DrawingMap/DetailedHouseOverviewModal';
import FloatingButtons from 'components/DrawingMap/FloatingButtons';
import { ManageAreaModal } from 'components/DrawingMap/ManageAreaModal';
import { QuickHouseOverviewModal } from 'components/DrawingMap/QuickHouseOverviewModal';
import { SubmitLeadFromHouseModal } from 'components/DrawingMap/SubmitLeadFromHouseModal';
import { AreaLabelOverlay } from 'components/FieldMap/AreaLabelOverlay';
import { AreaLayer, type AreaDisplay } from 'components/FieldMap/AreaLayer';
import { DraftAreaPolygon, DraftVertexHandles } from 'components/FieldMap/DraftAreaEditor';
import { DrawingCanvas, type CanvasSize } from 'components/FieldMap/DrawingCanvas';
import { HouseDecalOverlay } from 'components/FieldMap/HouseDecalOverlay';
import {
  MapCompassController,
  type CompassControllerHandle,
} from 'components/FieldMap/MapCompassController';
import { MyLocationSvg } from 'components/svg';
import { useSession } from 'context/AuthenticationContext';
import { useDraftAreaStore } from 'store/DraftAreaStore';
import { useAppIsActive } from 'hooks/useAppIsActive';
import { useLiveForegroundLocation } from 'hooks/useLiveForegroundLocation';
import { useMapBuildings } from 'hooks/useMapBuildings';
import { useMapHousesViewport } from 'hooks/useMapHousesViewport';
import { useScreenProjectionFit } from 'hooks/useScreenProjectionFit';
import {
  assignMapAreaRep,
  createMapArea,
  createMapHouseFromBuilding,
  createMapHouseStatus,
  deleteMapArea,
  fetchMapAreas,
  fetchMapHouseDetail,
  fetchMapHouses,
  MapBuildingResponse,
  updateMapHouseNotes,
} from 'services/area-api';
import { updateFieldLeadInfo } from 'services/leads-api';
import { BuildingProps, CoordinateProps, LeadStatus } from 'types/componentsTypes';
import { applyMapHouseDetailToBuilding } from 'utils/apply-map-house-detail-to-building';
import { buildAreaName } from 'utils/build-area-name';
import { getPolygonAreaSquareMeters } from 'utils/get-polygon-area-square-meters';
import { prepareDrawnStrokeVertices } from 'utils/prepare-drawn-stroke';
import { convertCoordinatesToGeoJsonPolygon } from 'utils/convert-coordinates-to-geojson';
import { convertMapAreasToPolygons } from 'utils/convert-map-areas-to-polygons';
import { convertMapHouseDetailToHouse } from 'utils/convert-map-house-detail-to-house';
import { convertMapHousesToBuildings } from 'utils/convert-map-houses-to-buildings';
import { containsCoordinate, findMapBuildingAtCoordinate } from 'utils/find-map-building-at-coordinate';
import { getApiErrorMessage } from 'utils/get-api-error-message';
import { getMapRegionFromCoordinates } from 'utils/get-map-region-from-coordinates';
import { SAMPLE_LEADERBOARD_REPS } from 'services/sample-leaderboard';
import { LeaderboardCard } from 'components/Card/LeaderboardCard';
import { PlainModal } from 'components/Modal/Modal';
import { GlassSurface } from 'components/GlassSurface';
import { getPolygonCentroid } from 'utils/get-polygon-centroid';
import { getUserScopeKey } from 'utils/get-user-scope-key';
import { getAcronym, hexToRgba } from 'utils/helperFunctions';
import { isStreetZoomRegion } from 'utils/is-street-zoom-region';
import { mapLeadStatusIdToHouseStatus } from 'utils/map-house-status';
import { mergeHouseDetailIntoPolygons } from 'utils/merge-house-detail-into-polygons';
import { selectMapOverlayItems } from 'utils/select-map-overlay-items';
import type { StrokePoint } from 'utils/simplify-stroke-points';
import { Button } from 'components/Button/Button';

const { width, height } = Dimensions.get('window');
const ASPECT_RATIO = width / height;
const LATITUDE_DELTA = 0.003;
const LONGITUDE_DELTA = LATITUDE_DELTA * ASPECT_RATIO;
const UNASSIGNED_AREA_STROKE = '#8B8682';
const UNASSIGNED_AREA_FILL = 'rgba(161, 161, 170, 0.32)';

type MapPolygon = {
  id: number;
  assignee: any;
  coordinates: CoordinateProps[];
  buildingMarkers: BuildingProps[];
};

type MapMode = 'idle' | 'drawing' | 'reviewingDraft';

/**
 * The field map. Interaction rule that keeps zoom from ever "randomly"
 * breaking: the MapView keeps every gesture enabled at all times. Drawing
 * works by mounting a paint surface above the map; leaving drawing mode
 * unmounts it, so there is no disabled-gesture state to get stuck in.
 */
export function FieldMapScreen() {
  const { session } = useSession();
  const isScreenFocused = useIsFocused();
  const isAppActive = useAppIsActive();
  const isManager = session?.user?.role === 'manager';
  const displayName = `${session?.user?.firstName ?? ''} ${session?.user?.lastName ?? ''}`.trim() || 'You';

  const [mode, setMode] = useState<MapMode>('idle');
  const [region, setRegion] = useState<Region | null>(null);
  const [viewportRegion, setViewportRegion] = useState<Region | null>(null);
  const [polygons, setPolygons] = useState<MapPolygon[]>([]);
  const [openAssignModal, setOpenAssignModal] = useState(false);
  const [selectedAgent, setSelectedAgent] = useState<any>(null);
  const [selectedArea, setSelectedArea] = useState<MapPolygon | null>(null);
  const [myLocation, setMyLocation] = useState<CoordinateProps>({} as CoordinateProps);
  const [hasLocationPermission, setHasLocationPermission] = useState(false);
  const [loading, setLoading] = useState(false);
  const [isAtCurrentLocation, setIsAtCurrentLocation] = useState(true);
  const [openManageAreaModal, setOpenManageAreaModal] = useState(false);
  const [selectedBuilding, setSelectedBuilding] = useState<any | null>(null);
  const [isReassignment, setIsReassignment] = useState(false);
  const [openQuickStatusModal, setOpenQuickStatusModal] = useState(false);
  const [openDetailedHouseModal, setOpenDetailedHouseModal] = useState(false);
  const [openSubmitLeadModal, setOpenSubmitLeadModal] = useState(false);
  const [alertVisible, setAlertVisible] = useState(false);
  const [isAreaDeletionPending, setIsAreaDeletionPending] = useState(false);
  const [message, setMessage] = useState('');
  const [pendingKnock, setPendingKnock] = useState<{ houseId: number; statusId: number } | null>(null);
  const [loadingHouseDetail, setLoadingHouseDetail] = useState(false);
  const [mapRefreshKey, setMapRefreshKey] = useState(0);
  const [isMapMoving, setIsMapMoving] = useState(false);
  const [showLeaderboard, setShowLeaderboard] = useState(false);
  const isMapMovingRef = useRef(false);
  const settleTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const mapRef = useRef<MapView>(null);
  const pendingKnockHouseIdRef = useRef<number | null>(null);
  const houseSelectionRequestIdRef = useRef(0);
  const isSavingRoofRef = useRef(false);

  const isIdle = mode === 'idle';
  const compassControllerRef = useRef<CompassControllerHandle | null>(null);
  const insets = useSafeAreaInsets();
  const projectionFit = useScreenProjectionFit({
    mapRef,
    region: viewportRegion ?? region,
    isEnabled: isScreenFocused && Boolean(region),
  });

  // Dev-only freeze probes: a stalled JS thread logs its stall length plus
  // breadcrumbs of the most recent map operations, a render storm logs its
  // rate. Silence during a visible freeze means the stall is on the native
  // side (map / markers), not in JS.
  const renderCountRef = useRef(0);
  renderCountRef.current += 1;
  const modeRef = useRef(mode);
  modeRef.current = mode;
  const perfBreadcrumbsRef = useRef<Record<string, number>>({});
  const markPerfBreadcrumb = (name: string) => {
    perfBreadcrumbsRef.current[name] = Date.now();
  };
  useEffect(() => {
    if (!__DEV__) {
      return;
    }
    let lastTick = Date.now();
    let lastBackgroundedAt = 0;
    const appStateProbe = AppState.addEventListener('change', (nextState) => {
      if (nextState !== 'active') {
        lastBackgroundedAt = Date.now();
      }
    });
    const lagProbe = setInterval(() => {
      const now = Date.now();
      const lag = now - lastTick - 1000;
      const wasBackgrounded = lastBackgroundedAt >= lastTick;
      lastTick = now;
      // Lags beyond 30s are app suspensions the AppState listener missed
      // (iOS can suspend before the event reaches JS), not real stalls.
      if (lag > 300 && lag < 30_000 && !wasBackgrounded && AppState.currentState === 'active') {
        const breadcrumbs = Object.entries(perfBreadcrumbsRef.current)
          .map(([name, at]) => `${name} ${((now - at) / 1000).toFixed(1)}s ago`)
          .join(', ');
        console.warn(`[Perf] JS thread stalled ~${lag}ms | recent: ${breadcrumbs || 'none'}`);
      }
    }, 1000);
    const renderProbe = setInterval(() => {
      if (renderCountRef.current > 30) {
        console.warn(
          `[Perf] FieldMapScreen rendered ${renderCountRef.current}x in 2s | ` +
          `mode=${modeRef.current} mapMoving=${isMapMovingRef.current}`,
        );
      }
      renderCountRef.current = 0;
    }, 2000);
    return () => {
      appStateProbe.remove();
      clearInterval(lagProbe);
      clearInterval(renderProbe);
    };
  }, []);

  useEffect(() => () => {
    if (settleTimerRef.current !== null) {
      clearTimeout(settleTimerRef.current);
    }
  }, []);
  const {
    buildings: mapBuildings,
    hasError: hasBuildingDataError,
    isReady: isBuildingViewportReady,
  } = useMapBuildings({
    region: viewportRegion ?? region,
    isEnabled: Boolean(session?.token) && isIdle && isScreenFocused && isAppActive,
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
    isEnabled: Boolean(session?.token) && isIdle && isScreenFocused,
    refreshKey: mapRefreshKey,
    scopeKey: getUserScopeKey(session?.user),
  });

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
        mapRef.current?.animateToRegion(initialRegion, 1000);
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
    const converted = convertMapAreasToPolygons(areas, houses);
    markPerfBreadcrumb('areasLoaded');
    setPolygons(converted);
    return converted;
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
    setViewportRegion(newRegion);
    setIsAtCurrentLocation(true);
  };

  const handleRegionChange = () => {
    if (settleTimerRef.current !== null) {
      clearTimeout(settleTimerRef.current);
      settleTimerRef.current = null;
    }
    if (!isMapMovingRef.current) {
      isMapMovingRef.current = true;
      setIsMapMoving(true);
    }
    compassControllerRef.current?.requestHeadingUpdate();
  };

  // iOS fires onRegionChangeComplete repeatedly DURING a slow continuous
  // gesture, and updating the viewport per event re-rendered the whole
  // screen dozens of times per second. The map counts as settled only after
  // a quiet gap, so a gesture costs one render at its start and one at its
  // real end.
  const handleRegionChangeComplete = (newRegion: Region) => {
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
    if (settleTimerRef.current !== null) {
      clearTimeout(settleTimerRef.current);
    }
    settleTimerRef.current = setTimeout(() => {
      settleTimerRef.current = null;
      markPerfBreadcrumb('settle');
      isMapMovingRef.current = false;
      setIsMapMoving(false);
      setViewportRegion(newRegion);
      compassControllerRef.current?.requestHeadingUpdate();
      if (isAtCurrentLocation && region) {
        const locationThreshold = 0.0001;
        if (
          Math.abs(newRegion.latitude - region.latitude) > locationThreshold ||
          Math.abs(newRegion.longitude - region.longitude) > locationThreshold
        ) {
          setIsAtCurrentLocation(false);
        }
      }
    }, 250);
  };

  const openManageArea = (polygon: MapPolygon) => {
    if (!isIdle) {
      return;
    }
    setSelectedArea(polygon);
    setOpenManageAreaModal(true);
  };

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

  const handleHousePinPress = (building: BuildingProps) => {
    if (!isIdle || pendingKnockHouseIdRef.current !== null) {
      return;
    }
    houseSelectionRequestIdRef.current += 1;
    setLoadingHouseDetail(false);
    setSelectedBuilding(building);
    setOpenQuickStatusModal(true);
  };

  const saveHouseKnockStatus = async (building: BuildingProps, status: LeadStatus) => {
    const houseId = Number(building.id);
    if (pendingKnockHouseIdRef.current !== null) {
      return;
    }
    pendingKnockHouseIdRef.current = houseId;
    markPerfBreadcrumb('knock');
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

  const handleFootprintPress = async (building: MapBuildingResponse) => {
    if (!isIdle || isSavingRoofRef.current || pendingKnockHouseIdRef.current !== null) {
      return;
    }
    const existing = viewportHouses.find((house) => house.externalId === building.id);
    if (existing) {
      handleHousePinPress(convertMapHousesToBuildings([existing])[0]);
      return;
    }
    const selectionRequestId = houseSelectionRequestIdRef.current + 1;
    houseSelectionRequestIdRef.current = selectionRequestId;
    isSavingRoofRef.current = true;
    markPerfBreadcrumb('roofTap');
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

  const handleMapPress = (event: MapPressEvent) => {
    if (!isIdle) {
      return;
    }
    const coordinate = event.nativeEvent.coordinate;
    const building = findMapBuildingAtCoordinate(mapBuildings, coordinate);
    if (building) {
      void handleFootprintPress(building);
      return;
    }
    const selectedPolygon = polygons.find((polygon) =>
      containsCoordinate(polygon.coordinates, coordinate),
    );
    if (selectedPolygon) {
      openManageArea(selectedPolygon);
    }
  };

  const handleToggleDrawing = useCallback(() => {
    useDraftAreaStore.getState().setCoordinates(null);
    setMode((current) => (current === 'idle' ? 'drawing' : 'idle'));
  }, []);

  const handleStrokeComplete = useCallback(async (points: StrokePoint[], _size: CanvasSize) => {
    const map = mapRef.current;
    if (!map) {
      return;
    }
    markPerfBreadcrumb('stroke');
    const vertices = prepareDrawnStrokeVertices(points);
    if (vertices.length < 3) {
      Alert.alert('Keep painting', 'Paint a loop around at least a few homes, then lift your finger.');
      return;
    }
    try {
      // The map's own projection turns the stroke into coordinates, so the
      // saved boundary lands exactly where it was painted.
      const projected = await Promise.all(
        vertices.map((vertex) => map.coordinateForPoint(vertex)),
      );
      const polygon = projected.filter((coordinate) =>
        Number.isFinite(coordinate?.latitude) && Number.isFinite(coordinate?.longitude));
      if (polygon.length < 3 || getPolygonAreaSquareMeters(polygon) < 120) {
        Alert.alert('Keep painting', 'Paint a loop around at least a few homes, then lift your finger.');
        return;
      }
      useDraftAreaStore.getState().setCoordinates(polygon);
      setMode('reviewingDraft');
    } catch {
      Alert.alert('Could not read the map', 'Try painting the area again.');
    }
  }, []);

  const handleDiscardDraft = useCallback(() => {
    useDraftAreaStore.getState().setCoordinates(null);
    setMode('idle');
  }, []);

  const handleRedrawDraft = useCallback(() => {
    useDraftAreaStore.getState().setCoordinates(null);
    setMode('drawing');
  }, []);

  const handleSaveDraft = async () => {
    const draftCoordinates = useDraftAreaStore.getState().coordinates;
    if (!draftCoordinates) {
      return;
    }
    if (!session?.user?.salesOrgId || !session?.user?.officeId) {
      Alert.alert('Missing office', 'Set a current office on this user in Radiabase, then try again.');
      return;
    }
    const previousAreaIds = new Set(polygons.map((polygon) => polygon.id));
    try {
      setLoading(true);
      // Name the turf after the city under its centroid; the Home cards show
      // it, the map circle keeps its assignee label. Never block the save on
      // a failed geocode.
      let areaName: string | undefined;
      const centroid = getPolygonCentroid(draftCoordinates);
      if (centroid) {
        try {
          const [geocoded] = await Location.reverseGeocodeAsync(centroid);
          areaName = buildAreaName({
            city: geocoded?.city ?? geocoded?.district ?? geocoded?.subregion,
            state: geocoded?.region,
          });
        } catch {
          areaName = undefined;
        }
      }
      await createMapArea({
        name: areaName,
        officeId: session.user.officeId,
        salesOrgId: session.user.salesOrgId,
        boundary: convertCoordinatesToGeoJsonPolygon(draftCoordinates),
      });
      useDraftAreaStore.getState().setCoordinates(null);
      setMode('idle');
      const refreshedPolygons = await loadFieldData();
      const createdArea = refreshedPolygons
        .filter((polygon) => !previousAreaIds.has(polygon.id))
        .sort((first, second) => second.id - first.id)[0] ?? null;
      if (createdArea && isManager) {
        setSelectedArea(createdArea);
        setSelectedAgent(null);
        setIsReassignment(false);
        setOpenAssignModal(true);
      } else {
        setMessage('Area is Created Successfully!');
        setAlertVisible(true);
      }
    } catch (error) {
      const status = (error as { response?: { status?: number } })?.response?.status;
      const responseBody = (error as { response?: { data?: unknown } })?.response?.data;
      console.warn(
        '[FieldMap] create-area failed',
        status ?? 'no-status',
        JSON.stringify(responseBody ?? null),
      );
      setMessage(getApiErrorMessage(error, 'Failed to create area. Please try again.'));
      setAlertVisible(true);
    } finally {
      setLoading(false);
    }
  };

  const handleConfirmAndReassignArea = async () => {
    if (!selectedArea || !selectedAgent) {
      Alert.alert('Error', 'Please select an area and an agent to reassign.');
      return;
    }
    try {
      await assignMapAreaRep({ areaId: selectedArea.id, repId: selectedAgent.id });
      setPolygons((prevPolygons) =>
        prevPolygons.map((polygon) =>
          polygon.id === selectedArea.id ? { ...polygon, assignee: selectedAgent } : polygon,
        ),
      );
      await loadFieldData();
      setOpenAssignModal(false);
      setSelectedArea(null);
      setSelectedAgent(null);
      setIsReassignment(false);
      setMessage('Area is Reassigned Successfully!');
      setAlertVisible(true);
    } catch (error) {
      Alert.alert('Error', getApiErrorMessage(error, 'Failed to reassign the area. Please try again.'));
    }
  };

  const handleDeleteExistingArea = async () => {
    if (!selectedArea) {
      return;
    }
    try {
      await deleteMapArea(selectedArea.id);
      await loadFieldData();
      setSelectedArea(null);
      setOpenManageAreaModal(false);
    } catch (error) {
      Alert.alert(
        'Could not delete area',
        getApiErrorMessage(error, 'Only managers can delete areas, or the API is unreachable.'),
      );
    }
  };

  const handleReassignArea = async () => {
    setSelectedAgent(selectedArea?.assignee || null);
    setIsReassignment(true);
    setOpenManageAreaModal(false);
    setOpenAssignModal(true);
  };

  const visibleRegion = viewportRegion ?? region;
  const isStreetZoom = Boolean(visibleRegion && isStreetZoomRegion(visibleRegion));
  // Full-size labels near street zoom, shrinking as the camera pulls out so
  // the chip scales with its turf instead of dominating the screen.
  const areaLabelScale = useMemo(() => {
    const latitudeDelta = visibleRegion?.latitudeDelta;
    if (!latitudeDelta || latitudeDelta <= 0.0045) {
      return 1;
    }
    return Math.min(1, Math.max(0.3, 0.0045 / latitudeDelta));
  }, [visibleRegion?.latitudeDelta]);
  const hasFootprints = isStreetZoom && mapBuildings.length > 0;
  const hasMapDataError = isStreetZoom && (hasBuildingDataError || hasHouseDataError);
  const selectedHousePendingStatusId = pendingKnock && pendingKnock.houseId === selectedBuilding?.id
    ? pendingKnock.statusId
    : null;

  const areaDisplays = useMemo<AreaDisplay[]>(() => {
    return polygons.flatMap((polygon) => {
      const centroid = getPolygonCentroid(polygon.coordinates);
      if (!centroid) {
        return [];
      }
      return [{
        id: polygon.id,
        coordinates: polygon.coordinates,
        centroid,
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


  // Areas assigned to the signed-in rep, for the area switcher button.
  const myAssignedAreas = useMemo(
    () => polygons.filter(
      (polygon) => Number(polygon.assignee?.id) === Number(session?.user?.id),
    ),
    [polygons, session?.user?.id],
  );
  const areaSwitchIndexRef = useRef(0);

  const handleSwitchArea = useCallback(() => {
    if (myAssignedAreas.length === 0) {
      Alert.alert('No assigned areas', 'Areas assigned to you will show up here.');
      return;
    }
    const nextArea = myAssignedAreas[areaSwitchIndexRef.current % myAssignedAreas.length];
    areaSwitchIndexRef.current += 1;
    const nextRegion = getMapRegionFromCoordinates(nextArea.coordinates);
    if (nextRegion) {
      mapRef.current?.animateToRegion(nextRegion, 550);
    }
  }, [myAssignedAreas]);

  const handleOpenFilter = useCallback(() => {
    // Seam: wire the chosen status into the house decal overlay (and the
    // houses fetch) once the filter API/design is settled.
    Alert.alert('Filter houses', 'Show doors by status', [
      ...['All', 'Unworked', 'Follow-up', 'Appointment set', 'Sold', 'Not interested'].map((label) => ({
        text: label,
        onPress: () => undefined,
      })),
      { text: 'Cancel', style: 'cancel' as const },
    ]);
  }, []);

  return (
    <View style={styles.container}>
      <FloatingButtons
        buttons={[
          {
            icon: <Ionicons name="podium-outline" size={21} color="white" />,
            onPress: () => setShowLeaderboard(true),
            style: { backgroundColor: '#00D1EA' },
            accessibilityLabel: 'Show the leaderboard',
          },
          {
            icon: <MyLocationSvg color="white" />,
            onPress: handleMyLocation,
            style: { backgroundColor: '#00D1EA' },
            accessibilityLabel: 'Center map on my location',
          },
          {
            icon: <Ionicons name="funnel-outline" size={20} color="white" />,
            onPress: handleOpenFilter,
            style: { backgroundColor: '#00D1EA' },
            accessibilityLabel: 'Filter doors by status',
          },
          ...(myAssignedAreas.length > 1 ? [{
            icon: <Ionicons name="swap-horizontal" size={21} color="white" />,
            onPress: handleSwitchArea,
            style: { backgroundColor: '#00D1EA' },
            accessibilityLabel: 'Jump to my next assigned area',
          }] : []),
        ]}
        activeDrawing={mode === 'drawing'}
        onToggleDrawing={mode !== 'reviewingDraft' ? handleToggleDrawing : undefined}
        isManager={isManager}
      />
      <PlainModal
        visible={showLeaderboard}
        title="Leaderboard"
        onClose={() => setShowLeaderboard(false)}
      >
        <LeaderboardCard
          entries={SAMPLE_LEADERBOARD_REPS.slice(0, 10).map((rep, index) => ({
            id: -(index + 1),
            firstName: rep.first,
            lastName: rep.last,
            avatarUrl: `https://randomuser.me/api/portraits/${rep.portrait}.jpg`,
            officeName: index % 5 === 2 ? 'Kaos Cartel' : 'Suntrappers',
            value: rep.value,
          }))}
          metricLabel="knocks"
          isSampleData
        />
      </PlainModal>
      <CustomAlert
        visible={alertVisible}
        onDismiss={() => {
          setAlertVisible(false);
          setIsAreaDeletionPending(false);
        }}
        type={isAreaDeletionPending ? 'confirm' : 'success'}
        onConfirm={() => {
          if (isAreaDeletionPending) {
            void handleDeleteExistingArea();
          }
          setIsAreaDeletionPending(false);
          setAlertVisible(false);
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
          setMessage('Area is Deleted!');
          setOpenAssignModal(false);
          setIsAreaDeletionPending(true);
          setAlertVisible(true);
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
          setOpenManageAreaModal(false);
          setIsAreaDeletionPending(true);
          setMessage('Area is Deleted!');
          setAlertVisible(true);
        }}
        onReassignArea={handleReassignArea}
      />
      <QuickHouseOverviewModal
        onClose={() => setOpenQuickStatusModal(false)}
        visible={openQuickStatusModal}
        selectedHouse={selectedBuilding}
        isStatusSaving={pendingKnock !== null}
        savingStatusId={selectedHousePendingStatusId}
        onOpenHouseInfo={() => {
          setOpenQuickStatusModal(false);
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
      {region && (
        <MapView
          style={styles.map}
          ref={mapRef}
          mapType="hybrid"
          initialRegion={region}
          rotateEnabled
          pitchEnabled={false}
          showsCompass={false}
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
          <AreaLayer areas={areaDisplays} />
          {mode === 'reviewingDraft' ? <DraftAreaPolygon /> : null}
        </MapView>
      )}
      {isStreetZoom && isIdle ? (
        <HouseDecalOverlay
          houses={nearbyBuildingMarkers}
          fit={projectionFit}
          hidden={isMapMoving}
          onHousePress={handleHousePinPress}
        />
      ) : null}
      <AreaLabelOverlay
        areas={areaDisplays}
        fit={projectionFit}
        hidden={isMapMoving || !isIdle}
        labelScale={areaLabelScale}
        onAreaPress={(areaId) => {
          const polygon = polygons.find((candidate) => candidate.id === areaId);
          if (polygon) {
            openManageArea(polygon);
          }
        }}
      />
      {mode === 'reviewingDraft' ? (
        <DraftVertexHandles
          region={viewportRegion ?? region}
          mapRef={mapRef}
          hidden={isMapMoving}
        />
      ) : null}
      {mode === 'drawing' ? (
        <DrawingCanvas onStrokeComplete={handleStrokeComplete} />
      ) : null}
      <MapCompassController
        mapRef={mapRef}
        isEnabled={isScreenFocused && isAppActive}
        controllerRef={compassControllerRef}
      />
      {mode === 'reviewingDraft' ? (
        <GlassSurface
          // Same clear, untinted material the system tab bar renders.
          glassEffectStyle="clear"
          style={[styles.draftActions, { bottom: insets.bottom + 78 }]}
          fallbackStyle={styles.draftActionsFallback}
        >
          <View style={styles.draftButtons}>
            <Button
              text="Cancel"
              onPress={handleDiscardDraft}
              buttonStyle={styles.draftSecondaryButton}
              textStyle={styles.draftSecondaryButtonText}
            />
            <Button
              text="Redraw"
              onPress={handleRedrawDraft}
              buttonStyle={styles.draftSecondaryButton}
              textStyle={styles.draftSecondaryButtonText}
            />
            <Button
              text="Save area"
              onPress={() => void handleSaveDraft()}
              isDisabled={loading}
              buttonStyle={styles.draftPrimaryButton}
              textStyle={styles.draftPrimaryButtonText}
            />
          </View>
        </GlassSurface>
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
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'flex-end',
    zIndex: 6,
  },
  map: {
    ...StyleSheet.absoluteFillObject,
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
    alignItems: 'center',
  },
  myLocationText: {
    color: '#32A0FF',
    fontWeight: 'bold',
  },
  draftActions: {
    position: 'absolute',
    left: 16,
    right: 16,
    bottom: 24,
    // Full capsule, matching the nav bar's rounded dock.
    borderRadius: 34,
    overflow: 'hidden',
    paddingHorizontal: 14,
    paddingVertical: 12,
    zIndex: 11,
  },
  draftActionsFallback: {
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
  },
  draftButtons: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 10,
  },
  draftSecondaryButton: {
    flex: 1,
    height: 44,
    minWidth: 0,
    paddingHorizontal: 10,
    borderRadius: 22,
    backgroundColor: '#FFFFFF',
  },
  draftSecondaryButtonText: {
    color: '#18181B',
    fontWeight: '700',
    fontSize: 13,
  },
  draftPrimaryButton: {
    flex: 1,
    height: 44,
    minWidth: 0,
    paddingHorizontal: 10,
    borderRadius: 22,
    backgroundColor: '#00D1EA',
  },
  draftPrimaryButtonText: {
    color: 'white',
    fontWeight: '700',
    fontSize: 13,
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
    zIndex: 10,
  },
  loaderText: {
    marginTop: 10,
    fontSize: 16,
    fontWeight: 'bold',
    color: 'white',
  },
});
