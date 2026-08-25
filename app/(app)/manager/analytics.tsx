import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Svg, { Rect } from 'react-native-svg';
import { SettingsShell } from 'components/screens/Settings/SettingsShell';
import { GlassSurface } from 'components/GlassSurface';
import { CARD_SHADOW, TEAL_GRADIENT } from 'constants/design';
import { useSession } from 'context/AuthenticationContext';
import { fetchManagerAlerts, fetchTeamRoster, fetchTeamSnapshot } from 'services/manager-api';
import type { ManagerAlert, TeamRosterEntry, TeamSnapshot } from 'types/manager.types';

const STATE_COLORS: Record<TeamRosterEntry['activityState'], string> = {
    knocking: '#16A34A',
    idle: '#D97706',
    offline: '#A1A1AA',
};

const STATE_LABELS: Record<TeamRosterEntry['activityState'], string> = {
    knocking: 'Knocking',
    idle: 'Idle',
    offline: 'Offline',
};

const ALERT_META: Record<ManagerAlert['kind'], {
    readonly icon: keyof typeof Ionicons.glyphMap;
    readonly color: string;
}> = {
    inactivity: { icon: 'time-outline', color: '#D97706' },
    appointment: { icon: 'calendar-outline', color: '#6366F1' },
    'aging-lead': { icon: 'hourglass-outline', color: '#DC2626' },
};

/** Sample week shape for the trend card. Seam: GET /team/knocks?period=week. */
const WEEK_TREND = [
    { day: 'M', knocks: 142 },
    { day: 'T', knocks: 176 },
    { day: 'W', knocks: 131 },
    { day: 'T', knocks: 189 },
    { day: 'F', knocks: 204 },
    { day: 'S', knocks: 96 },
    { day: 'S', knocks: 168 },
] as const;

function formatLastActivity(minutesAgo: number): string {
    if (minutesAgo < 60) {
        return `${minutesAgo}m ago`;
    }
    const hours = Math.floor(minutesAgo / 60);
    return hours < 24 ? `${hours}h ago` : `${Math.floor(hours / 24)}d ago`;
}

function PulseStat({ icon, value, label, changePct, showDivider }: {
    readonly icon: keyof typeof Ionicons.glyphMap;
    readonly value: string;
    readonly label: string;
    readonly changePct: number;
    readonly showDivider?: boolean;
}) {
    const changeColor = changePct >= 0 ? '#B8F5D0' : '#FECACA';
    return (
        <View style={[styles.pulseStat, showDivider && styles.pulseStatDivider]}>
            <View style={styles.pulseStatIcon}>
                <Ionicons name={icon} size={16} color="#FFFFFF" />
            </View>
            <View>
                <Text style={styles.pulseStatValue}>{value}</Text>
                <Text style={styles.pulseStatLabel}>{label}</Text>
                <Text style={[styles.pulseStatChange, { color: changeColor }]}>
                    {changePct > 0 ? '+' : ''}{changePct}%
                </Text>
            </View>
        </View>
    );
}

function WeekTrendCard() {
    const max = Math.max(...WEEK_TREND.map((entry) => entry.knocks));
    const barWidth = 26;
    const gap = 14;
    const chartHeight = 84;
    return (
        <View style={styles.trendCard}>
            <View style={styles.trendHeader}>
                <Text style={styles.trendTitle}>Knocks this week</Text>
                <Text style={styles.trendTotal}>
                    {WEEK_TREND.reduce((sum, entry) => sum + entry.knocks, 0).toLocaleString()} total
                </Text>
            </View>
            <Svg width={WEEK_TREND.length * (barWidth + gap) - gap} height={chartHeight}>
                {WEEK_TREND.map((entry, index) => {
                    const barHeight = Math.max(6, (entry.knocks / max) * (chartHeight - 4));
                    const isPeak = entry.knocks === max;
                    return (
                        <Rect
                            key={index}
                            x={index * (barWidth + gap)}
                            y={chartHeight - barHeight}
                            width={barWidth}
                            height={barHeight}
                            rx={7}
                            fill={isPeak ? '#00D1EA' : '#E0F7FB'}
                        />
                    );
                })}
            </Svg>
            <View style={styles.trendLabels}>
                {WEEK_TREND.map((entry, index) => (
                    <Text key={index} style={[styles.trendDay, { width: barWidth, marginRight: index < 6 ? gap : 0 }]}>
                        {entry.day}
                    </Text>
                ))}
            </View>
        </View>
    );
}

export default function AnalyticsScreen() {
    const { session } = useSession();
    const router = useRouter();
    const managerId = Number(session?.user?.id ?? 0);
    const [snapshot, setSnapshot] = useState<TeamSnapshot | null>(null);
    const [roster, setRoster] = useState<readonly TeamRosterEntry[]>([]);
    const [alerts, setAlerts] = useState<readonly ManagerAlert[]>([]);

    useEffect(() => {
        const controller = new AbortController();
        const signal = controller.signal;
        Promise.all([
            fetchTeamSnapshot({ managerId, signal }),
            fetchTeamRoster({ managerId, signal }),
            fetchManagerAlerts({ managerId, signal }),
        ])
            .then(([snapshotResult, rosterResult, alertsResult]) => {
                setSnapshot(snapshotResult);
                setRoster(rosterResult);
                setAlerts(alertsResult);
            })
            .catch(() => undefined);
        return () => controller.abort();
    }, [managerId]);

    if (!snapshot) {
        return (
            <SettingsShell title="Analytics" glassHeader>
                <ActivityIndicator style={styles.loading} color="#18181B" />
            </SettingsShell>
        );
    }

    const activeReps = [...roster].sort((a, b) => b.knocksToday - a.knocksToday);

    return (
        <SettingsShell title="Analytics" glassHeader>
            <LinearGradient
                colors={[...TEAL_GRADIENT]}
                locations={[0, 0.55, 1]}
                start={{ x: 0.1, y: 0 }}
                end={{ x: 0.9, y: 1 }}
                style={styles.heroCard}
            >
                <Text style={styles.heroTitle}>Team pulse</Text>
                <Text style={styles.heroSubtitle}>
                    {snapshot.repsActive} of {snapshot.repsTotal} reps out right now · today vs last week
                </Text>
                <GlassSurface
                    glassEffectStyle="clear"
                    style={styles.pulseGlass}
                    fallbackStyle={styles.pulseFallback}
                >
                    <View style={styles.pulseRow}>
                        <PulseStat
                            icon="hand-left-outline"
                            value={String(snapshot.knocksToday)}
                            label="Knocks"
                            changePct={snapshot.knocksChangePct}
                        />
                        <PulseStat
                            icon="calendar-outline"
                            value={String(snapshot.appointmentsToday)}
                            label="Appts"
                            changePct={snapshot.appointmentsChangePct}
                            showDivider
                        />
                        <PulseStat
                            icon="document-text-outline"
                            value={String(snapshot.dealsToday)}
                            label="Deals"
                            changePct={snapshot.dealsChangePct}
                            showDivider
                        />
                    </View>
                </GlassSurface>
            </LinearGradient>

            <Text style={styles.sectionTitle}>Momentum</Text>
            <WeekTrendCard />

            <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitleInline}>Out right now</Text>
                <View style={styles.activePill}>
                    <View style={styles.activeDot} />
                    <Text style={styles.activePillText}>{snapshot.repsActive} active</Text>
                </View>
            </View>
            <View style={styles.rosterCard}>
                {activeReps.map((rep, index) => (
                    <Pressable
                        key={rep.repId}
                        accessibilityRole="button"
                        accessibilityLabel={`Open ${rep.firstName} ${rep.lastName}`}
                        onPress={() => router.push(`/manager/rep/${rep.repId}` as never)}
                        style={({ pressed }) => [styles.repRow, index > 0 && styles.divider, pressed && styles.pressed]}
                    >
                        <View style={[styles.stateDot, { backgroundColor: STATE_COLORS[rep.activityState] }]} />
                        <View style={styles.repBody}>
                            <Text style={styles.repName}>{rep.firstName} {rep.lastName}</Text>
                            <Text style={styles.repMeta} numberOfLines={1}>
                                {STATE_LABELS[rep.activityState]}
                                {rep.currentAreaName ? ` · ${rep.currentAreaName}` : ''}
                            </Text>
                        </View>
                        <View style={styles.repRight}>
                            <Text style={styles.repKnocks}>{rep.knocksToday}</Text>
                            <Text style={styles.repTime}>{formatLastActivity(rep.lastActivityMinutesAgo)}</Text>
                        </View>
                        <Ionicons name="chevron-forward" size={15} color="#A1A1AA" />
                    </Pressable>
                ))}
            </View>

            <Text style={styles.sectionTitle}>Alerts</Text>
            <View style={styles.cardList}>
                {alerts.map((alert) => {
                    const meta = ALERT_META[alert.kind];
                    return (
                        <View key={alert.id} style={styles.alertCard}>
                            <View style={[styles.alertIcon, { backgroundColor: `${meta.color}1A` }]}>
                                <Ionicons name={meta.icon} size={17} color={meta.color} />
                            </View>
                            <Text style={styles.alertMessage}>{alert.message}</Text>
                            <Text style={styles.alertTime}>{formatLastActivity(alert.minutesAgo)}</Text>
                        </View>
                    );
                })}
            </View>
        </SettingsShell>
    );
}

const styles = StyleSheet.create({
    loading: {
        marginTop: 48,
    },
    heroCard: {
        borderRadius: 26,
        padding: 16,
    },
    heroTitle: {
        fontSize: 22,
        fontFamily: 'ClashGrotesk-Bold',
        color: '#FFFFFF',
    },
    heroSubtitle: {
        marginTop: 2,
        fontSize: 13,
        fontFamily: 'ClashGrotesk-Medium',
        color: '#EAFBFE',
    },
    pulseGlass: {
        borderRadius: 20,
        overflow: 'hidden',
        paddingVertical: 12,
        paddingHorizontal: 10,
        marginTop: 14,
    },
    pulseFallback: {
        backgroundColor: 'rgba(255, 255, 255, 0.22)',
    },
    pulseRow: {
        flexDirection: 'row',
    },
    pulseStat: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 9,
        justifyContent: 'center',
    },
    pulseStatDivider: {
        borderLeftWidth: StyleSheet.hairlineWidth,
        borderLeftColor: 'rgba(255, 255, 255, 0.45)',
    },
    pulseStatIcon: {
        width: 34,
        height: 34,
        borderRadius: 17,
        backgroundColor: 'rgba(255, 255, 255, 0.22)',
        alignItems: 'center',
        justifyContent: 'center',
    },
    pulseStatValue: {
        fontSize: 21,
        fontFamily: 'ClashGrotesk-Bold',
        color: '#FFFFFF',
    },
    pulseStatLabel: {
        fontSize: 11,
        fontFamily: 'ClashGrotesk-Medium',
        color: '#EAFBFE',
    },
    pulseStatChange: {
        fontSize: 11,
        fontFamily: 'ClashGrotesk-Bold',
    },
    sectionTitle: {
        fontSize: 21,
        fontFamily: 'ClashGrotesk-Semibold',
        color: '#18181B',
        marginTop: 22,
        marginBottom: 12,
        marginLeft: 1,
        paddingRight: 14,
    },
    sectionHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginTop: 22,
        marginBottom: 12,
        marginLeft: 1,
    },
    sectionTitleInline: {
        fontSize: 21,
        fontFamily: 'ClashGrotesk-Semibold',
        color: '#18181B',
        paddingRight: 14,
    },
    activePill: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        backgroundColor: 'rgba(22, 163, 74, 0.09)',
        borderRadius: 14,
        paddingHorizontal: 11,
        paddingVertical: 6,
    },
    activeDot: {
        width: 7,
        height: 7,
        borderRadius: 4,
        backgroundColor: '#16A34A',
    },
    activePillText: {
        fontSize: 12,
        fontFamily: 'ClashGrotesk-Bold',
        color: '#16A34A',
    },
    trendCard: {
        backgroundColor: '#FFFFFF',
        borderRadius: 18,
        borderWidth: StyleSheet.hairlineWidth,
        borderColor: 'rgba(24, 24, 27, 0.07)',
        boxShadow: CARD_SHADOW,
        padding: 16,
        alignItems: 'center',
    },
    trendHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        alignSelf: 'stretch',
        marginBottom: 14,
    },
    trendTitle: {
        fontSize: 15,
        fontFamily: 'ClashGrotesk-Semibold',
        color: '#18181B',
    },
    trendTotal: {
        fontSize: 13,
        fontFamily: 'ClashGrotesk-Bold',
        color: '#71717A',
    },
    trendLabels: {
        flexDirection: 'row',
        marginTop: 6,
    },
    trendDay: {
        fontSize: 11,
        fontFamily: 'ClashGrotesk-Semibold',
        color: '#A1A1AA',
        textAlign: 'center',
    },
    rosterCard: {
        backgroundColor: '#FFFFFF',
        borderRadius: 18,
        borderWidth: StyleSheet.hairlineWidth,
        borderColor: 'rgba(24, 24, 27, 0.07)',
        boxShadow: CARD_SHADOW,
        paddingHorizontal: 14,
        paddingVertical: 4,
    },
    repRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
        paddingVertical: 11,
    },
    divider: {
        borderTopWidth: StyleSheet.hairlineWidth,
        borderTopColor: '#E4E4E7',
    },
    pressed: {
        opacity: 0.6,
    },
    stateDot: {
        width: 10,
        height: 10,
        borderRadius: 5,
    },
    repBody: {
        flex: 1,
        gap: 1,
    },
    repName: {
        fontSize: 15,
        fontFamily: 'ClashGrotesk-Semibold',
        color: '#18181B',
    },
    repMeta: {
        fontSize: 12,
        fontFamily: 'ClashGrotesk-Medium',
        color: '#71717A',
    },
    repRight: {
        alignItems: 'flex-end',
        gap: 1,
    },
    repKnocks: {
        fontSize: 15,
        fontFamily: 'ClashGrotesk-Bold',
        color: '#18181B',
    },
    repTime: {
        fontSize: 11,
        fontFamily: 'ClashGrotesk-Medium',
        color: '#A1A1AA',
    },
    cardList: {
        gap: 10,
    },
    alertCard: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 11,
        backgroundColor: '#FFFFFF',
        borderRadius: 16,
        borderWidth: StyleSheet.hairlineWidth,
        borderColor: 'rgba(24, 24, 27, 0.07)',
        boxShadow: CARD_SHADOW,
        paddingHorizontal: 13,
        paddingVertical: 12,
    },
    alertIcon: {
        width: 34,
        height: 34,
        borderRadius: 17,
        alignItems: 'center',
        justifyContent: 'center',
    },
    alertMessage: {
        flex: 1,
        fontSize: 13,
        fontFamily: 'ClashGrotesk-Medium',
        color: '#18181B',
        lineHeight: 18,
    },
    alertTime: {
        fontSize: 11,
        fontFamily: 'ClashGrotesk-Medium',
        color: '#A1A1AA',
    },
});
