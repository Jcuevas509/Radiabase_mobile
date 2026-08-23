import { useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, Pressable, StyleSheet, Text, View } from 'react-native';
import { SettingsCard, SettingsShell, ValueRow } from 'components/screens/Settings/SettingsShell';
import { fetchRepPerformance, saveRepWeeklyGoal } from 'services/manager-api';
import type { RepFunnel, RepPerformance } from 'types/manager.types';

const FUNNEL_STAGES: ReadonlyArray<{ key: keyof RepFunnel; label: string }> = [
    { key: 'knocks', label: 'Knocks' },
    { key: 'conversations', label: 'Conversations' },
    { key: 'appointments', label: 'Appointments' },
    { key: 'closes', label: 'Closes' },
];

const GOAL_CHOICES = [200, 250, 300, 350];

function FunnelBar({ label, value, teamAverage, max }: {
    readonly label: string;
    readonly value: number;
    readonly teamAverage: number;
    readonly max: number;
}) {
    const widthPct = max > 0 ? Math.max((value / max) * 100, 2) : 0;
    const aheadOfTeam = value >= teamAverage;
    return (
        <View style={styles.funnelRow}>
            <View style={styles.funnelHeader}>
                <Text style={styles.funnelLabel}>{label}</Text>
                <Text style={styles.funnelValue}>
                    {value}
                    <Text style={[styles.funnelDelta, { color: aheadOfTeam ? '#16A34A' : '#DC2626' }]}>
                        {'  '}team avg {teamAverage}
                    </Text>
                </Text>
            </View>
            <View style={styles.funnelTrack}>
                <View style={[styles.funnelFill, { width: `${widthPct}%` }]} />
            </View>
        </View>
    );
}

export default function RepDetailScreen() {
    const { repId } = useLocalSearchParams<{ repId: string }>();
    const [performance, setPerformance] = useState<RepPerformance | null>(null);

    useEffect(() => {
        const controller = new AbortController();
        fetchRepPerformance({ repId: Number(repId), signal: controller.signal })
            .then(setPerformance)
            .catch(() => undefined);
        return () => controller.abort();
    }, [repId]);

    if (!performance) {
        return (
            <SettingsShell title="Rep">
                <ActivityIndicator style={styles.loading} color="#18181B" />
            </SettingsShell>
        );
    }

    const maxFunnelValue = performance.weekFunnel.knocks;
    const fullName = `${performance.firstName} ${performance.lastName}`;

    const pickGoal = () => {
        Alert.alert('Weekly knock goal', fullName, [
            ...GOAL_CHOICES.map((goal) => ({
                text: `${goal} knocks`,
                onPress: () =>

                    // Optimistic; real API failure handling arrives with the backend.
                    void saveRepWeeklyGoal({ repId: performance.repId, weeklyGoalKnocks: goal }).then(() =>
                        setPerformance((current) =>
                            current ? { ...current, weeklyGoalKnocks: goal } : current,
                        ),
                    ),
            })),
            { text: 'Cancel', style: 'cancel' },
        ]);
    };

    return (
        <SettingsShell title={fullName}>
            <SettingsCard>
                <ValueRow label="Role" value={performance.roleGroup} />
                <ValueRow label="Office" value={performance.officeName} showDivider />
                <ValueRow
                    label="Pipeline value"
                    value={`$${performance.pipelineValue.toLocaleString()}`}
                    showDivider
                />
            </SettingsCard>

            <SettingsCard header="This week's funnel">
                {FUNNEL_STAGES.map((stage) => (
                    <FunnelBar
                        key={stage.key}
                        label={stage.label}
                        value={performance.weekFunnel[stage.key]}
                        teamAverage={performance.teamAverageFunnel[stage.key]}
                        max={maxFunnelValue}
                    />
                ))}
            </SettingsCard>

            <SettingsCard header="Goals">
                <Pressable
                    accessibilityRole="button"
                    accessibilityLabel="Change weekly knock goal"
                    onPress={pickGoal}
                    style={({ pressed }) => [styles.goalRow, pressed && styles.pressed]}
                >
                    <View style={styles.goalBody}>
                        <Text style={styles.goalLabel}>Weekly knock goal</Text>
                        <Text style={styles.goalHint}>
                            {performance.weekFunnel.knocks}/{performance.weeklyGoalKnocks} so far this week
                        </Text>
                    </View>
                    <Text style={styles.goalValue}>{performance.weeklyGoalKnocks}</Text>
                </Pressable>
            </SettingsCard>
        </SettingsShell>
    );
}

const styles = StyleSheet.create({
    loading: {
        marginTop: 48,
    },
    funnelRow: {
        paddingVertical: 8,
        gap: 6,
    },
    funnelHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'baseline',
    },
    funnelLabel: {
        fontSize: 13,
        fontWeight: '600',
        color: '#3F3F46',
    },
    funnelValue: {
        fontSize: 14,
        fontWeight: '800',
        color: '#18181B',
    },
    funnelDelta: {
        fontSize: 10,
        fontWeight: '700',
    },
    funnelTrack: {
        height: 8,
        borderRadius: 4,
        backgroundColor: '#F4F4F5',
        overflow: 'hidden',
    },
    funnelFill: {
        height: 8,
        borderRadius: 4,
        backgroundColor: '#18181B',
    },
    goalRow: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 10,
        gap: 12,
    },
    pressed: {
        opacity: 0.6,
    },
    goalBody: {
        flex: 1,
        gap: 1,
    },
    goalLabel: {
        fontSize: 15,
        fontWeight: '700',
        color: '#18181B',
    },
    goalHint: {
        fontSize: 12,
        color: '#71717A',
    },
    goalValue: {
        fontSize: 18,
        fontWeight: '800',
        color: '#18181B',
    },
});
