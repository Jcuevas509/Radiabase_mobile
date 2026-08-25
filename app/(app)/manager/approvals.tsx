import { Ionicons } from '@expo/vector-icons';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, Pressable, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { SettingsShell } from 'components/screens/Settings/SettingsShell';
import { GlassSurface } from 'components/GlassSurface';
import { CARD_SHADOW, TEAL_GRADIENT } from 'constants/design';
import { useSession } from 'context/AuthenticationContext';
import { approveDeal, fetchApprovalQueue, kickBackDeal } from 'services/manager-api';
import type { PendingDealApproval } from 'types/manager.types';

const KICK_BACK_REASONS = ['Pricing below redline', 'Missing utility bill', 'Bad address / site photos'];

/** Hours in the queue before a deal reads as aging. */
const AGING_AFTER_HOURS = 24;

function formatSubmitted(hoursAgo: number): string {
    return hoursAgo < 24 ? `${hoursAgo}h ago` : `${Math.floor(hoursAgo / 24)}d ago`;
}

function QueueStat({ icon, value, label, showDivider }: {
    readonly icon: keyof typeof Ionicons.glyphMap;
    readonly value: string;
    readonly label: string;
    readonly showDivider?: boolean;
}) {
    return (
        <View style={[styles.queueStat, showDivider && styles.queueStatDivider]}>
            <View style={styles.queueStatIcon}>
                <Ionicons name={icon} size={16} color="#FFFFFF" />
            </View>
            <View>
                <Text style={styles.queueStatValue}>{value}</Text>
                <Text style={styles.queueStatLabel}>{label}</Text>
            </View>
        </View>
    );
}

function SpecPill({ label, value }: { readonly label: string; readonly value: string }) {
    return (
        <View style={styles.specPill}>
            <Text style={styles.specLabel}>{label}</Text>
            <Text style={styles.specValue}>{value}</Text>
        </View>
    );
}

function DealCard({ deal, onApprove, onKickBack }: {
    readonly deal: PendingDealApproval;
    readonly onApprove: () => void;
    readonly onKickBack: () => void;
}) {
    const isAging = deal.status === 'pending' && deal.submittedHoursAgo >= AGING_AFTER_HOURS;
    return (
        <View style={styles.card}>
            <View style={styles.cardHeader}>
                <View style={styles.cardTitleBlock}>
                    <Text style={styles.customer} numberOfLines={1}>{deal.customerName}</Text>
                    <Text style={styles.address} numberOfLines={1}>{deal.address}</Text>
                    <Text style={styles.repLine}>Submitted by {deal.repName}</Text>
                </View>
                <View style={[styles.submittedChip, isAging && styles.submittedChipAging]}>
                    <Ionicons
                        name={isAging ? 'alert-circle' : 'time-outline'}
                        size={12}
                        color={isAging ? '#DC2626' : '#71717A'}
                    />
                    <Text style={[styles.submittedText, isAging && styles.submittedTextAging]}>
                        {formatSubmitted(deal.submittedHoursAgo)}
                    </Text>
                </View>
            </View>
            <View style={styles.specRow}>
                <SpecPill label="System" value={`${deal.systemSizeKw} kW`} />
                <SpecPill label="Gross PPW" value={`$${deal.grossPricePerWatt.toFixed(2)}`} />
                <SpecPill label="Net PPW" value={`$${deal.netPricePerWatt.toFixed(2)}`} />
            </View>
            {deal.status === 'pending' ? (
                <View style={styles.actions}>
                    <Pressable
                        accessibilityRole="button"
                        accessibilityLabel={`Kick back ${deal.customerName}`}
                        onPress={onKickBack}
                        style={({ pressed }) => [styles.kickBackButton, pressed && styles.pressed]}
                    >
                        <Ionicons name="return-down-back" size={15} color="#DC2626" />
                        <Text style={styles.kickBackText}>Kick back</Text>
                    </Pressable>
                    <TouchableOpacity
                        accessibilityRole="button"
                        accessibilityLabel={`Approve ${deal.customerName}`}
                        onPress={onApprove}
                        activeOpacity={0.85}
                        style={styles.approveButton}
                    >
                        <LinearGradient
                            colors={[...TEAL_GRADIENT]}
                            start={{ x: 0, y: 0 }}
                            end={{ x: 1, y: 1 }}
                            style={styles.approveGradient}
                        >
                            <Ionicons name="checkmark" size={16} color="#FFFFFF" />
                            <Text style={styles.approveText}>Approve</Text>
                        </LinearGradient>
                    </TouchableOpacity>
                </View>
            ) : (
                <View
                    style={[
                        styles.resolvedRow,
                        { backgroundColor: deal.status === 'approved' ? 'rgba(22, 163, 74, 0.09)' : 'rgba(220, 38, 38, 0.08)' },
                    ]}
                >
                    <Ionicons
                        name={deal.status === 'approved' ? 'checkmark-circle' : 'return-down-back'}
                        size={15}
                        color={deal.status === 'approved' ? '#16A34A' : '#DC2626'}
                    />
                    <Text
                        style={[
                            styles.resolvedText,
                            { color: deal.status === 'approved' ? '#16A34A' : '#DC2626' },
                        ]}
                    >
                        {deal.status === 'approved' ? 'Approved' : 'Kicked back to rep'}
                    </Text>
                </View>
            )}
        </View>
    );
}

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
            { text: 'Cancel', style: 'cancel' as const },
        ]);
    };

    if (!queue) {
        return (
            <SettingsShell title="Deal approvals" glassHeader>
                <ActivityIndicator style={styles.loading} color="#18181B" />
            </SettingsShell>
        );
    }

    const pending = queue.filter((deal) => deal.status === 'pending');
    const resolved = queue.filter((deal) => deal.status !== 'pending');
    const totalKw = pending.reduce((sum, deal) => sum + deal.systemSizeKw, 0);
    const averageNet = pending.length > 0
        ? pending.reduce((sum, deal) => sum + deal.netPricePerWatt, 0) / pending.length
        : 0;

    return (
        <SettingsShell title="Deal approvals" glassHeader>
            <LinearGradient
                colors={[...TEAL_GRADIENT]}
                locations={[0, 0.55, 1]}
                start={{ x: 0.1, y: 0 }}
                end={{ x: 0.9, y: 1 }}
                style={styles.heroCard}
            >
                <Text style={styles.heroTitle}>Approval queue</Text>
                <Text style={styles.heroSubtitle}>
                    {pending.length > 0
                        ? `${pending.length} awaiting your review`
                        : 'Queue is clear — nothing waiting'}
                </Text>
                <GlassSurface
                    glassEffectStyle="clear"
                    style={styles.queueGlass}
                    fallbackStyle={styles.queueFallback}
                >
                    <View style={styles.queueRow}>
                        <QueueStat icon="documents-outline" value={String(pending.length)} label="Pending" />
                        <QueueStat icon="flash-outline" value={`${totalKw.toFixed(1)}`} label="kW queued" showDivider />
                        <QueueStat icon="pricetag-outline" value={`$${averageNet.toFixed(2)}`} label="Avg net" showDivider />
                    </View>
                </GlassSurface>
            </LinearGradient>

            {pending.length > 0 ? (
                <>
                    <Text style={styles.sectionTitle}>Needs review</Text>
                    <View style={styles.cardList}>
                        {pending.map((deal) => (
                            <DealCard
                                key={deal.id}
                                deal={deal}
                                onApprove={() => handleApprove(deal)}
                                onKickBack={() => handleKickBack(deal)}
                            />
                        ))}
                    </View>
                </>
            ) : null}

            {resolved.length > 0 ? (
                <>
                    <Text style={styles.sectionTitle}>Resolved</Text>
                    <View style={styles.cardList}>
                        {resolved.map((deal) => (
                            <DealCard
                                key={deal.id}
                                deal={deal}
                                onApprove={() => handleApprove(deal)}
                                onKickBack={() => handleKickBack(deal)}
                            />
                        ))}
                    </View>
                </>
            ) : null}
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
    queueGlass: {
        borderRadius: 20,
        overflow: 'hidden',
        paddingVertical: 12,
        paddingHorizontal: 10,
        marginTop: 14,
    },
    queueFallback: {
        backgroundColor: 'rgba(255, 255, 255, 0.22)',
    },
    queueRow: {
        flexDirection: 'row',
    },
    queueStat: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 9,
        justifyContent: 'center',
    },
    queueStatDivider: {
        borderLeftWidth: StyleSheet.hairlineWidth,
        borderLeftColor: 'rgba(255, 255, 255, 0.45)',
    },
    queueStatIcon: {
        width: 34,
        height: 34,
        borderRadius: 17,
        backgroundColor: 'rgba(255, 255, 255, 0.22)',
        alignItems: 'center',
        justifyContent: 'center',
    },
    queueStatValue: {
        fontSize: 20,
        fontFamily: 'ClashGrotesk-Bold',
        color: '#FFFFFF',
    },
    queueStatLabel: {
        fontSize: 11,
        fontFamily: 'ClashGrotesk-Medium',
        color: '#EAFBFE',
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
    cardList: {
        gap: 12,
    },
    card: {
        backgroundColor: '#FFFFFF',
        borderRadius: 18,
        borderWidth: StyleSheet.hairlineWidth,
        borderColor: 'rgba(24, 24, 27, 0.07)',
        boxShadow: CARD_SHADOW,
        padding: 14,
        gap: 12,
    },
    cardHeader: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        gap: 10,
    },
    cardTitleBlock: {
        flex: 1,
        gap: 1,
    },
    customer: {
        fontSize: 16,
        fontFamily: 'ClashGrotesk-Semibold',
        color: '#18181B',
    },
    address: {
        fontSize: 12,
        fontFamily: 'ClashGrotesk-Medium',
        color: '#71717A',
    },
    repLine: {
        marginTop: 2,
        fontSize: 12,
        fontFamily: 'ClashGrotesk-Semibold',
        color: '#0A96AC',
    },
    submittedChip: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        backgroundColor: '#F4F4F5',
        borderRadius: 12,
        paddingHorizontal: 9,
        paddingVertical: 4,
    },
    submittedChipAging: {
        backgroundColor: 'rgba(220, 38, 38, 0.09)',
    },
    submittedText: {
        fontSize: 11,
        fontFamily: 'ClashGrotesk-Semibold',
        color: '#71717A',
    },
    submittedTextAging: {
        color: '#DC2626',
    },
    specRow: {
        flexDirection: 'row',
        gap: 8,
    },
    specPill: {
        flex: 1,
        backgroundColor: '#F7F7F8',
        borderRadius: 12,
        paddingVertical: 8,
        paddingHorizontal: 10,
        gap: 1,
    },
    specLabel: {
        fontSize: 10,
        fontFamily: 'ClashGrotesk-Medium',
        color: '#A1A1AA',
    },
    specValue: {
        fontSize: 14,
        fontFamily: 'ClashGrotesk-Bold',
        color: '#18181B',
    },
    actions: {
        flexDirection: 'row',
        gap: 10,
    },
    pressed: {
        opacity: 0.7,
    },
    kickBackButton: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 6,
        borderRadius: 14,
        minHeight: 44,
        backgroundColor: 'rgba(220, 38, 38, 0.08)',
    },
    kickBackText: {
        fontSize: 14,
        fontFamily: 'ClashGrotesk-Semibold',
        color: '#DC2626',
    },
    approveButton: {
        flex: 1,
        borderRadius: 14,
        overflow: 'hidden',
    },
    approveGradient: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 6,
        minHeight: 44,
    },
    approveText: {
        fontSize: 14,
        fontFamily: 'ClashGrotesk-Semibold',
        color: '#FFFFFF',
    },
    resolvedRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 6,
        borderRadius: 14,
        minHeight: 40,
    },
    resolvedText: {
        fontSize: 13,
        fontFamily: 'ClashGrotesk-Semibold',
    },
});
