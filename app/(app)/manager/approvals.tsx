import { Ionicons } from '@expo/vector-icons';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, Pressable, StyleSheet, Text, View } from 'react-native';
import { SettingsShell } from 'components/screens/Settings/SettingsShell';
import { useSession } from 'context/AuthenticationContext';
import { approveDeal, fetchApprovalQueue, kickBackDeal } from 'services/manager-api';
import type { PendingDealApproval } from 'types/manager.types';

const KICK_BACK_REASONS = ['Pricing below redline', 'Missing utility bill', 'Bad address / site photos'];

export default function ApprovalsScreen() {
    const { session } = useSession();
    const managerId = Number(session?.user?.id ?? 0);
    const [queue, setQueue] = useState<readonly PendingDealApproval[] | null>(null);

    useEffect(() => {
        const controller = new AbortController();
        fetchApprovalQueue({ managerId, signal: controller.signal })
            .then(setQueue)
            .catch(() => undefined);
        return () => controller.abort();
    }, [managerId]);

    const resolveDeal = (dealId: number, status: PendingDealApproval['status']) => {
        setQueue((current) =>
            current ? current.map((deal) => (deal.id === dealId ? { ...deal, status } : deal)) : current,
        );
    };

    const handleApprove = (deal: PendingDealApproval) => {
        // Optimistic; real API failure handling arrives with the backend.
        void approveDeal({ dealId: deal.id });
        resolveDeal(deal.id, 'approved');
    };

    const handleKickBack = (deal: PendingDealApproval) => {
        Alert.alert('Kick back deal', `${deal.customerName} — pick a reason`, [
            ...KICK_BACK_REASONS.map((reason) => ({
                text: reason,
                onPress: () => {
                    void kickBackDeal({ dealId: deal.id, reason });
                    resolveDeal(deal.id, 'kicked-back');
                },
            })),
            { text: 'Cancel', style: 'cancel' },
        ]);
    };

    if (!queue) {
        return (
            <SettingsShell title="Deal approvals">
                <ActivityIndicator style={styles.loading} color="#18181B" />
            </SettingsShell>
        );
    }

    const pendingCount = queue.filter((deal) => deal.status === 'pending').length;

    return (
        <SettingsShell title="Deal approvals">
            <Text style={styles.summary}>
                {pendingCount > 0 ? `${pendingCount} awaiting review` : 'Queue is clear'}
            </Text>
            {queue.map((deal) => (
                <View key={deal.id} style={styles.card}>
                    <View style={styles.cardHeader}>
                        <View style={styles.cardTitleBlock}>
                            <Text style={styles.customer}>{deal.customerName}</Text>
                            <Text style={styles.address} numberOfLines={1}>{deal.address}</Text>
                        </View>
                        <Text style={styles.submitted}>
                            {deal.submittedHoursAgo < 24
                                ? `${deal.submittedHoursAgo}h ago`
                                : `${Math.floor(deal.submittedHoursAgo / 24)}d ago`}
                        </Text>
                    </View>
                    <View style={styles.specRow}>
                        <Text style={styles.spec}>{deal.systemSizeKw} kW</Text>
                        <Text style={styles.spec}>Gross ${deal.grossPricePerWatt.toFixed(2)}</Text>
                        <Text style={styles.spec}>Net ${deal.netPricePerWatt.toFixed(2)}</Text>
                        <Text style={styles.spec}>{deal.repName}</Text>
                    </View>
                    {deal.status === 'pending' ? (
                        <View style={styles.actions}>
                            <Pressable
                                accessibilityRole="button"
                                accessibilityLabel={`Kick back ${deal.customerName}`}
                                onPress={() => handleKickBack(deal)}
                                style={({ pressed }) => [styles.action, styles.actionKickBack, pressed && styles.pressed]}
                            >
                                <Text style={styles.actionKickBackText}>Kick back</Text>
                            </Pressable>
                            <Pressable
                                accessibilityRole="button"
                                accessibilityLabel={`Approve ${deal.customerName}`}
                                onPress={() => handleApprove(deal)}
                                style={({ pressed }) => [styles.action, styles.actionApprove, pressed && styles.pressed]}
                            >
                                <Text style={styles.actionApproveText}>Approve</Text>
                            </Pressable>
                        </View>
                    ) : (
                        <View style={styles.resolvedRow}>
                            <Ionicons
                                name={deal.status === 'approved' ? 'checkmark-circle' : 'return-down-back'}
                                size={16}
                                color={deal.status === 'approved' ? '#16A34A' : '#DC2626'}
                            />
                            <Text style={[styles.resolvedText, { color: deal.status === 'approved' ? '#16A34A' : '#DC2626' }]}>
                                {deal.status === 'approved' ? 'Approved' : 'Kicked back to rep'}
                            </Text>
                        </View>
                    )}
                </View>
            ))}
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
        alignItems: 'flex-start',
        gap: 8,
    },
    cardTitleBlock: {
        flex: 1,
        gap: 1,
    },
    customer: {
        fontSize: 16,
        fontWeight: '700',
        color: '#18181B',
    },
    address: {
        fontSize: 12,
        color: '#71717A',
    },
    submitted: {
        fontSize: 11,
        color: '#A1A1AA',
    },
    specRow: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 12,
    },
    spec: {
        fontSize: 12,
        fontWeight: '700',
        color: '#3F3F46',
    },
    actions: {
        flexDirection: 'row',
        gap: 10,
    },
    action: {
        flex: 1,
        borderRadius: 10,
        minHeight: 42,
        alignItems: 'center',
        justifyContent: 'center',
    },
    pressed: {
        opacity: 0.7,
    },
    actionKickBack: {
        borderWidth: 1,
        borderColor: '#DC2626',
    },
    actionKickBackText: {
        fontSize: 14,
        fontWeight: '700',
        color: '#DC2626',
    },
    actionApprove: {
        backgroundColor: '#18181B',
    },
    actionApproveText: {
        fontSize: 14,
        fontWeight: '700',
        color: '#FFFFFF',
    },
    resolvedRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
    },
    resolvedText: {
        fontSize: 13,
        fontWeight: '700',
    },
});
