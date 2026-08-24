import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    Pressable,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import MapView, { Marker } from 'react-native-maps';
import Svg, { Circle, Path } from 'react-native-svg';
import { SettingsShell } from 'components/screens/Settings/SettingsShell';
import { UserAvatar } from 'components/Avatar/UserAvatar';
import { GlassSurface } from 'components/GlassSurface';
import { useSession } from 'context/AuthenticationContext';
import { fetchOffices } from 'services/manager-api';
import type { OfficeSummary } from 'types/manager.types';

const CARD_SHADOW =
    '0 1px 2px rgba(24, 24, 27, 0.05), 0 10px 26px rgba(24, 24, 27, 0.07), inset 0 1px 0 rgba(255, 255, 255, 0.95)';

const HERO_STATE_ROWS = [
    ['Texas', 'Ohio', 'Missouri'],
    ['Virginia', 'Pennsylvania'],
] as const;

/** Simplified state silhouettes for the office thumbnails, keyed by the
 * office city's state suffix, each with a dot on the office's metro. */
const STATE_ART: Record<string, { readonly path: string; readonly dot: readonly [number, number] }> = {
    TX: {
        path: 'M27 2 L50 2 L50 19 L96 28 L97 60 L89 67 L70 81 L69 98 L54 84 L44 66 L26 68 L2 44 L27 42 Z',
        dot: [64, 28],
    },
    OH: {
        path: 'M10 22 L38 18 Q48 24 58 16 L74 8 L88 14 L88 40 Q88 52 80 62 L68 80 Q60 90 54 82 Q46 88 40 78 Q28 76 22 66 L10 64 Z',
        dot: [52, 52],
    },
    VA: {
        path: 'M6 66 L26 52 L44 30 L52 36 L58 24 L66 30 L94 58 L82 62 L86 74 L64 68 L40 72 L18 72 Z',
        dot: [66, 56],
    },
};

function portraitUrl(portrait: string) {
    return `https://randomuser.me/api/portraits/${portrait}.jpg`;
}

/** Region framing every office, biased left so the pins sit on the right
 * half of the hero and the copy gets the gradient side. */
function networkRegion(offices: readonly OfficeSummary[]) {
    const latitudes = offices.map((office) => office.latitude);
    const longitudes = offices.map((office) => office.longitude);
    const latitude = (Math.min(...latitudes) + Math.max(...latitudes)) / 2;
    const latitudeDelta = Math.max(0.55, (Math.max(...latitudes) - Math.min(...latitudes)) * 1.7);
    const longitudeDelta = Math.max(0.45, (Math.max(...longitudes) - Math.min(...longitudes)) * 1.5);
    const longitude = (Math.min(...longitudes) + Math.max(...longitudes)) / 2 - longitudeDelta * 0.28;
    return { latitude, longitude, latitudeDelta, longitudeDelta };
}

function NetworkStat({
    icon,
    value,
    label,
    showDivider,
}: {
    readonly icon: keyof typeof Ionicons.glyphMap;
    readonly value: string;
    readonly label: string;
    readonly showDivider?: boolean;
}) {
    return (
        <View style={[styles.networkStat, showDivider && styles.networkStatDivider]}>
            <View style={styles.networkStatIcon}>
                <Ionicons name={icon} size={19} color="#FFFFFF" />
            </View>
            <View>
                <Text style={styles.networkStatValue}>{value}</Text>
                <Text style={styles.networkStatLabel}>{label}</Text>
            </View>
        </View>
    );
}

function StateThumb({ accentColor, city }: { readonly accentColor: string; readonly city: string }) {
    const stateAbbrev = city.split(', ')[1] ?? 'TX';
    const art = STATE_ART[stateAbbrev] ?? STATE_ART.TX;
    return (
        <View style={[styles.turfThumb, { backgroundColor: `${accentColor}14` }]}>
            <Svg width={74} height={74} viewBox="0 0 100 100">
                <Path
                    d={art.path}
                    fill={`${accentColor}4D`}
                    stroke={accentColor}
                    strokeWidth={3}
                    strokeLinejoin="round"
                />
                <Circle cx={art.dot[0]} cy={art.dot[1]} r={6} fill="#FFFFFF" />
                <Circle cx={art.dot[0]} cy={art.dot[1]} r={3.6} fill={accentColor} />
            </Svg>
        </View>
    );
}

function OfficeCard({ office, onPress }: { readonly office: OfficeSummary; readonly onPress: () => void }) {
    return (
        <TouchableOpacity style={styles.officeCard} activeOpacity={0.9} onPress={onPress}>
            <View style={styles.officeCardTop}>
                <StateThumb accentColor={office.accentColor} city={office.city} />
                <View style={styles.officeInfo}>
                    <Text style={styles.officeName} numberOfLines={1}>{office.name}</Text>
                    <Text style={styles.officeCity} numberOfLines={1}>{office.city}</Text>
                    <View style={styles.managerRow}>
                        <UserAvatar
                            firstName={office.managerName.split(' ')[0]}
                            lastName={office.managerName.split(' ').slice(1).join(' ')}
                            imageUrl={portraitUrl(office.managerPortrait)}
                            size={30}
                            color={office.accentColor}
                            ringWidth={1}
                        />
                        <View>
                            <Text style={styles.managerLabel}>Manager</Text>
                            <Text style={styles.managerName} numberOfLines={1}>{office.managerName}</Text>
                        </View>
                    </View>
                </View>
                <Ionicons name="chevron-forward" size={17} color="#A1A1AA" style={styles.officeChevron} />
            </View>
            <View style={styles.officeCardFooter}>
                <View style={styles.footerStat}>
                    <Ionicons name="people" size={14} color={office.accentColor} />
                    <Text style={styles.footerStatValue}>{office.repsCount}</Text>
                    <Text style={styles.footerStatLabel}>Reps</Text>
                </View>
                <View style={[styles.footerStat, styles.footerStatDivider]}>
                    <Ionicons name="document-text" size={14} color={office.accentColor} />
                    <Text style={styles.footerStatValue}>{office.dealsThisMonth}</Text>
                    <Text style={styles.footerStatLabel}>Deals</Text>
                </View>
                <View style={[styles.footerStat, styles.footerStatDivider]}>
                    <Ionicons name="close-circle" size={14} color={office.accentColor} />
                    <Text style={styles.footerStatValue}>{office.cancelsThisMonth}</Text>
                    <Text style={styles.footerStatLabel}>Cancels</Text>
                </View>
                <View style={[styles.footerStat, styles.footerStatDivider, styles.footerStatLast]}>
                    <Ionicons name="construct" size={14} color={office.accentColor} />
                    <Text style={styles.footerStatValue}>{office.installsThisMonth}</Text>
                    <Text style={styles.footerStatLabel}>Installs</Text>
                </View>
            </View>
        </TouchableOpacity>
    );
}

export default function OfficesScreen() {
    const router = useRouter();
    const { session } = useSession();
    const managerId = Number(session?.user?.id ?? 0);
    const [offices, setOffices] = useState<readonly OfficeSummary[] | null>(null);

    useEffect(() => {
        const controller = new AbortController();
        fetchOffices({ managerId, signal: controller.signal })
            .then(setOffices)
            .catch(() => undefined);
        return () => controller.abort();
    }, [managerId]);

    const addButton = (
        <Pressable
            accessibilityRole="button"
            accessibilityLabel="Add office"
            hitSlop={8}
            // Seam: opens the create-office flow once the API exists.
            onPress={() => Alert.alert('Add office', 'Office creation is coming with the backend.')}
            style={({ pressed }) => [pressed && styles.addButtonPressed]}
        >
            <GlassSurface
                glassEffectStyle="clear"
                isInteractive
                style={styles.addButton}
                fallbackStyle={styles.addButtonFallback}
            >
                <Ionicons name="add" size={22} color="#18181B" />
            </GlassSurface>
        </Pressable>
    );

    if (!offices) {
        return (
            <SettingsShell title="Offices" headerRight={addButton} glassHeader>
                <ActivityIndicator style={styles.loading} color="#18181B" />
            </SettingsShell>
        );
    }

    const totals = offices.reduce(
        (sum, office) => ({
            reps: sum.reps + office.repsCount,
            deals: sum.deals + office.dealsThisMonth,
            installs: sum.installs + office.installsThisMonth,
        }),
        { reps: 0, deals: 0, installs: 0 },
    );

    return (
        <SettingsShell title="Offices" headerRight={addButton} glassHeader>
            <View style={styles.heroCard}>
                <MapView
                    style={StyleSheet.absoluteFill}
                    mapType="satellite"
                    pointerEvents="none"
                    scrollEnabled={false}
                    zoomEnabled={false}
                    rotateEnabled={false}
                    pitchEnabled={false}
                    region={networkRegion(offices)}
                >
                    {offices.map((office) => (
                        <Marker
                            key={office.id}
                            coordinate={{ latitude: office.latitude, longitude: office.longitude }}
                            anchor={{ x: 0.5, y: 0.5 }}
                        >
                            <View style={styles.heroPinRow}>
                                <Ionicons name="location" size={26} color="#00D1EA" />
                                <View style={styles.heroPinChip}>
                                    <Text style={styles.heroPinChipText}>{office.city.split(',')[0]}</Text>
                                </View>
                            </View>
                        </Marker>
                    ))}
                </MapView>
                <LinearGradient
                    colors={['#067A90', '#0AA6BEE6', '#00CFE800']}
                    locations={[0, 0.42, 0.95]}
                    start={{ x: 0, y: 0.4 }}
                    end={{ x: 1, y: 0.6 }}
                    style={StyleSheet.absoluteFill}
                    pointerEvents="none"
                />
                <View style={styles.heroContent} pointerEvents="none">
                    <Text style={styles.heroTitle}>Office Network</Text>
                    <Text style={styles.heroSubtitle}>{offices.length} active offices</Text>
                    <View style={styles.heroStatesWrap}>
                        {HERO_STATE_ROWS.map((row) => (
                            <View key={row[0]} style={styles.heroStatesRow}>
                                {row.map((state) => (
                                    <View key={state} style={styles.heroStateItem}>
                                        <View style={styles.heroStateBullet} />
                                        <Text style={styles.heroStateText}>{state}</Text>
                                    </View>
                                ))}
                            </View>
                        ))}
                    </View>
                </View>
                <GlassSurface
                    glassEffectStyle="clear"
                    style={styles.networkStatsGlass}
                    fallbackStyle={styles.networkStatsFallback}
                >
                    <View style={styles.networkStatsRow}>
                        <NetworkStat icon="people-outline" value={String(totals.reps)} label="Reps" />
                        <NetworkStat icon="document-text-outline" value={String(totals.deals)} label="Deals" showDivider />
                        <NetworkStat icon="construct-outline" value={String(totals.installs)} label="Installs" showDivider />
                    </View>
                </GlassSurface>
            </View>

            <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>Office Leaderboard</Text>
                <TouchableOpacity
                    accessibilityRole="button"
                    accessibilityLabel="Change performance period"
                    style={styles.periodButton}
                    // Seam: period switcher once office metrics are queryable.
                    onPress={() => Alert.alert('Period', 'Period filtering comes with the metrics API.')}
                >
                    <Text style={styles.periodButtonText}>This month</Text>
                    <Ionicons name="chevron-down" size={14} color="#18181B" />
                </TouchableOpacity>
            </View>

            <View style={styles.officeList}>
                {[...offices].sort((a, b) => b.installsThisMonth - a.installsThisMonth).map((office) => (
                    <OfficeCard
                        key={office.id}
                        office={office}
                        onPress={() => router.push({ pathname: '/(app)/manager/team', params: { office: office.name } })}
                    />
                ))}
            </View>
        </SettingsShell>
    );
}

const styles = StyleSheet.create({
    loading: {
        marginTop: 48,
    },
    // Bare native glass circle — no background or shadow on the glass node.
    addButton: {
        width: 40,
        height: 40,
        borderRadius: 20,
        overflow: 'hidden',
        alignItems: 'center',
        justifyContent: 'center',
    },
    addButtonFallback: {
        backgroundColor: 'rgba(255, 255, 255, 0.5)',
    },
    addButtonPressed: {
        opacity: 0.7,
    },
    heroCard: {
        borderRadius: 26,
        overflow: 'hidden',
        backgroundColor: '#067A90',
        paddingTop: 18,
        paddingHorizontal: 16,
        paddingBottom: 16,
    },
    heroPinRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 2,
    },
    heroPinChip: {
        backgroundColor: 'rgba(16, 24, 28, 0.72)',
        borderRadius: 9,
        paddingHorizontal: 8,
        paddingVertical: 3,
    },
    heroPinChipText: {
        fontSize: 11,
        fontFamily: 'ClashGrotesk-Semibold',
        color: '#FFFFFF',
    },
    heroContent: {
        marginBottom: 44,
    },
    heroTitle: {
        fontSize: 30,
        fontFamily: 'ClashGrotesk-Bold',
        color: '#FFFFFF',
    },
    heroSubtitle: {
        marginTop: 2,
        fontSize: 16,
        fontFamily: 'ClashGrotesk-Medium',
        color: '#EAFBFE',
    },
    heroStatesWrap: {
        gap: 5,
        marginTop: 12,
    },
    heroStatesRow: {
        flexDirection: 'row',
        columnGap: 16,
    },
    heroStateItem: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 7,
    },
    heroStateBullet: {
        width: 5,
        height: 5,
        borderRadius: 3,
        backgroundColor: '#EAFBFE',
    },
    heroStateText: {
        fontSize: 15,
        fontFamily: 'ClashGrotesk-Medium',
        color: '#EAFBFE',
    },
    networkStatsGlass: {
        borderRadius: 20,
        overflow: 'hidden',
        paddingVertical: 12,
        paddingHorizontal: 14,
    },
    networkStatsFallback: {
        backgroundColor: 'rgba(255, 255, 255, 0.22)',
    },
    networkStatsRow: {
        flexDirection: 'row',
    },
    networkStat: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 9,
        justifyContent: 'center',
    },
    networkStatDivider: {
        borderLeftWidth: StyleSheet.hairlineWidth,
        borderLeftColor: 'rgba(255, 255, 255, 0.45)',
    },
    networkStatIcon: {
        width: 38,
        height: 38,
        borderRadius: 19,
        backgroundColor: 'rgba(255, 255, 255, 0.22)',
        alignItems: 'center',
        justifyContent: 'center',
    },
    networkStatValue: {
        fontSize: 27,
        fontFamily: 'ClashGrotesk-Bold',
        color: '#FFFFFF',
    },
    networkStatLabel: {
        fontSize: 13,
        fontFamily: 'ClashGrotesk-Medium',
        color: '#EAFBFE',
    },
    sectionHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginTop: 22,
        marginBottom: 12,
        marginLeft: 1,
    },
    sectionTitle: {
        fontSize: 21,
        fontFamily: 'ClashGrotesk-Semibold',
        color: '#18181B',
        paddingRight: 14,
    },
    periodButton: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 5,
        backgroundColor: '#FFFFFF',
        borderRadius: 20,
        paddingHorizontal: 13,
        paddingVertical: 8,
        borderWidth: StyleSheet.hairlineWidth,
        borderColor: 'rgba(24, 24, 27, 0.08)',
        boxShadow: CARD_SHADOW,
    },
    periodButtonText: {
        fontSize: 12,
        fontFamily: 'ClashGrotesk-Bold',
        color: '#18181B',
    },
    officeList: {
        gap: 14,
    },
    officeCard: {
        backgroundColor: '#FFFFFF',
        borderRadius: 18,
        borderWidth: StyleSheet.hairlineWidth,
        borderColor: 'rgba(24, 24, 27, 0.07)',
        boxShadow: CARD_SHADOW,
        padding: 12,
    },
    officeCardTop: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    turfThumb: {
        width: 96,
        height: 96,
        borderRadius: 14,
        overflow: 'hidden',
        alignItems: 'center',
        justifyContent: 'center',
    },
    officeInfo: {
        flex: 1,
        marginLeft: 12,
        gap: 1,
    },
    officeName: {
        fontSize: 17,
        fontFamily: 'ClashGrotesk-Semibold',
        color: '#18181B',
    },
    officeCity: {
        fontSize: 13,
        fontFamily: 'ClashGrotesk-Medium',
        color: '#71717A',
    },
    managerRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        marginTop: 7,
    },
    managerLabel: {
        fontSize: 10,
        fontFamily: 'ClashGrotesk-Medium',
        color: '#A1A1AA',
    },
    managerName: {
        fontSize: 13,
        fontFamily: 'ClashGrotesk-Semibold',
        color: '#18181B',
    },
    officeChevron: {
        marginLeft: 6,
    },
    officeCardFooter: {
        flexDirection: 'row',
        alignItems: 'center',
        borderTopWidth: StyleSheet.hairlineWidth,
        borderTopColor: '#E4E4E7',
        marginTop: 12,
        paddingTop: 10,
    },
    footerStat: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 5,
    },
    footerStatDivider: {
        borderLeftWidth: StyleSheet.hairlineWidth,
        borderLeftColor: '#E4E4E7',
    },
    footerStatLast: {},
    footerStatValue: {
        fontSize: 14,
        fontFamily: 'ClashGrotesk-Bold',
        color: '#18181B',
    },
    footerStatLabel: {
        fontSize: 12,
        fontFamily: 'ClashGrotesk-Medium',
        color: '#71717A',
    },
});
