import React, { useEffect, useState } from 'react';
import {
    View,
    StyleSheet,
    Text,
    TouchableOpacity,
    ScrollView,
    ActivityIndicator,
    FlatList,
    useWindowDimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import MapView, { Polygon } from 'react-native-maps';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import { useNavigation, DrawerActions } from '@react-navigation/native';
import { UserAvatar } from 'components/Avatar/UserAvatar';
import { useSession } from 'context/AuthenticationContext';
import { fetchFieldStats, fetchMapAreas, FieldStatsResponse, MapAreaResponse } from 'services/area-api';
import { pickDashboardPreviewAreas } from 'utils/pick-dashboard-preview-areas';
import { pickFieldStatsBucket } from 'utils/pick-field-stats-bucket';
import { getMapRegionFromCoordinates } from 'utils/get-map-region-from-coordinates';
import { pickAssigneeColor } from 'utils/pick-assignee-color';
import { hexToRgba } from 'utils/helperFunctions';
import { isHumanAreaName } from 'utils/is-human-area-name';
import { buildAreaName } from 'utils/build-area-name';
import { getPolygonCentroid } from 'utils/get-polygon-centroid';
import * as Location from 'expo-location';

const PERIODS = ['Today', 'This Week', 'This Month'] as const;

// Seam for the reviews backend: replace with the fetched count when the API
// exists. The badge renders whatever number it is given.
const REVIEWS_COUNT_PLACEHOLDER = 0;

function getAreaTileLabel(area: MapAreaResponse, geocodedCity?: string): string {
    if (geocodedCity) {
        return geocodedCity;
    }
    if (isHumanAreaName(area.name)) {
        return area.name as string;
    }
    if (area.assignee) {
        return `${area.assignee.firstName} ${area.assignee.lastName}`.trim();
    }
    return 'Unassigned';
}

function getAreaTileSubtitle(area: MapAreaResponse, sessionUserId: number): string {
    if (!area.assignee) {
        return 'Unassigned area';
    }
    if (area.assignee.id === sessionUserId) {
        return 'Your assigned area';
    }
    return `${area.assignee.firstName} ${area.assignee.lastName}`.trim() || 'Assigned area';
}

const DashboardScreen = () => {
    const navigation = useNavigation();
    const { session } = useSession();
    const { width: windowWidth } = useWindowDimensions();
    const [activeTab, setActiveTab] = useState<string>('Today');
    const [contactData, setContactData] = useState({
        leads: 0,
        knocks: 0,
        customers: 0,
    });
    const [fieldStats, setFieldStats] = useState<FieldStatsResponse | null>(null);
    const [previewAreas, setPreviewAreas] = useState<MapAreaResponse[]>([]);
    const [isLoadingAreas, setIsLoadingAreas] = useState<boolean>(true);
    const [hasAreaError, setHasAreaError] = useState<boolean>(false);
    const [areaCities, setAreaCities] = useState<Record<number, string>>({});
    const [activeTurfIndex, setActiveTurfIndex] = useState(0);
    const turfCardWidth = windowWidth - 40;

    // Label every turf card with the city its turf sits in, resolved
    // on-device from the area centroid. Failures just leave the fallback.
    useEffect(() => {
        let isCancelled = false;
        (async () => {
            for (const area of previewAreas) {
                const centroid = getPolygonCentroid(area.coordinates);
                if (!centroid) {
                    continue;
                }
                try {
                    const [geocoded] = await Location.reverseGeocodeAsync(centroid);
                    const city = buildAreaName({
                        city: geocoded?.city ?? geocoded?.district ?? geocoded?.subregion,
                        state: geocoded?.region,
                    });
                    if (isCancelled) {
                        return;
                    }
                    if (city) {
                        setAreaCities((current) =>
                            current[area.id] === city ? current : { ...current, [area.id]: city });
                    }
                } catch {
                    // Keep the fallback label for this card.
                }
            }
        })();
        return () => {
            isCancelled = true;
        };
    }, [previewAreas]);

    const openMap = () => {
        navigation.navigate('index' as never);
    };

    useEffect(() => {
        if (!fieldStats) {
            return;
        }
        setContactData(pickFieldStatsBucket(fieldStats, activeTab));
    }, [activeTab, fieldStats]);

    useEffect(() => {
        if (!session?.token) {
            return;
        }
        let isCancelled = false;
        setIsLoadingAreas(true);
        fetchMapAreas()
            .then((areas) => {
                if (isCancelled) {
                    return;
                }
                setPreviewAreas(pickDashboardPreviewAreas(areas));
                setHasAreaError(false);
            })
            .catch(() => {
                if (!isCancelled) {
                    setPreviewAreas([]);
                    setHasAreaError(true);
                }
            })
            .finally(() => {
                if (!isCancelled) {
                    setIsLoadingAreas(false);
                }
            });
        fetchFieldStats()
            .then((stats) => {
                if (!isCancelled) {
                    setFieldStats(stats);
                }
            })
            .catch(() => {
                if (!isCancelled) {
                    setFieldStats({
                        today: { leads: 0, knocks: 0, customers: 0 },
                        week: { leads: 0, knocks: 0, customers: 0 },
                        month: { leads: 0, knocks: 0, customers: 0 },
                    });
                }
            });
        return () => {
            isCancelled = true;
        };
    }, [session?.token]);

    const firstName = session?.user?.firstName?.trim() || 'there';
    const fullName = `${session?.user?.firstName ?? ''} ${session?.user?.lastName ?? ''}`.trim();
    const roleLabel = session?.user?.roleLabel?.trim() || 'Setter';
    const sessionUserId = Number(session?.user?.id ?? 0);
    const notificationCount = 0;

    return (
        <SafeAreaView style={styles.safeArea} edges={['top']}>
            <View style={styles.header}>
                <TouchableOpacity
                    onPress={() => navigation.dispatch(DrawerActions.openDrawer())}
                    hitSlop={12}
                    style={styles.headerSide}
                >
                    <MaterialIcons name="menu" size={28} color="#18181B" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Home</Text>
                <View style={[styles.headerSide, styles.headerRight]}>
                    <TouchableOpacity
                        accessibilityRole="button"
                        accessibilityLabel="Notifications"
                        hitSlop={12}
                    >
                        <Ionicons name="notifications-outline" size={24} color="#18181B" />
                        {notificationCount > 0 ? (
                            <View style={styles.bellBadge}>
                                <Text style={styles.bellBadgeText}>{notificationCount}</Text>
                            </View>
                        ) : null}
                    </TouchableOpacity>
                </View>
            </View>
            <ScrollView style={styles.content} contentContainerStyle={styles.scrollContent}>
                <View style={styles.heroCard}>
                    <View style={styles.avatarWrap}>
                        <View style={styles.avatarRing}>
                            <UserAvatar
                                firstName={session?.user?.firstName ?? ''}
                                lastName={session?.user?.lastName ?? ''}
                                size={64}
                                color="#1687E8"
                            />
                        </View>
                        <View style={styles.presenceDot} />
                    </View>
                    <View style={styles.heroTextBlock}>
                        <Text style={styles.greeting}>Hi, {firstName} 👋</Text>
                        <Text style={styles.heroMeta} numberOfLines={1}>
                            {[fullName, roleLabel].filter(Boolean).join(' · ')}
                        </Text>
                    </View>
                    <View style={styles.reviewsBadge}>
                        <Ionicons name="star-outline" size={20} color="#18181B" />
                        <Text style={styles.reviewsCount}>
                            {REVIEWS_COUNT_PLACEHOLDER.toLocaleString()}
                        </Text>
                    </View>
                </View>

                <View style={styles.section}>
                    <View style={styles.sectionHeader}>
                        <Text style={styles.sectionTitle}>Your turf</Text>
                    </View>
                    {isLoadingAreas ? (
                        <ActivityIndicator style={styles.loader} color="#32A0FF" />
                    ) : hasAreaError ? (
                        <Text style={styles.statusText}>Could not load areas. Pull to refresh after checking login.</Text>
                    ) : previewAreas.length === 0 ? (
                        <View style={styles.emptyCard}>
                            <Text style={styles.emptyTitle}>No turf yet</Text>
                            <Text style={styles.statusText}>
                                Assigned areas will show up here. You can still open the map.
                            </Text>
                        </View>
                    ) : (
                        <View>
                            <FlatList
                                data={previewAreas}
                                horizontal
                                pagingEnabled
                                showsHorizontalScrollIndicator={false}
                                snapToInterval={turfCardWidth + 12}
                                decelerationRate="fast"
                                keyExtractor={(area) => String(area.id)}
                                onMomentumScrollEnd={(event) => {
                                    const index = Math.round(
                                        event.nativeEvent.contentOffset.x / (turfCardWidth + 12),
                                    );
                                    setActiveTurfIndex(Math.max(0, Math.min(index, previewAreas.length - 1)));
                                }}
                                renderItem={({ item: area }) => {
                                    const region = getMapRegionFromCoordinates(area.coordinates);
                                    const stroke = area.assignee
                                        ? pickAssigneeColor(area.assignee.id)
                                        : '#8B8682';
                                    return (
                                        <TouchableOpacity
                                            style={[styles.turfCard, { width: turfCardWidth }]}
                                            onPress={openMap}
                                            activeOpacity={0.9}
                                        >
                                            {region ? (
                                                <MapView
                                                    style={styles.turfMap}
                                                    mapType="satellite"
                                                    region={region}
                                                    scrollEnabled={false}
                                                    zoomEnabled={false}
                                                    rotateEnabled={false}
                                                    pitchEnabled={false}
                                                    pointerEvents="none"
                                                >
                                                    {area.coordinates.length > 2 ? (
                                                        <Polygon
                                                            coordinates={area.coordinates}
                                                            strokeColor={stroke}
                                                            fillColor={hexToRgba(stroke, 0.28)}
                                                            strokeWidth={2}
                                                        />
                                                    ) : null}
                                                </MapView>
                                            ) : (
                                                <View style={[styles.turfMap, styles.mapFallback]} />
                                            )}
                                            <View style={styles.turfOverlay} pointerEvents="none">
                                                <Ionicons
                                                    name="location-outline"
                                                    size={26}
                                                    color="white"
                                                    style={styles.turfPinIcon}
                                                />
                                                <View style={styles.turfOverlayText}>
                                                    <Text style={styles.turfCity} numberOfLines={1}>
                                                        {getAreaTileLabel(area, areaCities[area.id])}
                                                    </Text>
                                                    <Text style={styles.turfSubtitle} numberOfLines={1}>
                                                        {getAreaTileSubtitle(area, sessionUserId)}
                                                    </Text>
                                                </View>
                                            </View>
                                        </TouchableOpacity>
                                    );
                                }}
                                ItemSeparatorComponent={() => <View style={styles.turfSeparator} />}
                            />
                            {previewAreas.length > 1 ? (
                                <View style={styles.pageDots} pointerEvents="none">
                                    {previewAreas.map((area, index) => (
                                        <View
                                            key={area.id}
                                            style={[
                                                styles.pageDot,
                                                index === activeTurfIndex && styles.pageDotActive,
                                            ]}
                                        />
                                    ))}
                                </View>
                            ) : null}
                        </View>
                    )}
                </View>

                <View style={styles.section}>
                    <View style={styles.sectionHeader}>
                        <Text style={styles.sectionTitle}>Activity / Performance</Text>
                    </View>
                    <View style={styles.periodRow}>
                        {PERIODS.map((title) => {
                            const isActive = activeTab === title;
                            return (
                                <TouchableOpacity
                                    key={title}
                                    onPress={() => setActiveTab(title)}
                                    style={[styles.periodChip, isActive && styles.periodChipActive]}
                                >
                                    <Text style={[styles.periodText, isActive && styles.periodTextActive]}>
                                        {title}
                                    </Text>
                                </TouchableOpacity>
                            );
                        })}
                    </View>
                    <View style={styles.statsRow}>
                        <View style={styles.statCard}>
                            <Text style={styles.statLabel}>Leads</Text>
                            <Text style={styles.statNumber}>{contactData.leads}</Text>
                        </View>
                        <View style={styles.statCard}>
                            <Text style={styles.statLabel}>Knocks</Text>
                            <Text style={styles.statNumber}>{contactData.knocks}</Text>
                        </View>
                        <View style={styles.statCard}>
                            <Text style={styles.statLabel}>Customers</Text>
                            <Text style={styles.statNumber}>{contactData.customers}</Text>
                        </View>
                    </View>
                </View>
            </ScrollView>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    safeArea: {
        flex: 1,
        backgroundColor: '#F4F4F5',
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 12,
        paddingVertical: 8,
        backgroundColor: '#F4F4F5',
    },
    headerTitle: {
        fontSize: 20,
        fontWeight: '800',
        color: '#18181B',
    },
    headerSide: {
        width: 44,
        height: 44,
        alignItems: 'flex-start',
        justifyContent: 'center',
    },
    headerRight: {
        alignItems: 'flex-end',
    },
    bellBadge: {
        position: 'absolute',
        top: -4,
        right: -6,
        minWidth: 16,
        height: 16,
        borderRadius: 8,
        backgroundColor: '#1687E8',
        alignItems: 'center',
        justifyContent: 'center',
        paddingHorizontal: 3,
    },
    bellBadgeText: {
        color: 'white',
        fontSize: 10,
        fontWeight: '800',
    },
    content: {
        flex: 1,
    },
    scrollContent: {
        paddingBottom: 32,
    },
    heroCard: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#FFFFFF',
        borderRadius: 18,
        marginHorizontal: 20,
        marginTop: 6,
        paddingHorizontal: 16,
        paddingVertical: 18,
        gap: 14,
    },
    avatarWrap: {
        width: 72,
        height: 72,
    },
    avatarRing: {
        width: 72,
        height: 72,
        borderRadius: 36,
        borderWidth: 2,
        borderColor: '#1687E8',
        alignItems: 'center',
        justifyContent: 'center',
    },
    presenceDot: {
        position: 'absolute',
        bottom: 2,
        right: 2,
        width: 14,
        height: 14,
        borderRadius: 7,
        backgroundColor: '#22C55E',
        borderWidth: 2,
        borderColor: 'white',
    },
    heroTextBlock: {
        flex: 1,
        gap: 3,
    },
    greeting: {
        fontSize: 26,
        fontWeight: '800',
        color: '#18181B',
    },
    heroMeta: {
        fontSize: 14,
        color: '#71717A',
        fontWeight: '500',
    },
    reviewsBadge: {
        minWidth: 62,
        borderRadius: 26,
        backgroundColor: '#FFFFFF',
        borderWidth: 1,
        borderColor: '#E4E4E7',
        alignItems: 'center',
        paddingVertical: 10,
        paddingHorizontal: 10,
        gap: 2,
    },
    reviewsCount: {
        fontSize: 14,
        fontWeight: '800',
        color: '#18181B',
    },
    section: {
        paddingHorizontal: 20,
        paddingTop: 24,
    },
    sectionHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 12,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: '800',
        color: '#18181B',
    },
    loader: {
        marginVertical: 24,
    },
    statusText: {
        fontSize: 14,
        lineHeight: 20,
        color: '#71717A',
    },
    emptyCard: {
        padding: 16,
        borderRadius: 12,
        backgroundColor: '#FFFFFF',
        borderWidth: 1,
        borderColor: '#E4E4E7',
    },
    emptyTitle: {
        fontSize: 16,
        fontWeight: '700',
        color: '#18181B',
        marginBottom: 4,
    },
    turfCard: {
        borderRadius: 18,
        overflow: 'hidden',
        backgroundColor: '#E4E4E7',
    },
    turfMap: {
        width: '100%',
        height: 190,
    },
    mapFallback: {
        backgroundColor: '#E4E4E7',
    },
    turfSeparator: {
        width: 12,
    },
    turfOverlay: {
        position: 'absolute',
        left: 12,
        bottom: 12,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
    },
    turfPinIcon: {
        textShadowColor: 'rgba(0, 0, 0, 0.6)',
        textShadowOffset: { width: 0, height: 1 },
        textShadowRadius: 3,
    },
    turfOverlayText: {
        gap: 1,
    },
    turfCity: {
        color: 'white',
        fontSize: 16,
        fontWeight: '800',
        textShadowColor: 'rgba(0, 0, 0, 0.6)',
        textShadowOffset: { width: 0, height: 1 },
        textShadowRadius: 3,
    },
    turfSubtitle: {
        color: 'rgba(255, 255, 255, 0.92)',
        fontSize: 12,
        fontWeight: '600',
        textShadowColor: 'rgba(0, 0, 0, 0.6)',
        textShadowOffset: { width: 0, height: 1 },
        textShadowRadius: 3,
    },
    pageDots: {
        position: 'absolute',
        right: 12,
        bottom: 12,
        flexDirection: 'row',
        gap: 6,
    },
    pageDot: {
        width: 6,
        height: 6,
        borderRadius: 3,
        backgroundColor: 'rgba(255, 255, 255, 0.55)',
    },
    pageDotActive: {
        width: 16,
        backgroundColor: '#FFFFFF',
    },
    periodRow: {
        flexDirection: 'row',
        backgroundColor: '#E4E4E7',
        borderRadius: 10,
        padding: 3,
        marginBottom: 12,
    },
    periodChip: {
        flex: 1,
        minHeight: 36,
        borderRadius: 8,
        alignItems: 'center',
        justifyContent: 'center',
    },
    periodChipActive: {
        backgroundColor: '#FFFFFF',
    },
    periodText: {
        fontSize: 13,
        fontWeight: '600',
        color: '#71717A',
    },
    periodTextActive: {
        color: '#18181B',
    },
    statsRow: {
        flexDirection: 'row',
        gap: 10,
    },
    statCard: {
        flex: 1,
        minHeight: 92,
        borderRadius: 12,
        backgroundColor: '#FFFFFF',
        paddingVertical: 14,
        paddingHorizontal: 10,
        justifyContent: 'center',
    },
    statLabel: {
        fontSize: 13,
        fontWeight: '500',
        color: '#71717A',
        marginBottom: 8,
    },
    statNumber: {
        fontSize: 26,
        fontWeight: '700',
        color: '#18181B',
    },
});

export default DashboardScreen;
