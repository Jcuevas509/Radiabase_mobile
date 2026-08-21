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
import Svg, { Polyline } from 'react-native-svg';
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

const LEADERBOARD_PAGE_SIZE = 10;

// Seam for the leaderboard backend: replace this sample roster with the
// fetched standings. Portraits are randomuser placeholders.
const SAMPLE_LEADERBOARD_REPS: ReadonlyArray<{
    first: string; last: string; portrait: string; value: number;
}> = [
    { first: 'Marcus', last: 'Rivera', portrait: 'men/45', value: 128 },
    { first: 'Dana', last: 'Whitfield', portrait: 'women/68', value: 121 },
    { first: 'Priya', last: 'Shah', portrait: 'women/44', value: 117 },
    { first: 'Tyler', last: 'Bennett', portrait: 'men/12', value: 109 },
    { first: 'Alexis', last: 'Moreno', portrait: 'women/21', value: 104 },
    { first: 'Jordan', last: 'Kim', portrait: 'men/76', value: 98 },
    { first: 'Sofia', last: 'Delgado', portrait: 'women/12', value: 93 },
    { first: 'Caleb', last: 'Nguyen', portrait: 'men/61', value: 88 },
    { first: 'Maya', last: 'Thompson', portrait: 'women/33', value: 84 },
    { first: 'Devon', last: 'Brooks', portrait: 'men/23', value: 79 },
    { first: 'Isabella', last: 'Reyes', portrait: 'women/57', value: 73 },
    { first: 'Logan', last: 'Price', portrait: 'men/85', value: 68 },
    { first: 'Amara', last: 'Osei', portrait: 'women/81', value: 62 },
    { first: 'Ethan', last: 'Caldwell', portrait: 'men/37', value: 57 },
    { first: 'Nina', last: 'Volkov', portrait: 'women/26', value: 51 },
    { first: 'Andre', last: 'Fontaine', portrait: 'men/53', value: 46 },
    { first: 'Harper', last: 'Sloane', portrait: 'women/49', value: 41 },
    { first: 'Miguel', last: 'Santana', portrait: 'men/29', value: 37 },
    { first: 'Zoe', last: 'Lambert', portrait: 'women/63', value: 33 },
    { first: 'Trevor', last: 'Hale', portrait: 'men/71', value: 29 },
    { first: 'Camille', last: 'Baptiste', portrait: 'women/17', value: 25 },
    { first: 'Owen', last: 'Mercer', portrait: 'men/18', value: 21 },
    { first: 'Leah', last: 'Ito', portrait: 'women/72', value: 18 },
    { first: 'Ruben', last: 'Castillo', portrait: 'men/64', value: 15 },
    { first: 'Skye', last: 'Donovan', portrait: 'women/38', value: 12 },
    { first: 'Felix', last: 'Aguilar', portrait: 'men/41', value: 9 },
    { first: 'Talia', last: 'Novak', portrait: 'women/55', value: 7 },
    { first: 'Grant', last: 'Ellison', portrait: 'men/8', value: 4 },
    { first: 'Renee', last: 'Okafor', portrait: 'women/29', value: 2 },
];

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

const TREND_POINTS = {
    up: '1,15 11,11 21,13 31,6 41,3',
    down: '1,3 11,7 21,5 31,11 41,15',
    flat: '1,9 11,9 21,10 31,9 41,9',
} as const;

function TrendSparkline({ change }: { readonly change: number }) {
    const direction = change > 0 ? 'up' : change < 0 ? 'down' : 'flat';
    const color = direction === 'up' ? '#16A34A' : direction === 'down' ? '#DC2626' : '#A1A1AA';
    return (
        <View style={styles.trendBlock}>
            <Svg width={42} height={18}>
                <Polyline
                    points={TREND_POINTS[direction]}
                    fill="none"
                    stroke={color}
                    strokeWidth={2}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                />
            </Svg>
            <Text style={[styles.trendText, { color }]}>
                {change > 0 ? '+' : ''}{change}%
            </Text>
        </View>
    );
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
    const [leaderboardRole, setLeaderboardRole] = useState<'Setters' | 'Closers' | 'Self Gens'>('Setters');
    const [leaderboardPage, setLeaderboardPage] = useState(1);
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
    // Placeholder until a notifications backend exists.
    const notificationCount = 7;
    // Sample performance numbers per period ([value, % change vs the prior
    // period]) while the stats endpoint only reports knocks/leads/customers -
    // swap each row for its API fields and the grid needs no other change.
    const SAMPLE_PERFORMANCE: Record<string, ReadonlyArray<readonly [number, number]>> = {
        'Today': [[34, 12], [6, 20], [4, -9], [2, 100], [0, 0], [1, 0]],
        'This Week': [[186, 6], [31, 14], [22, -4], [9, 29], [1, -50], [5, 25]],
        'This Month': [[742, 11], [118, 9], [84, 3], [31, -6], [6, 20], [22, 10]],
    };
    const periodValues = SAMPLE_PERFORMANCE[activeTab] ?? SAMPLE_PERFORMANCE['Today'];
    const METRIC_LABELS = ['Knocks', 'Sets', 'Sits', 'Deals', 'Cancels', 'Installs'];
    const performanceMetrics = METRIC_LABELS.map((label, index) => ({
        label,
        value: periodValues[index][0],
        change: periodValues[index][1],
    }));
    // Seam for the leaderboard backend: replace these rows with the fetched
    // standings for the selected metric. The current user's Knocks/Deals are
    // live so their row moves with the period toggle.
    const currentUserMetricValue = leaderboardMetric === 'Knocks'
        ? contactData.knocks
        : leaderboardMetric === 'Deals'
            ? contactData.customers
            : 0;
    const ROLE_GROUPS: ReadonlyArray<'Setters' | 'Closers' | 'Self Gens'> = ['Setters', 'Closers', 'Self Gens'];
    const allLeaderboardEntries: LeaderboardEntry[] = [
        ...SAMPLE_LEADERBOARD_REPS
            .map((rep, index) => ({
                id: -(index + 1),
                firstName: rep.first,
                lastName: rep.last,
                avatarUrl: `https://randomuser.me/api/portraits/${rep.portrait}.jpg`,
                officeName: index % 5 === 2 ? 'Kaos Cartel' : 'Suntrappers',
                value: rep.value,
                roleGroup: ROLE_GROUPS[index % 3],
            }))
            .filter((rep) => rep.roleGroup === leaderboardRole),
        {
            id: Number(session?.user?.id ?? 0),
            firstName: session?.user?.firstName ?? 'You',
            lastName: session?.user?.lastName ?? '',
            avatarUrl: AVATAR_URL_PLACEHOLDER,
            officeName: session?.user?.officeName ?? 'Suntrappers',
            value: currentUserMetricValue,
            isCurrentUser: true,
        },
    ].sort((first, second) => second.value - first.value);
    const leaderboardPageCount = Math.max(1, Math.ceil(allLeaderboardEntries.length / LEADERBOARD_PAGE_SIZE));
    const clampedLeaderboardPage = Math.min(leaderboardPage, leaderboardPageCount);
    const leaderboardEntries = allLeaderboardEntries.slice(
        (clampedLeaderboardPage - 1) * LEADERBOARD_PAGE_SIZE,
        clampedLeaderboardPage * LEADERBOARD_PAGE_SIZE,
    );

    const openLeaderboardFilter = () => {
        Alert.alert('Leaderboard metric', undefined, [
            { text: 'Knocks', onPress: () => setLeaderboardMetric('Knocks') },
            { text: 'Deals', onPress: () => setLeaderboardMetric('Deals') },
            { text: 'Installs', onPress: () => setLeaderboardMetric('Installs') },
            { text: 'Cancel', style: 'cancel' },
        ]);
    };

    const openLeaderboardRoleFilter = () => {
        const pickRole = (role: 'Setters' | 'Closers' | 'Self Gens') => {
            setLeaderboardRole(role);
            setLeaderboardPage(1);
        };
        Alert.alert('Leaderboard roles', undefined, [
            { text: 'Setters', onPress: () => pickRole('Setters') },
            { text: 'Closers', onPress: () => pickRole('Closers') },
            { text: 'Self Gens', onPress: () => pickRole('Self Gens') },
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
                                ringWidth={1}
                            />
                        </View>
                        <View style={styles.presenceDot} />
                    </View>
                    <View style={styles.heroTextBlock}>
                        <Text style={styles.greeting}>Hi, {firstName} 👋</Text>
                        <Text style={styles.heroTitleRow}>Energy Consultant | Suntapped Energy</Text>
                        <View style={styles.reviewsRow}>
                            {[0, 1, 2, 3, 4].map((starIndex) => (
                                <View key={starIndex} style={styles.starWrap}>
                                    <Ionicons name="star" size={17} color="#18181B" style={styles.starStroke} />
                                    <Ionicons name="star" size={14} color="#FBBF24" />
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
                                <View>
                                    <Text style={styles.statLabel}>{metric.label}</Text>
                                    <Text style={styles.statNumber}>{metric.value}</Text>
                                </View>
                                <TrendSparkline change={metric.change} />
                            </View>
                        ))}
                    </View>
                </View>

                <View style={styles.section}>
                    <View style={styles.sectionHeader}>
                        <Text style={styles.sectionTitle}>Leaderboard</Text>
                        <View style={styles.filterGroup}>
                            <TouchableOpacity
                                accessibilityRole="button"
                                accessibilityLabel="Filter leaderboard roles"
                                style={styles.filterButton}
                                onPress={openLeaderboardRoleFilter}
                            >
                                <Ionicons name="people-outline" size={15} color="#18181B" />
                                <Text style={styles.filterButtonText}>{leaderboardRole}</Text>
                            </TouchableOpacity>
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
                    </View>
                    <LeaderboardCard
                        entries={leaderboardEntries}
                        metricLabel={leaderboardMetric.toLowerCase()}
                        rankOffset={(clampedLeaderboardPage - 1) * LEADERBOARD_PAGE_SIZE}
                        page={clampedLeaderboardPage}
                        pageCount={leaderboardPageCount}
                        totalCount={allLeaderboardEntries.length}
                        onPageChange={setLeaderboardPage}
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
        backgroundColor: '#EF4444',
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
    heroTitleRow: {
        fontSize: 13,
        fontWeight: '600',
        color: '#71717A',
        marginBottom: 2,
    },
    reviewsRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 3,
    },
    starWrap: {
        width: 17,
        height: 17,
        alignItems: 'center',
        justifyContent: 'center',
    },
    starStroke: {
        position: 'absolute',
    },
    reviewsCount: {
        marginLeft: 5,
        fontSize: 13,
        lineHeight: 17,
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
    filterGroup: {
        flexDirection: 'row',
        gap: 6,
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
        borderWidth: 1,
        borderColor: '#D4D4D8',
        backgroundColor: '#FFFFFF',
        paddingVertical: 10,
        paddingHorizontal: 10,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: 4,
    },
    trendBlock: {
        alignItems: 'flex-end',
        gap: 1,
    },
    trendText: {
        fontSize: 9,
        fontWeight: '800',
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
