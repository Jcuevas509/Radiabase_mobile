import React, { useEffect, useState } from 'react';
import {
    View,
    StyleSheet,
    Text,
    TouchableOpacity,
    ScrollView,
    ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { AgentCard } from 'components/Card/AgentCard';
import MapView, { Polygon } from 'react-native-maps';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import { useNavigation, DrawerActions } from '@react-navigation/native';
import { useSession } from 'context/AuthenticationContext';
import { fetchFieldStats, fetchMapAreas, FieldStatsResponse, MapAreaResponse } from 'services/area-api';
import { pickDashboardPreviewAreas } from 'utils/pick-dashboard-preview-areas';
import { pickFieldStatsBucket } from 'utils/pick-field-stats-bucket';
import { getMapRegionFromCoordinates } from 'utils/get-map-region-from-coordinates';
import { pickAssigneeColor } from 'utils/pick-assignee-color';
import { hexToRgba } from 'utils/helperFunctions';

const PERIODS = ['Today', 'This Week', 'This Month'] as const;

function getAreaTileLabel(area: MapAreaResponse): string {
    if (area.name) {
        return area.name;
    }
    if (area.assignee) {
        return `${area.assignee.firstName} ${area.assignee.lastName}`.trim();
    }
    return 'Unassigned';
}

const DashboardScreen = () => {
    const navigation = useNavigation();
    const { session } = useSession();
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

    return (
        <SafeAreaView style={styles.safeArea} edges={['top']}>
            <View style={styles.header}>
                <TouchableOpacity
                    onPress={() => navigation.dispatch(DrawerActions.openDrawer())}
                    hitSlop={12}
                    style={styles.menuHit}
                >
                    <MaterialIcons name="menu" size={28} color="#18181B" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Home</Text>
                <View style={styles.menuHit} />
            </View>
            <ScrollView style={styles.content} contentContainerStyle={styles.scrollContent}>
                <View style={styles.profileBlock}>
                    <AgentCard
                        fromMenu={true}
                        data={{
                            id: Number(session?.user?.id ?? 0),
                            name: session?.user?.firstName ?? '',
                            lastname: session?.user?.lastName ?? '',
                            description: session?.user?.roleLabel ?? 'Sales Representative',
                            salesRole: session?.user?.roleLabel ?? null,
                            officeName: session?.user?.officeName ?? null,
                            structureName: session?.user?.structureName ?? null,
                            color: '#32A0FF',
                        }}
                    />
                    <Text style={styles.greeting}>Hi, {firstName}</Text>
                    <Text style={styles.subtitle}>Open the field map to knock doors and log leads.</Text>
                    <TouchableOpacity style={styles.primaryButton} onPress={openMap}>
                        <Ionicons name="map" size={18} color="#FFFFFF" />
                        <Text style={styles.primaryButtonText}>Open field map</Text>
                    </TouchableOpacity>
                </View>

                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Your turf</Text>
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
                        <View style={styles.areaGrid}>
                            {previewAreas.map((area) => {
                                const region = getMapRegionFromCoordinates(area.coordinates);
                                const stroke = area.assignee
                                    ? pickAssigneeColor(area.assignee.id)
                                    : '#8B8682';
                                return (
                                    <TouchableOpacity
                                        key={area.id}
                                        style={styles.areaCard}
                                        onPress={openMap}
                                        activeOpacity={0.85}
                                    >
                                        {region ? (
                                            <MapView
                                                style={styles.map}
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
                                            <View style={[styles.map, styles.mapFallback]} />
                                        )}
                                        <Text style={styles.areaName} numberOfLines={1}>
                                            {getAreaTileLabel(area)}
                                        </Text>
                                    </TouchableOpacity>
                                );
                            })}
                        </View>
                    )}
                </View>

                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Activity</Text>
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
        backgroundColor: '#FAFAF9',
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 12,
        paddingBottom: 8,
        borderBottomWidth: 1,
        borderBottomColor: '#E4E4E7',
        backgroundColor: '#FFFFFF',
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: '#18181B',
    },
    menuHit: {
        width: 44,
        height: 44,
        alignItems: 'center',
        justifyContent: 'center',
    },
    content: {
        flex: 1,
    },
    scrollContent: {
        paddingBottom: 32,
    },
    profileBlock: {
        backgroundColor: '#FFFFFF',
        paddingHorizontal: 20,
        paddingTop: 16,
        paddingBottom: 20,
        borderBottomWidth: 1,
        borderBottomColor: '#E4E4E7',
    },
    greeting: {
        marginTop: 4,
        fontSize: 24,
        fontWeight: '800',
        color: '#18181B',
    },
    subtitle: {
        marginTop: 6,
        fontSize: 14,
        lineHeight: 20,
        color: '#52525B',
    },
    primaryButton: {
        marginTop: 16,
        height: 48,
        borderRadius: 10,
        backgroundColor: '#18181B',
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
    },
    primaryButtonText: {
        color: '#FFFFFF',
        fontSize: 16,
        fontWeight: '700',
    },
    section: {
        paddingHorizontal: 20,
        paddingTop: 24,
    },
    sectionTitle: {
        fontSize: 16,
        fontWeight: '700',
        color: '#18181B',
        marginBottom: 12,
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
    areaGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 12,
    },
    areaCard: {
        width: '47.5%',
        backgroundColor: '#FFFFFF',
        borderRadius: 12,
        borderWidth: 1,
        borderColor: '#E4E4E7',
        overflow: 'hidden',
        paddingBottom: 10,
    },
    map: {
        width: '100%',
        height: 112,
        backgroundColor: '#E4E4E7',
    },
    mapFallback: {
        backgroundColor: '#E4E4E7',
    },
    areaName: {
        marginTop: 8,
        marginHorizontal: 10,
        fontSize: 14,
        fontWeight: '600',
        color: '#18181B',
    },
    areaMeta: {
        marginTop: 2,
        marginHorizontal: 10,
        fontSize: 12,
        color: '#71717A',
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
        borderWidth: 1,
        borderColor: '#E4E4E7',
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
