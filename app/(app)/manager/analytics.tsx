import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import { SettingsCard, SettingsShell } from 'components/screens/Settings/SettingsShell';
import { useSession } from 'context/AuthenticationContext';
import { fetchManagerAlerts, fetchTeamRoster, fetchTeamSnapshot } from 'services/manager-api';
import type { ManagerAlert, TeamRosterEntry, TeamSnapshot } from 'types/manager.types';

const STATE_COLORS: Record<TeamRosterEntry['activityState'], string> = {
    knocking: '#16A34A',
    idle: '#D97706',
    offline: '#A1A1AA',
};

const ALERT_ICONS: Record<ManagerAlert['kind'], keyof typeof Ionicons.glyphMap> = {
    inactivity: 'time-outline',
    appointment: 'calendar-outline',
    'aging-lead': 'hourglass-outline',
};

function formatLastActivity(minutesAgo: number): string {
    if (minutesAgo < 60) {
        return `${minutesAgo}m ago`;
    }
    const hours = Math.floor(minutesAgo / 60);
    return hours < 24 ? `${hours}h ago` : `${Math.floor(hours / 24)}d ago`;
}

function SnapshotTile({ label, value, changePct }: {
    readonly label: string;
    readonly value: string;
    readonly changePct: number;
}) {
    const changeColor = changePct > 0 ? '#16A34A' : changePct < 0 ? '#DC2626' : '#A1A1AA';
    return (
        <View style={styles.tile}>
            <Text style={styles.tileLabel}>{label}</Text>
            <Text style={styles.tileValue}>{value}</Text>
            <Text style={[styles.tileChange, { color: changeColor }]}>
                {changePct > 0 ? '+' : ''}{changePct}% vs last wk
            </Text>
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
            <SettingsShell title="Analytics">
                <ActivityIndicator style={styles.loading} color="#18181B" />
            </SettingsShell>
        );
    }

    return (
        <SettingsShell title="Analytics">
            <View style={styles.tileRow}>
                <SnapshotTile label="Knocks" value={String(snapshot.knocksToday)} changePct={snapshot.knocksChangePct} />
                <SnapshotTile label="Appts" value={String(snapshot.appointmentsToday)} changePct={snapshot.appointmentsChangePct} />
                <SnapshotTile label="Deals" value={String(snapshot.dealsToday)} changePct={snapshot.dealsChangePct} />
            </View>

            <SettingsCard header={`Out right now · ${snapshot.repsActive}/${snapshot.repsTotal} active`}>
                {roster.map((rep, index) => (
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
                                {rep.officeName}{rep.currentAreaName ? ` · ${rep.currentAreaName}` : ''}
                            </Text>
                        </View>
                        <View style={styles.repRight}>
                            <Text style={styles.repKnocks}>{rep.knocksToday} knocks</Text>
                            <Text style={styles.repTime}>{formatLastActivity(rep.lastActivityMinutesAgo)}</Text>
                        </View>
                        <Ionicons name="chevron-forward" size={16} color="#A1A1AA" />
                    </Pressable>
                ))}
            </SettingsCard>

            <SettingsCard header="Alerts">
                {alerts.map((alert, index) => (
                    <View key={alert.id} style={[styles.alertRow, index > 0 && styles.divider]}>
                        <View style={styles.alertIcon}>
                            <Ionicons name={ALERT_ICONS[alert.kind]} size={17} color="#B45309" />
                        </View>
                        <Text style={styles.alertMessage}>{alert.message}</Text>
                        <Text style={styles.alertTime}>{formatLastActivity(alert.minutesAgo)}</Text>
                    </View>
                ))}
            </SettingsCard>
        </SettingsShell>
    );
}

const styles = StyleSheet.create({
    loading: {
        marginTop: 48,
    },
    tileRow: {
        flexDirection: 'row',
        gap: 10,
    },
    tile: {
        flex: 1,
        backgroundColor: '#FFFFFF',
        borderRadius: 12,
        borderWidth: 1,
        borderColor: '#D4D4D8',
        paddingVertical: 12,
        paddingHorizontal: 12,
        gap: 2,
    },
    tileLabel: {
        fontSize: 12,
        fontWeight: '500',
        color: '#71717A',
    },
    tileValue: {
        fontSize: 24,
        fontWeight: '700',
        color: '#18181B',
    },
    tileChange: {
        fontSize: 10,
        fontWeight: '800',
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
        fontWeight: '700',
        color: '#18181B',
    },
    repMeta: {
        fontSize: 12,
        color: '#71717A',
    },
    repRight: {
        alignItems: 'flex-end',
        gap: 1,
    },
    repKnocks: {
        fontSize: 13,
        fontWeight: '700',
        color: '#18181B',
    },
    repTime: {
        fontSize: 11,
        color: '#A1A1AA',
    },
    alertRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
        paddingVertical: 11,
    },
    alertIcon: {
        width: 32,
        height: 32,
        borderRadius: 16,
        backgroundColor: '#FEF3C7',
        alignItems: 'center',
        justifyContent: 'center',
    },
    alertMessage: {
        flex: 1,
        fontSize: 13,
        color: '#18181B',
        lineHeight: 18,
    },
    alertTime: {
        fontSize: 11,
        color: '#A1A1AA',
    },
});
