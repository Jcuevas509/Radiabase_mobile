import { Ionicons } from '@expo/vector-icons';
import { useEffect, useState } from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import { SettingsShell } from 'components/screens/Settings/SettingsShell';
import { useSession } from 'context/AuthenticationContext';
import { fetchOffices } from 'services/manager-api';
import type { OfficeSummary } from 'types/manager.types';

export default function OfficesScreen() {
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

    if (!offices) {
        return (
            <SettingsShell title="Offices">
                <ActivityIndicator style={styles.loading} color="#18181B" />
            </SettingsShell>
        );
    }

    return (
        <SettingsShell title="Offices">
            {offices.map((office) => (
                <View key={office.id} style={styles.card}>
                    <View style={styles.cardHeader}>
                        <View style={styles.officeIcon}>
                            <Ionicons name="business-outline" size={18} color="#18181B" />
                        </View>
                        <View style={styles.titleBlock}>
                            <Text style={styles.name}>{office.name}</Text>
                            <Text style={styles.city}>{office.city}</Text>
                        </View>
                    </View>
                    <View style={styles.statRow}>
                        <View style={styles.stat}>
                            <Text style={styles.statValue}>{office.repsCount}</Text>
                            <Text style={styles.statLabel}>Reps</Text>
                        </View>
                        <View style={styles.stat}>
                            <Text style={styles.statValue}>{office.dealsThisMonth}</Text>
                            <Text style={styles.statLabel}>Deals this mo.</Text>
                        </View>
                        <View style={styles.stat}>
                            <Text style={styles.statValue}>{office.knocksThisWeek.toLocaleString()}</Text>
                            <Text style={styles.statLabel}>Knocks this wk.</Text>
                        </View>
                    </View>
                </View>
            ))}
        </SettingsShell>
    );
}

const styles = StyleSheet.create({
    loading: {
        marginTop: 48,
    },
    card: {
        backgroundColor: '#FFFFFF',
        borderRadius: 12,
        borderWidth: 1,
        borderColor: '#D4D4D8',
        padding: 14,
        gap: 12,
    },
    cardHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
    },
    officeIcon: {
        width: 36,
        height: 36,
        borderRadius: 18,
        backgroundColor: '#F4F4F5',
        alignItems: 'center',
        justifyContent: 'center',
    },
    titleBlock: {
        flex: 1,
        gap: 1,
    },
    name: {
        fontSize: 15,
        fontWeight: '700',
        color: '#18181B',
    },
    city: {
        fontSize: 12,
        color: '#71717A',
    },
    statRow: {
        flexDirection: 'row',
    },
    stat: {
        flex: 1,
        gap: 1,
    },
    statValue: {
        fontSize: 18,
        fontWeight: '800',
        color: '#18181B',
    },
    statLabel: {
        fontSize: 11,
        color: '#71717A',
    },
});
