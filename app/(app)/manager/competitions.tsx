import { Ionicons } from '@expo/vector-icons';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, Pressable, StyleSheet, Text, View } from 'react-native';
import { SettingsShell } from 'components/screens/Settings/SettingsShell';
import { useSession } from 'context/AuthenticationContext';
import { fetchCompetitions } from 'services/manager-api';
import type { Competition } from 'types/manager.types';

export default function CompetitionsScreen() {
    const { session } = useSession();
    const managerId = Number(session?.user?.id ?? 0);
    const [competitions, setCompetitions] = useState<readonly Competition[] | null>(null);

    useEffect(() => {
        const controller = new AbortController();
        fetchCompetitions({ managerId, signal: controller.signal })
            .then(setCompetitions)
            .catch(() => undefined);
        return () => controller.abort();
    }, [managerId]);

    const handleCreate = () => {
        // Seam: replace with a create-competition form + POST /competitions.
        Alert.alert('New competition', 'Competition builder is coming with the backend hookup.');
    };

    if (!competitions) {
        return (
            <SettingsShell title="Competitions">
                <ActivityIndicator style={styles.loading} color="#18181B" />
            </SettingsShell>
        );
    }

    return (
        <SettingsShell title="Competitions">
            {competitions.map((competition) => (
                <View key={competition.id} style={styles.card}>
                    <View style={styles.cardHeader}>
                        <View style={styles.trophy}>
                            <Ionicons name="trophy" size={18} color="#B45309" />
                        </View>
                        <View style={styles.titleBlock}>
                            <Text style={styles.name}>{competition.name}</Text>
                            <Text style={styles.meta}>
                                {competition.metric} · ends in {competition.endsInDays}d
                            </Text>
                        </View>
                    </View>
                    <View style={styles.detailRow}>
                        <Text style={styles.detailLabel}>Leader</Text>
                        <Text style={styles.detailValue}>{competition.leaderName}</Text>
                    </View>
                    <View style={styles.detailRow}>
                        <Text style={styles.detailLabel}>Prize</Text>
                        <Text style={styles.detailValue}>{competition.prize}</Text>
                    </View>
                </View>
            ))}
            <Pressable
                accessibilityRole="button"
                accessibilityLabel="Create competition"
                onPress={handleCreate}
                style={({ pressed }) => [styles.createButton, pressed && styles.pressed]}
            >
                <Ionicons name="add" size={18} color="#FFFFFF" />
                <Text style={styles.createText}>New competition</Text>
            </Pressable>
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
        gap: 8,
    },
    cardHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
    },
    trophy: {
        width: 36,
        height: 36,
        borderRadius: 18,
        backgroundColor: '#FEF3C7',
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
    meta: {
        fontSize: 12,
        color: '#71717A',
    },
    detailRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        gap: 12,
    },
    detailLabel: {
        fontSize: 13,
        color: '#71717A',
    },
    detailValue: {
        flex: 1,
        textAlign: 'right',
        fontSize: 13,
        fontWeight: '700',
        color: '#18181B',
    },
    createButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 6,
        backgroundColor: '#18181B',
        borderRadius: 12,
        minHeight: 48,
    },
    pressed: {
        opacity: 0.7,
    },
    createText: {
        fontSize: 15,
        fontWeight: '700',
        color: '#FFFFFF',
    },
});
