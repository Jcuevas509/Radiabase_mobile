import React, { useEffect, useRef, useState } from 'react';
import {
    Alert,
    View,
    StyleSheet,
    Text,
    TouchableOpacity,
    ScrollView,
    ImageBackground,
    Animated,
    Easing,
    ActivityIndicator,
    FlatList,
    useWindowDimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import MapView, { Polygon } from 'react-native-maps';
import Svg, { Circle, Polyline } from 'react-native-svg';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import { GlassSurface } from 'components/GlassSurface';
import { useNavigation } from 'expo-router';
import { useDraftTabAction } from 'hooks/useDraftTabAction';
import { UserAvatar } from 'components/Avatar/UserAvatar';
import { HeaderMenuButton, HeaderMessagesButton } from 'components/Menu/HeaderMenuButton';
import { LeaderboardCard, type LeaderboardEntry } from 'components/Card/LeaderboardCard';
import { useSession } from 'context/AuthenticationContext';
import { fetchFieldStats, fetchMapAreas, FieldStatsResponse, MapAreaResponse } from 'services/area-api';
import { SAMPLE_LEADERBOARD_REPS } from 'services/sample-leaderboard';
import { fetchSalesLeaderboard } from 'services/leaderboard-api';
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
    // Morphed tab bar: this slot is Cancel while a draft is active.
    useDraftTabAction('onCancel');
    const { session } = useSession();
    const { width: windowWidth } = useWindowDimensions();
    const insets = useSafeAreaInsets();
    const [activeTab, setActiveTab] = useState<string>('Today');
    // Sliding gradient pill for the period selector.
    const periodIndexAnim = useRef(new Animated.Value(0)).current;
    const [periodTrackWidth, setPeriodTrackWidth] = useState(0);
    useEffect(() => {
        Animated.spring(periodIndexAnim, {
            toValue: Math.max(0, PERIODS.indexOf(activeTab as typeof PERIODS[number])),
            useNativeDriver: true,
            friction: 10,
            tension: 110,
        }).start();
    }, [activeTab, periodIndexAnim]);
    const periodPillWidth = periodTrackWidth > 0 ? (periodTrackWidth - 8) / PERIODS.length : 0;
    // Border sweep: a slow-rotating oversized gradient behind the
    // leaderboard's inset card reads as a highlight travelling around the
    // border — bottom-left, up, around, and back down the right.
    const borderSweepAnim = useRef(new Animated.Value(0)).current;
    useEffect(() => {
        const loop = Animated.loop(Animated.timing(borderSweepAnim, {
            toValue: 1,
            duration: 14000,
            easing: Easing.linear,
            useNativeDriver: true,
        }));
        loop.start();
        return () => loop.stop();
    }, [borderSweepAnim]);
    const borderSweepRotation = borderSweepAnim.interpolate({
        inputRange: [0, 1],
        outputRange: ['225deg', '585deg'],
    });
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
    // Live ranked closers (net sales). Empty on staging until deals exist,
    // in which case the sample roster keeps the card populated.
    const [liveLeaderboard, setLiveLeaderboard] = useState<LeaderboardEntry[] | null>(null);
    useEffect(() => {
        const controller = new AbortController();
        fetchSalesLeaderboard({ signal: controller.signal })
            .then((rows) => {
                if (rows.length === 0) {
                    return;
                }
                setLiveLeaderboard(rows.map((row) => {
                    const [firstName, ...rest] = row.name.split(' ');
                    return {
                        id: row.rank,
                        firstName,
                        lastName: rest.join(' '),
                        avatarUrl: null,
                        officeName: null,
                        value: row.totalSales,
                    };
                }));
            })
            .catch(() => undefined);
        return () => controller.abort();
    }, []);
    const turfCardWidth = windowWidth - 44;

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
    const allLeaderboardEntries: LeaderboardEntry[] = liveLeaderboard ?? [
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
        <SafeAreaView style={styles.safeArea} edges={[]}>
            <LinearGradient
                colors={['#067A90', '#0AA6BE', '#00CFE8']}
                locations={[0, 0.55, 1]}
                start={{ x: 0.1, y: 0 }}
                end={{ x: 0.7, y: 1 }}
                style={[styles.headerBand, { paddingTop: insets.top + 6 }]}
            >
                <View style={styles.headerIdentity}>
                    <View style={styles.headerMenuSlot}>
                        <HeaderMenuButton color="#FFFFFF" />
                    </View>
                    <Text style={styles.headerGreeting} numberOfLines={1}>
                        Welcome,{'  '}{firstName}
                    </Text>
                </View>
                <View style={styles.headerRightGroup}>
                    <HeaderMessagesButton color="#FFFFFF" />
                    <TouchableOpacity
                        accessibilityRole="button"
                        accessibilityLabel="Notifications"
                        hitSlop={12}
                    >
                        <Ionicons name="notifications" size={24} color="#FFFFFF" />
                        {notificationCount > 0 ? (
                            <View style={styles.bellBadge}>
                                <Text style={styles.bellBadgeText}>{notificationCount}</Text>
                            </View>
                        ) : null}
                    </TouchableOpacity>
                </View>
            </LinearGradient>
            <View style={styles.content}>
                {/* Subtle radial waves rising from the bottom of the sheet. */}
                <View style={StyleSheet.absoluteFill} pointerEvents="none">
                    <Svg width="100%" height="100%">
                        {[0, 1, 2, 3, 4, 5, 6].map((ring) => (
                            <Circle
                                key={ring}
                                cx="50%"
                                cy="112%"
                                r={windowWidth * 0.34 + ring * 78}
                                stroke="#00AFC6"
                                strokeOpacity={0.07}
                                strokeWidth={1.6}
                                fill="none"
                            />
                        ))}
                    </Svg>
                </View>
                <ScrollView style={styles.scrollArea} contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 96 }]}>
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
                                        <GlassSurface
                                            glassEffectStyle="clear"
                                            style={[styles.turfGlassRim, { width: turfCardWidth }]}
                                            fallbackStyle={styles.turfGlassRimFallback}
                                        >
                                        <TouchableOpacity
                                            style={styles.turfCard}
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
                                        </GlassSurface>
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
                        <Text style={styles.sectionTitle}>{'Activity / Performance\u00A0'}</Text>
                    </View>
                    {/* Brand-styled period selector: white track, selected
                        pill in the nav bar's colorway (turquoise on light). */}
                    <View
                        style={styles.periodRow}
                        onLayout={(event) => setPeriodTrackWidth(event.nativeEvent.layout.width)}
                    >
                        {periodPillWidth > 0 ? (
                            <Animated.View
                                style={[
                                    styles.periodPill,
                                    {
                                        width: periodPillWidth,
                                        transform: [{
                                            translateX: Animated.multiply(periodIndexAnim, periodPillWidth),
                                        }],
                                    },
                                ]}
                            >
                                <LinearGradient
                                    colors={['#09090B', '#26262B', '#4A4A52']}
                                    locations={[0, 0.55, 1]}
                                    start={{ x: 0.1, y: 0 }}
                                    end={{ x: 0.7, y: 1 }}
                                    style={StyleSheet.absoluteFill}
                                />
                            </Animated.View>
                        ) : null}
                        {PERIODS.map((title) => {
                            const isActive = activeTab === title;
                            return (
                                <TouchableOpacity
                                    key={title}
                                    onPress={() => setActiveTab(title)}
                                    style={styles.periodChip}
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
                    <View style={styles.leaderboardBorder}>
                        <Animated.View
                            pointerEvents="none"
                            style={[styles.borderSweep, { transform: [{ rotate: borderSweepRotation }] }]}
                        >
                            <LinearGradient
                                colors={['#141416', '#141416', '#DCDCDF', '#141416', '#141416']}
                                locations={[0, 0.32, 0.5, 0.68, 1]}
                                start={{ x: 0, y: 0.5 }}
                                end={{ x: 1, y: 0.5 }}
                                style={StyleSheet.absoluteFill}
                            />
                        </Animated.View>
                    <LeaderboardCard
                        entries={leaderboardEntries}
                        metricLabel={leaderboardMetric.toLowerCase()}
                        rankOffset={(clampedLeaderboardPage - 1) * LEADERBOARD_PAGE_SIZE}
                        page={clampedLeaderboardPage}
                        pageCount={leaderboardPageCount}
                        fillToCount={leaderboardPageCount > 1 ? LEADERBOARD_PAGE_SIZE : undefined}
                        totalCount={allLeaderboardEntries.length}
                        onPageChange={setLeaderboardPage}
                        isSampleData={!liveLeaderboard}
                    />
                    </View>
                </View>
                </ScrollView>
            </View>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    safeArea: {
        flex: 1,
        backgroundColor: '#F1F2F4',
    },
    headerBand: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 16,
        // Room for the content sheet's rounded corners to overlap the band.
        paddingBottom: 40,
    },
    headerIdentity: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
        flex: 1,
    },

    headerGreeting: {
        // flex:1 gives the text the full remaining row width — custom OTF
        // metrics under-measure otherwise and ellipsize early.
        flex: 1,
        fontFamily: 'ClashGrotesk-Bold',
        fontSize: 20,
        color: '#FFFFFF',
    },
    headerMenuSlot: {
        marginRight: 4,
    },
    headerTitle: {
        fontSize: 20,
        fontFamily: 'ClashGrotesk-Bold',
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
    headerRightGroup: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'flex-end',
        gap: 26,
        minWidth: 44,
        height: 44,
        marginRight: 8,
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
        fontFamily: 'ClashGrotesk-Bold',
    },
    content: {
        flex: 1,
        marginTop: -26,
        borderTopLeftRadius: 26,
        borderTopRightRadius: 26,
        backgroundColor: '#F1F2F4',
        overflow: 'hidden',
    },
    scrollArea: {
        flex: 1,
        backgroundColor: 'transparent',
    },

    scrollContent: {},
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
        fontFamily: 'ClashGrotesk-Bold',
        color: '#18181B',
    },
    heroTitleRow: {
        fontSize: 13,
        fontFamily: 'ClashGrotesk-Semibold',
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
        fontFamily: 'ClashGrotesk-Semibold',
        color: '#71717A',
    },
    section: {
        paddingHorizontal: 22,
        paddingTop: 14,
    },
    sectionHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 8,
    },
    sectionTitle: {
        // Clash's metrics under-measure; padding keeps the last glyph
        // from clipping.
        paddingRight: 14,
        marginLeft: 1,
        fontSize: 21,
        fontFamily: 'ClashGrotesk-Semibold',
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
        borderRadius: 20,
        paddingHorizontal: 13,
        paddingVertical: 8,
        borderWidth: StyleSheet.hairlineWidth,
        borderColor: 'rgba(24, 24, 27, 0.08)',
        shadowColor: '#18181B',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.06,
        shadowRadius: 16,
        elevation: 3,
    },
    filterButtonText: {
        fontSize: 12,
        fontFamily: 'ClashGrotesk-Bold',
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
        borderRadius: 18,
        backgroundColor: '#FFFFFF',
        borderWidth: StyleSheet.hairlineWidth,
        borderColor: 'rgba(24, 24, 27, 0.06)',
        shadowColor: '#18181B',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.06,
        shadowRadius: 16,
        elevation: 3,
    },
    emptyTitle: {
        fontSize: 16,
        fontFamily: 'ClashGrotesk-Bold',
        color: '#18181B',
        marginBottom: 4,
    },
    // Bare native glass rim: concentric radii (25 outer, 22 inner at 3px
    // padding), nothing painted around or under it — the material stands
    // on its own, exactly like the nav bar.
    turfGlassRim: {
        borderRadius: 25,
        padding: 3,
        overflow: 'hidden',
    },
    turfGlassRimFallback: {
        backgroundColor: 'rgba(255, 255, 255, 0.5)',
    },
    turfCard: {
        borderRadius: 22,
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
        fontFamily: 'ClashGrotesk-Bold',
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
        backgroundColor: '#FFFFFF',
        borderRadius: 24,
        padding: 4,
        marginBottom: 12,
        borderWidth: StyleSheet.hairlineWidth,
        borderColor: 'rgba(24, 24, 27, 0.07)',
        boxShadow: '0 1px 2px rgba(24, 24, 27, 0.05), 0 10px 26px rgba(24, 24, 27, 0.07), inset 0 1px 0 rgba(255, 255, 255, 0.95)',
    },
    periodPill: {
        position: 'absolute',
        left: 4,
        top: 4,
        bottom: 4,
        borderRadius: 20,
        overflow: 'hidden',
    },
    periodChip: {
        flex: 1,
        minHeight: 40,
        borderRadius: 20,
        alignItems: 'center',
        justifyContent: 'center',
    },
    periodText: {
        fontSize: 14,
        fontFamily: 'ClashGrotesk-Semibold',
        color: '#52525B',
    },
    periodTextActive: {
        color: '#FFFFFF',
    },
    leaderboardBorder: {
        borderRadius: 17,
        padding: 1,
        overflow: 'hidden',
    },
    borderSweep: {
        position: 'absolute',
        top: '-75%',
        left: '-75%',
        width: '250%',
        height: '250%',
    },
    statsGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 12,
    },
    statCard: {
        width: '31%',
        flexGrow: 1,
        minHeight: 72,
        borderRadius: 18,
        borderWidth: StyleSheet.hairlineWidth,
        borderColor: 'rgba(24, 24, 27, 0.07)',
        backgroundColor: '#FFFFFF',
        // Layered elevation: crisp contact shadow + soft ambient, with an
        // inset top-edge highlight catching the light.
        boxShadow: '0 1px 2px rgba(24, 24, 27, 0.05), 0 10px 26px rgba(24, 24, 27, 0.07), inset 0 1px 0 rgba(255, 255, 255, 0.95)',
        paddingVertical: 10,
        paddingHorizontal: 10,
        flexDirection: 'row',
        alignItems: 'flex-end',
        justifyContent: 'space-between',
        gap: 4,
    },
    trendBlock: {
        alignItems: 'flex-end',
        gap: 1,
    },
    trendText: {
        fontSize: 9,
        fontFamily: 'ClashGrotesk-Bold',
    },
    statLabel: {
        fontSize: 13,
        fontFamily: 'ClashGrotesk-Medium',
        color: '#71717A',
        marginBottom: 4,
    },
    statNumber: {
        fontSize: 22,
        fontFamily: 'ClashGrotesk-Bold',
        color: '#18181B',
    },
});

export default DashboardScreen;
