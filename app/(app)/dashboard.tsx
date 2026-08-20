import React, { useEffect, useState } from 'react';
import {
    Alert,
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
import { LeaderboardCard, type LeaderboardEntry } from 'components/Card/LeaderboardCard';
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
// exists. The row renders whatever number it is given.
const REVIEWS_COUNT_PLACEHOLDER = 72;

// Temp portrait until the profile API serves a real avatar URL.
const AVATAR_URL_PLACEHOLDER = 'https://randomuser.me/api/portraits/men/32.jpg';

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
    const [leaderboardMetric, setLeaderboardMetric] = useState<'Knocks' | 'Deals' | 'Installs'>('Knocks');
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
    const notificationCount = 0;
    // Knocks and Deals come from the live field-stats API; the other four
    // are zero until the stats endpoint reports them - swap each value for
    // its API field here and the grid needs no other change.
    const performanceMetrics = [
        { label: 'Knocks', value: contactData.knocks },
        { label: 'Sets', value: 0 },
        { label: 'Sits', value: 0 },
        { label: 'Deals', value: contactData.customers },
        { label: 'Cancels', value: 0 },
        { label: 'Installs', value: 0 },
    ];
    // Seam for the leaderboard backend: replace these rows with the fetched
    // standings for the selected metric. The current user's Knocks/Deals are
    // live so their row moves with the period toggle.
    const currentUserMetricValue = leaderboardMetric === 'Knocks'
        ? contactData.knocks
        : leaderboardMetric === 'Deals'
            ? contactData.customers
            : 0;
    const leaderboardEntries: LeaderboardEntry[] = [
        { id: -1, firstName: 'Marcus', lastName: 'Rivera', value: 96 },
        { id: -2, firstName: 'Dana', lastName: 'Whitfield', value: 71 },
        {
            id: Number(session?.user?.id ?? 0),
            firstName: session?.user?.firstName ?? 'You',
            lastName: session?.user?.lastName ?? '',
            value: currentUserMetricValue,
            isCurrentUser: true,
        },
        { id: -3, firstName: 'Priya', lastName: 'Shah', value: 12 },
    ];

    const openLeaderboardFilter = () => {
        Alert.alert('Leaderboard metric', undefined, [
            { text: 'Knocks', onPress: () => setLeaderboardMetric('Knocks') },
            { text: 'Deals', onPress: () => setLeaderboardMetric('Deals') },
            { text: 'Installs', onPress: () => setLeaderboardMetric('Installs') },
            { text: 'Cancel', style: 'cancel' },
        ]);
    };

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
                                imageUrl={AVATAR_URL_PLACEHOLDER}
                                size={60}
                                color="#18181B"
                            />
                        </View>
                        <View style={styles.presenceDot} />
                    </View>
                    <View style={styles.heroTextBlock}>
                        <Text style={styles.greeting}>Hi, {firstName} 👋</Text>
                        <View style={styles.reviewsRow}>
                            {[0, 1, 2, 3, 4].map((starIndex) => (
                                <View key={starIndex} style={styles.starWrap}>
                                    <Ionicons name="star" size={19} color="#18181B" style={styles.starStroke} />
                                    <Ionicons name="star" size={13} color="#FBBF24" />
                                </View>
                            ))}
                            <Text style={styles.reviewsCount}>
                                {REVIEWS_COUNT_PLACEHOLDER.toLocaleString()} reviews
                            </Text>
                        </View>
                    </View>
                </View>

                <View style={styles.section}>
                    <View style={styles.sectionHeader}>
                        <Text style={styles.sectionTitle}>Assigned area</Text>
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
                    <View style={styles.statsGrid}>
                        {performanceMetrics.map((metric) => (
                            <View key={metric.label} style={styles.statCard}>
                                <Text style={styles.statLabel}>{metric.label}</Text>
                                <Text style={styles.statNumber}>{metric.value}</Text>
                            </View>
                        ))}
                    </View>
                </View>

                <View style={styles.section}>
                    <View style={styles.sectionHeader}>
                        <Text style={styles.sectionTitle}>Leaderboard</Text>
                        <TouchableOpacity
                            accessibilityRole="button"
                            accessibilityLabel="Filter leaderboard metric"
                            style={styles.filterButton}
                            onPress={openLeaderboardFilter}
                        >
                            <Ionicons name="filter-outline" size={15} color="#18181B" />
                            <Text style={styles.filterButtonText}>{leaderboardMetric}</Text>
                        </TouchableOpacity>
                    </View>
                    <LeaderboardCard
                        entries={leaderboardEntries}
                        metricLabel={leaderboardMetric.toLowerCase()}
                    />
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
        marginHorizontal: 20,
        marginTop: 2,
        paddingVertical: 8,
        gap: 14,
    },
    avatarWrap: {
        width: 64,
        height: 64,
    },
    avatarRing: {
        width: 64,
        height: 64,
        borderRadius: 32,
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
        fontSize: 24,
        fontWeight: '800',
        color: '#18181B',
    },
    reviewsRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 3,
    },
    starWrap: {
        width: 19,
        height: 19,
        alignItems: 'center',
        justifyContent: 'center',
    },
    starStroke: {
        position: 'absolute',
    },
    reviewsCount: {
        marginLeft: 5,
        fontSize: 13,
        fontWeight: '600',
        color: '#71717A',
    },
    section: {
        paddingHorizontal: 20,
        paddingTop: 14,
    },
    sectionHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 8,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: '800',
        color: '#18181B',
    },
    filterButton: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 5,
        backgroundColor: '#FFFFFF',
        borderRadius: 16,
        paddingHorizontal: 12,
        paddingVertical: 7,
        borderWidth: 1,
        borderColor: '#E4E4E7',
    },
    filterButtonText: {
        fontSize: 12,
        fontWeight: '700',
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
        height: 150,
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
        top: 12,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
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
        marginBottom: 8,
    },
    periodChip: {
        flex: 1,
        minHeight: 32,
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
    statsGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 10,
    },
    statCard: {
        width: '31%',
        flexGrow: 1,
        minHeight: 72,
        borderRadius: 12,
        backgroundColor: '#FFFFFF',
        paddingVertical: 10,
        paddingHorizontal: 10,
        justifyContent: 'center',
    },
    statLabel: {
        fontSize: 13,
        fontWeight: '500',
        color: '#71717A',
        marginBottom: 4,
    },
    statNumber: {
        fontSize: 22,
        fontWeight: '700',
        color: '#18181B',
    },
});

export default DashboardScreen;
