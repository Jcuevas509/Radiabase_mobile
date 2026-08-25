import { Ionicons } from '@expo/vector-icons';
import { useEffect, useState } from 'react';
import {
    ActivityIndicator,
    Modal,
    Pressable,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { SettingsShell } from 'components/screens/Settings/SettingsShell';
import { GlassSurface } from 'components/GlassSurface';
import { UserAvatar } from 'components/Avatar/UserAvatar';
import { useSession } from 'context/AuthenticationContext';
import { advanceOnboardingRecruit, fetchOffices, fetchOnboardingRecruits } from 'services/manager-api';
import type { OfficeSummary, OnboardingRecruit, OnboardingStage } from 'types/manager.types';

const CARD_SHADOW =
    '0 1px 2px rgba(24, 24, 27, 0.05), 0 10px 26px rgba(24, 24, 27, 0.07), inset 0 1px 0 rgba(255, 255, 255, 0.95)';
const TEAL_GRADIENT = ['#067A90', '#0AA6BE', '#00CFE8'] as const;

const STAGES: readonly OnboardingStage[] = ['Invited', 'Docs', 'Training', 'Ready'];

const STAGE_META: Record<OnboardingStage, {
    readonly icon: keyof typeof Ionicons.glyphMap;
    readonly color: string;
    readonly hint: string;
}> = {
    Invited: { icon: 'mail-open-outline', color: '#6366F1', hint: 'Waiting on signup' },
    Docs: { icon: 'document-text-outline', color: '#F59E0B', hint: 'Paperwork in review' },
    Training: { icon: 'school-outline', color: '#0EA5E9', hint: 'In field training' },
    Ready: { icon: 'checkmark-circle-outline', color: '#22C55E', hint: 'Ready to activate' },
};

/** Days in one stage before a recruit counts as stuck. */
const STUCK_AFTER_DAYS = 5;

function portraitUrl(portrait: string) {
    return `https://randomuser.me/api/portraits/${portrait}.jpg`;
}

function StageDots({ stage }: { readonly stage: OnboardingStage }) {
    const activeIndex = STAGES.indexOf(stage);
    return (
        <View style={styles.stageDots}>
            {STAGES.map((step, index) => (
                <View
                    key={step}
                    style={[
                        styles.stageDot,
                        index <= activeIndex && { backgroundColor: STAGE_META[stage].color },
                    ]}
                />
            ))}
        </View>
    );
}

function RecruitCard({ recruit, onAdvance }: {
    readonly recruit: OnboardingRecruit;
    readonly onAdvance: () => void;
}) {
    const meta = STAGE_META[recruit.stage];
    const isReady = recruit.stage === 'Ready';
    const isStuck = !isReady && recruit.daysInStage >= STUCK_AFTER_DAYS;
    return (
        <View style={styles.card}>
            <View style={styles.cardTop}>
                <UserAvatar
                    firstName={recruit.firstName}
                    lastName={recruit.lastName}
                    imageUrl={portraitUrl(recruit.portrait)}
                    size={40}
                    color={meta.color}
                    ringWidth={1}
                />
                <View style={styles.cardTitleBlock}>
                    <Text style={styles.cardName} numberOfLines={1}>
                        {recruit.firstName} {recruit.lastName}
                    </Text>
                    <Text style={styles.cardMeta} numberOfLines={1}>{recruit.officeName}</Text>
                </View>
                <View style={[styles.daysChip, isStuck && styles.daysChipStuck]}>
                    <Ionicons
                        name={isStuck ? 'alert-circle' : 'time-outline'}
                        size={12}
                        color={isStuck ? '#DC2626' : '#71717A'}
                    />
                    <Text style={[styles.daysChipText, isStuck && styles.daysChipTextStuck]}>
                        {recruit.daysInStage}d in stage
                    </Text>
                </View>
            </View>
            <View style={styles.cardFooter}>
                <StageDots stage={recruit.stage} />
                <Text style={styles.stageHint}>{meta.hint}</Text>
                <TouchableOpacity
                    accessibilityRole="button"
                    accessibilityLabel={isReady ? `Activate ${recruit.firstName}` : `Advance ${recruit.firstName}`}
                    style={[styles.advanceButton, { backgroundColor: `${meta.color}1A` }]}
                    onPress={onAdvance}
                >
                    <Text style={[styles.advanceText, { color: meta.color }]}>
                        {isReady ? 'Activate' : 'Advance'}
                    </Text>
                    <Ionicons name="arrow-forward" size={13} color={meta.color} />
                </TouchableOpacity>
            </View>
        </View>
    );
}

/** Invite sheet: local-only until POST /onboarding/invites exists. */
function InviteSheet({ visible, offices, onClose, onInvite }: {
    readonly visible: boolean;
    readonly offices: readonly OfficeSummary[];
    readonly onClose: () => void;
    readonly onInvite: (recruit: OnboardingRecruit) => void;
}) {
    const [name, setName] = useState('');
    const [officeName, setOfficeName] = useState('');
    const canInvite = name.trim().split(' ').length >= 2 && officeName.length > 0;

    const handleInvite = () => {
        const [firstName, ...rest] = name.trim().split(' ');
        onInvite({
            id: Date.now(),
            firstName,
            lastName: rest.join(' '),
            portrait: 'lego/1',
            officeName,
            stage: 'Invited',
            daysInStage: 0,
        });
        setName('');
        setOfficeName('');
    };

    return (
        <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
            <View style={styles.sheetRoot}>
                <View style={styles.sheetHeader}>
                    <Pressable accessibilityRole="button" accessibilityLabel="Close invite" hitSlop={10} onPress={onClose}>
                        <Text style={styles.sheetCancel}>Cancel</Text>
                    </Pressable>
                    <Text style={styles.sheetTitle}>Invite a recruit</Text>
                    <View style={styles.sheetSpacer} />
                </View>
                <ScrollView contentContainerStyle={styles.sheetContent} keyboardShouldPersistTaps="handled">
                    <Text style={styles.fieldLabel}>Full name</Text>
                    <TextInput
                        style={styles.input}
                        value={name}
                        onChangeText={setName}
                        placeholder="Jordan Avery"
                        placeholderTextColor="#A1A1AA"
                        returnKeyType="done"
                    />
                    <Text style={styles.fieldLabel}>Office</Text>
                    <View style={styles.chipWrap}>
                        {offices.map((office) => {
                            const isActive = officeName === office.name;
                            return (
                                <TouchableOpacity
                                    key={office.id}
                                    style={[styles.choiceChip, isActive && styles.choiceChipActive]}
                                    onPress={() => setOfficeName(office.name)}
                                >
                                    <Text style={[styles.choiceChipText, isActive && styles.choiceChipTextActive]}>
                                        {office.name}
                                    </Text>
                                </TouchableOpacity>
                            );
                        })}
                    </View>
                    <TouchableOpacity
                        accessibilityRole="button"
                        accessibilityLabel="Send invite"
                        disabled={!canInvite}
                        onPress={handleInvite}
                        activeOpacity={0.85}
                        style={[styles.inviteButton, !canInvite && styles.inviteButtonDisabled]}
                    >
                        <LinearGradient
                            colors={[...TEAL_GRADIENT]}
                            start={{ x: 0, y: 0 }}
                            end={{ x: 1, y: 1 }}
                            style={styles.inviteGradient}
                        >
                            <Ionicons name="paper-plane-outline" size={16} color="#FFFFFF" />
                            <Text style={styles.inviteText}>Send invite</Text>
                        </LinearGradient>
                    </TouchableOpacity>
                </ScrollView>
            </View>
        </Modal>
    );
}

export default function OnboardingScreen() {
    const { session } = useSession();
    const managerId = Number(session?.user?.id ?? 0);
    const [recruits, setRecruits] = useState<readonly OnboardingRecruit[] | null>(null);
    const [offices, setOffices] = useState<readonly OfficeSummary[]>([]);
    const [isInviteOpen, setIsInviteOpen] = useState(false);

    useEffect(() => {
        const controller = new AbortController();
        fetchOnboardingRecruits({ managerId, signal: controller.signal })
            .then(setRecruits)
            .catch(() => undefined);
        fetchOffices({ managerId, signal: controller.signal })
            .then(setOffices)
            .catch(() => undefined);
        return () => controller.abort();
    }, [managerId]);

    const handleAdvance = (recruit: OnboardingRecruit) => {
        const stageIndex = STAGES.indexOf(recruit.stage);
        void advanceOnboardingRecruit({ recruitId: recruit.id });
        setRecruits((current) => {
            if (!current) {
                return current;
            }
            if (recruit.stage === 'Ready') {
                // Activation graduates the recruit out of the pipeline.
                return current.filter((entry) => entry.id !== recruit.id);
            }
            return current.map((entry) =>
                entry.id === recruit.id
                    ? { ...entry, stage: STAGES[stageIndex + 1], daysInStage: 0 }
                    : entry,
            );
        });
    };

    const addButton = (
        <Pressable
            accessibilityRole="button"
            accessibilityLabel="Invite a recruit"
            hitSlop={8}
            onPress={() => setIsInviteOpen(true)}
            style={({ pressed }) => [pressed && styles.pressed]}
        >
            <GlassSurface
                glassEffectStyle="clear"
                isInteractive
                style={styles.glassButton}
                fallbackStyle={styles.glassButtonFallback}
            >
                <Ionicons name="add" size={22} color="#18181B" />
            </GlassSurface>
        </Pressable>
    );

    if (!recruits) {
        return (
            <SettingsShell title="Onboarding" headerRight={addButton} glassHeader>
                <ActivityIndicator style={styles.loading} color="#18181B" />
            </SettingsShell>
        );
    }

    const readyCount = recruits.filter((recruit) => recruit.stage === 'Ready').length;
    const stuckCount = recruits.filter(
        (recruit) => recruit.stage !== 'Ready' && recruit.daysInStage >= STUCK_AFTER_DAYS,
    ).length;

    return (
        <SettingsShell title="Onboarding" headerRight={addButton} glassHeader>
            <LinearGradient
                colors={[...TEAL_GRADIENT]}
                locations={[0, 0.55, 1]}
                start={{ x: 0.1, y: 0 }}
                end={{ x: 0.9, y: 1 }}
                style={styles.heroCard}
            >
                <Text style={styles.heroTitle}>Recruit pipeline</Text>
                <Text style={styles.heroSubtitle}>
                    {recruits.length} in the pipeline · {readyCount} ready to activate
                    {stuckCount > 0 ? ` · ${stuckCount} stuck` : ''}
                </Text>
                <GlassSurface
                    glassEffectStyle="clear"
                    style={styles.funnelGlass}
                    fallbackStyle={styles.funnelFallback}
                >
                    <View style={styles.funnelRow}>
                        {STAGES.map((stage, index) => {
                            const count = recruits.filter((recruit) => recruit.stage === stage).length;
                            return (
                                <View key={stage} style={[styles.funnelStep, index > 0 && styles.funnelStepDivider]}>
                                    <Ionicons name={STAGE_META[stage].icon} size={16} color="#FFFFFF" />
                                    <Text style={styles.funnelCount}>{count}</Text>
                                    <Text style={styles.funnelLabel}>{stage}</Text>
                                </View>
                            );
                        })}
                    </View>
                </GlassSurface>
            </LinearGradient>

            {STAGES.map((stage) => {
                const stageRecruits = recruits.filter((recruit) => recruit.stage === stage);
                if (stageRecruits.length === 0) {
                    return null;
                }
                const meta = STAGE_META[stage];
                return (
                    <View key={stage}>
                        <View style={styles.sectionHeader}>
                            <View style={[styles.sectionDot, { backgroundColor: meta.color }]} />
                            <Text style={styles.sectionTitle}>{stage}</Text>
                            <Text style={styles.sectionCount}>{stageRecruits.length}</Text>
                        </View>
                        <View style={styles.cardList}>
                            {stageRecruits.map((recruit) => (
                                <RecruitCard
                                    key={recruit.id}
                                    recruit={recruit}
                                    onAdvance={() => handleAdvance(recruit)}
                                />
                            ))}
                        </View>
                    </View>
                );
            })}

            <InviteSheet
                visible={isInviteOpen}
                offices={offices}
                onClose={() => setIsInviteOpen(false)}
                onInvite={(recruit) => {
                    // Seam: POST /onboarding/invites; local prepend until then.
                    setRecruits((current) => [recruit, ...(current ?? [])]);
                    setIsInviteOpen(false);
                }}
            />
        </SettingsShell>
    );
}

const styles = StyleSheet.create({
    loading: {
        marginTop: 48,
    },
    pressed: {
        opacity: 0.7,
    },
    // Bare native glass circle — no background or shadow on the glass node.
    glassButton: {
        width: 40,
        height: 40,
        borderRadius: 20,
        overflow: 'hidden',
        alignItems: 'center',
        justifyContent: 'center',
    },
    glassButtonFallback: {
        backgroundColor: 'rgba(255, 255, 255, 0.5)',
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
    funnelGlass: {
        borderRadius: 20,
        overflow: 'hidden',
        paddingVertical: 12,
        paddingHorizontal: 8,
        marginTop: 14,
    },
    funnelFallback: {
        backgroundColor: 'rgba(255, 255, 255, 0.22)',
    },
    funnelRow: {
        flexDirection: 'row',
    },
    funnelStep: {
        flex: 1,
        alignItems: 'center',
        gap: 2,
    },
    funnelStepDivider: {
        borderLeftWidth: StyleSheet.hairlineWidth,
        borderLeftColor: 'rgba(255, 255, 255, 0.45)',
    },
    funnelCount: {
        fontSize: 20,
        fontFamily: 'ClashGrotesk-Bold',
        color: '#FFFFFF',
    },
    funnelLabel: {
        fontSize: 11,
        fontFamily: 'ClashGrotesk-Medium',
        color: '#EAFBFE',
    },
    sectionHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        marginTop: 22,
        marginBottom: 10,
        marginLeft: 2,
    },
    sectionDot: {
        width: 8,
        height: 8,
        borderRadius: 4,
    },
    sectionTitle: {
        flex: 1,
        fontSize: 21,
        fontFamily: 'ClashGrotesk-Semibold',
        color: '#18181B',
        paddingRight: 14,
    },
    sectionCount: {
        fontSize: 13,
        fontFamily: 'ClashGrotesk-Bold',
        color: '#71717A',
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
        padding: 12,
    },
    cardTop: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 11,
    },
    cardTitleBlock: {
        flex: 1,
    },
    cardName: {
        fontSize: 15,
        fontFamily: 'ClashGrotesk-Semibold',
        color: '#18181B',
    },
    cardMeta: {
        marginTop: 1,
        fontSize: 12,
        fontFamily: 'ClashGrotesk-Medium',
        color: '#71717A',
    },
    daysChip: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        backgroundColor: '#F4F4F5',
        borderRadius: 12,
        paddingHorizontal: 9,
        paddingVertical: 4,
    },
    daysChipStuck: {
        backgroundColor: 'rgba(220, 38, 38, 0.09)',
    },
    daysChipText: {
        fontSize: 11,
        fontFamily: 'ClashGrotesk-Semibold',
        color: '#71717A',
    },
    daysChipTextStuck: {
        color: '#DC2626',
    },
    cardFooter: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
        borderTopWidth: StyleSheet.hairlineWidth,
        borderTopColor: '#E4E4E7',
        marginTop: 10,
        paddingTop: 10,
    },
    stageDots: {
        flexDirection: 'row',
        gap: 4,
    },
    stageDot: {
        width: 7,
        height: 7,
        borderRadius: 4,
        backgroundColor: '#E4E4E7',
    },
    stageHint: {
        flex: 1,
        fontSize: 12,
        fontFamily: 'ClashGrotesk-Medium',
        color: '#71717A',
    },
    advanceButton: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        borderRadius: 13,
        paddingHorizontal: 11,
        paddingVertical: 6,
    },
    advanceText: {
        fontSize: 13,
        fontFamily: 'ClashGrotesk-Semibold',
    },
    sheetRoot: {
        flex: 1,
        backgroundColor: '#F1F2F4',
    },
    sheetHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 18,
        paddingTop: 18,
        paddingBottom: 10,
    },
    sheetCancel: {
        fontSize: 15,
        fontFamily: 'ClashGrotesk-Semibold',
        color: '#71717A',
        width: 60,
    },
    sheetTitle: {
        fontSize: 17,
        fontFamily: 'ClashGrotesk-Semibold',
        color: '#18181B',
    },
    sheetSpacer: {
        width: 60,
    },
    sheetContent: {
        padding: 18,
        paddingBottom: 40,
    },
    fieldLabel: {
        fontSize: 13,
        fontFamily: 'ClashGrotesk-Semibold',
        color: '#71717A',
        marginBottom: 7,
        marginTop: 16,
        marginLeft: 2,
    },
    input: {
        backgroundColor: '#FFFFFF',
        borderRadius: 14,
        borderWidth: StyleSheet.hairlineWidth,
        borderColor: 'rgba(24, 24, 27, 0.07)',
        boxShadow: CARD_SHADOW,
        paddingHorizontal: 14,
        paddingVertical: 13,
        fontSize: 15,
        fontFamily: 'ClashGrotesk-Semibold',
        color: '#18181B',
    },
    chipWrap: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 8,
    },
    choiceChip: {
        backgroundColor: '#FFFFFF',
        borderRadius: 16,
        paddingHorizontal: 13,
        paddingVertical: 8,
        borderWidth: StyleSheet.hairlineWidth,
        borderColor: 'rgba(24, 24, 27, 0.07)',
        boxShadow: CARD_SHADOW,
    },
    choiceChipActive: {
        backgroundColor: '#18181B',
        borderColor: '#18181B',
    },
    choiceChipText: {
        fontSize: 13,
        fontFamily: 'ClashGrotesk-Semibold',
        color: '#52525B',
    },
    choiceChipTextActive: {
        color: '#FFFFFF',
    },
    inviteButton: {
        marginTop: 24,
        borderRadius: 18,
        overflow: 'hidden',
    },
    inviteButtonDisabled: {
        opacity: 0.45,
    },
    inviteGradient: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        minHeight: 52,
    },
    inviteText: {
        fontSize: 16,
        fontFamily: 'ClashGrotesk-Semibold',
        color: '#FFFFFF',
    },
});
