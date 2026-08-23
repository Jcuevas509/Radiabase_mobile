import { Ionicons } from '@expo/vector-icons';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, Pressable, StyleSheet, Text, View } from 'react-native';
import { UserAvatar } from 'components/Avatar/UserAvatar';
import { SettingsCard, SettingsShell } from 'components/screens/Settings/SettingsShell';
import { useSession } from 'context/AuthenticationContext';
import { fetchOnboardingRecruits } from 'services/manager-api';
import type { OnboardingRecruit, OnboardingStage } from 'types/manager.types';

const STAGE_COLORS: Record<OnboardingStage, string> = {
    Invited: '#71717A',
    Docs: '#A16207',
    Training: '#7C3AED',
    Ready: '#15803D',
};

export default function OnboardingScreen() {
    const { session } = useSession();
    const managerId = Number(session?.user?.id ?? 0);
    const [recruits, setRecruits] = useState<readonly OnboardingRecruit[] | null>(null);

    useEffect(() => {
        const controller = new AbortController();
        fetchOnboardingRecruits({ managerId, signal: controller.signal })
            .then(setRecruits)
            .catch(() => undefined);
        return () => controller.abort();
    }, [managerId]);

    const handleInvite = () => {
        // Seam: POST /onboarding/invites (name, phone, office) when real.
        Alert.alert('Invite a recruit', 'The invite form is coming with the backend hookup.');
    };

    if (!recruits) {
        return (
            <SettingsShell title="Onboarding">
                <ActivityIndicator style={styles.loading} color="#18181B" />
            </SettingsShell>
        );
    }

    return (
        <SettingsShell title="Onboarding">
            <SettingsCard header={`In the pipeline · ${recruits.length}`}>
                {recruits.map((recruit, index) => (
                    <View key={recruit.id} style={[styles.row, index > 0 && styles.divider]}>
                        <UserAvatar
                            firstName={recruit.firstName}
                            lastName={recruit.lastName}
                            size={40}
                            color="#18181B"
                            ringWidth={1}
                        />
                        <View style={styles.body}>
                            <Text style={styles.name}>{recruit.firstName} {recruit.lastName}</Text>
                            <Text style={styles.meta}>
                                {recruit.officeName} · {recruit.daysInStage}d in stage
                            </Text>
                        </View>
                        <View style={[styles.stagePill, { backgroundColor: STAGE_COLORS[recruit.stage] }]}>
                            <Text style={styles.stageText}>{recruit.stage}</Text>
                        </View>
                    </View>
                ))}
            </SettingsCard>
            <Pressable
                accessibilityRole="button"
                accessibilityLabel="Invite a recruit"
                onPress={handleInvite}
                style={({ pressed }) => [styles.inviteButton, pressed && styles.pressed]}
            >
                <Ionicons name="person-add-outline" size={17} color="#FFFFFF" />
                <Text style={styles.inviteText}>Invite a recruit</Text>
            </Pressable>
        </SettingsShell>
    );
}

const styles = StyleSheet.create({
    loading: {
        marginTop: 48,
    },
    row: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        paddingVertical: 10,
    },
    divider: {
        borderTopWidth: StyleSheet.hairlineWidth,
        borderTopColor: '#E4E4E7',
    },
    body: {
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
    stagePill: {
        borderRadius: 10,
        paddingHorizontal: 9,
        paddingVertical: 4,
    },
    stageText: {
        fontSize: 11,
        fontWeight: '800',
        color: '#FFFFFF',
    },
    inviteButton: {
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
    inviteText: {
        fontSize: 15,
        fontWeight: '700',
        color: '#FFFFFF',
    },
});
