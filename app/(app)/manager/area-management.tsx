import { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, Pressable, StyleSheet, Text, View } from 'react-native';
import { SettingsShell } from 'components/screens/Settings/SettingsShell';
import { useSession } from 'context/AuthenticationContext';
import { assignTurfArea, fetchTeamRoster, fetchTurfSummary } from 'services/manager-api';
import type { TeamRosterEntry, TurfAreaSummary } from 'types/manager.types';

function coverageColor(coveragePct: number): string {
    if (coveragePct >= 60) {
        return '#16A34A';
    }
    return coveragePct >= 25 ? '#D97706' : '#DC2626';
}

export default function AreaManagementScreen() {
    const { session } = useSession();
    const managerId = Number(session?.user?.id ?? 0);
    const [areas, setAreas] = useState<readonly TurfAreaSummary[] | null>(null);
    const [roster, setRoster] = useState<readonly TeamRosterEntry[]>([]);

    useEffect(() => {
        const controller = new AbortController();
        const signal = controller.signal;
        Promise.all([
            fetchTurfSummary({ managerId, signal }),
            fetchTeamRoster({ managerId, signal }),
        ])
            .then(([areasResult, rosterResult]) => {
                setAreas(areasResult);
                setRoster(rosterResult);
            })
            .catch(() => undefined);
        return () => controller.abort();
    }, [managerId]);

    const pickAssignee = (area: TurfAreaSummary) => {
        Alert.alert('Assign turf', area.name, [
            ...roster.slice(0, 6).map((rep) => ({
                text: `${rep.firstName} ${rep.lastName}`,
                onPress: () => {
                    // Optimistic; real API failure handling arrives with the backend.
                    void assignTurfArea({ areaId: area.id, repId: rep.repId });
                    setAreas((current) =>
                        current
                            ? current.map((entry) =>
                                entry.id === area.id
                                    ? { ...entry, assignedRepName: `${rep.firstName} ${rep.lastName}` }
                                    : entry,
                            )
                            : current,
                    );
                },
            })),
            { text: 'Cancel', style: 'cancel' },
        ]);
    };

    if (!areas) {
        return (
            <SettingsShell title="Area management">
                <ActivityIndicator style={styles.loading} color="#18181B" />
            </SettingsShell>
        );
    }

    return (
        <SettingsShell title="Area management">
            <Text style={styles.summary}>
                {areas.filter((area) => !area.assignedRepName).length} unassigned ·
                {' '}{areas.length} areas total
            </Text>
            {areas.map((area) => {
                const coveragePct = area.doorsTotal > 0
                    ? Math.round((area.doorsKnockedThisWeek / area.doorsTotal) * 100)
                    : 0;
                return (
                    <View key={area.id} style={styles.card}>
                        <View style={styles.cardHeader}>
                            <View style={styles.titleBlock}>
                                <Text style={styles.areaName}>{area.name}</Text>
                                <Text style={styles.areaMeta}>
                                    {area.lastWorkedDaysAgo === null
                                        ? 'Never worked'
                                        : area.lastWorkedDaysAgo === 0
                                            ? 'Worked today'
                                            : `Last worked ${area.lastWorkedDaysAgo}d ago`}
                                    {area.conversionRatePct > 0 ? ` · ${area.conversionRatePct}% conv.` : ''}
                                </Text>
                            </View>
                            <Pressable
                                accessibilityRole="button"
                                accessibilityLabel={`Assign ${area.name}`}
                                onPress={() => pickAssignee(area)}
                                style={({ pressed }) => [
                                    styles.assignChip,
                                    !area.assignedRepName && styles.assignChipEmpty,
                                    pressed && styles.pressed,
                                ]}
                            >
                                <Text
                                    style={[styles.assignChipText, !area.assignedRepName && styles.assignChipTextEmpty]}
                                    numberOfLines={1}
                                >
                                    {area.assignedRepName ?? 'Assign'}
                                </Text>
                            </Pressable>
                        </View>
                        <View style={styles.coverageRow}>
                            <View style={styles.coverageTrack}>
                                <View
                                    style={[
                                        styles.coverageFill,
                                        { width: `${Math.max(coveragePct, 2)}%`, backgroundColor: coverageColor(coveragePct) },
                                    ]}
                                />
                            </View>
                            <Text style={styles.coverageText}>
                                {area.doorsKnockedThisWeek}/{area.doorsTotal} doors
                            </Text>
                        </View>
                    </View>
                );
            })}
        </SettingsShell>
    );
}

const styles = StyleSheet.create({
    loading: {
        marginTop: 48,
    },
    summary: {
        fontSize: 13,
        fontWeight: '600',
        color: '#71717A',
        marginBottom: 2,
    },
    card: {
        backgroundColor: '#FFFFFF',
        borderRadius: 12,
        borderWidth: 1,
        borderColor: '#D4D4D8',
        padding: 14,
        gap: 10,
    },
    cardHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
    },
    titleBlock: {
        flex: 1,
        gap: 1,
    },
    areaName: {
        fontSize: 15,
        fontWeight: '700',
        color: '#18181B',
    },
    areaMeta: {
        fontSize: 12,
        color: '#71717A',
    },
    assignChip: {
        maxWidth: 140,
        borderRadius: 8,
        backgroundColor: '#F4F4F5',
        paddingHorizontal: 10,
        paddingVertical: 6,
    },
    assignChipEmpty: {
        backgroundColor: '#18181B',
    },
    pressed: {
        opacity: 0.7,
    },
    assignChipText: {
        fontSize: 12,
        fontWeight: '700',
        color: '#18181B',
    },
    assignChipTextEmpty: {
        color: '#FFFFFF',
    },
    coverageRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
    },
    coverageTrack: {
        flex: 1,
        height: 8,
        borderRadius: 4,
        backgroundColor: '#F4F4F5',
        overflow: 'hidden',
    },
    coverageFill: {
        height: 8,
        borderRadius: 4,
    },
    coverageText: {
        fontSize: 11,
        fontWeight: '700',
        color: '#71717A',
    },
});
