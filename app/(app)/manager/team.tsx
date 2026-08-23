import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import { UserAvatar } from 'components/Avatar/UserAvatar';
import { SettingsCard, SettingsShell } from 'components/screens/Settings/SettingsShell';
import { useSession } from 'context/AuthenticationContext';
import { fetchTeamRoster } from 'services/manager-api';
import type { TeamRosterEntry } from 'types/manager.types';

const ROLE_GROUPS: ReadonlyArray<TeamRosterEntry['roleGroup']> = ['Setters', 'Closers', 'Self Gens'];

export default function TeamScreen() {
    const { session } = useSession();
    const router = useRouter();
    const managerId = Number(session?.user?.id ?? 0);
    const [roster, setRoster] = useState<readonly TeamRosterEntry[] | null>(null);

    useEffect(() => {
        const controller = new AbortController();
        fetchTeamRoster({ managerId, signal: controller.signal })
            .then(setRoster)
            .catch(() => undefined);
        return () => controller.abort();
    }, [managerId]);

    if (!roster) {
        return (
            <SettingsShell title="Teams">
                <ActivityIndicator style={styles.loading} color="#18181B" />
            </SettingsShell>
        );
    }

    return (
        <SettingsShell title="Teams">
            {ROLE_GROUPS.map((group) => {
                const members = roster.filter((rep) => rep.roleGroup === group);
                if (members.length === 0) {
                    return null;
                }
                return (
                    <SettingsCard key={group} header={group}>
                        {members.map((rep, index) => (
                            <Pressable
                                key={rep.repId}
                                accessibilityRole="button"
                                accessibilityLabel={`Open ${rep.firstName} ${rep.lastName}`}
                                onPress={() => router.push(`/manager/rep/${rep.repId}` as never)}
                                style={({ pressed }) => [styles.row, index > 0 && styles.divider, pressed && styles.pressed]}
                            >
                                <UserAvatar
                                    firstName={rep.firstName}
                                    lastName={rep.lastName}
                                    size={40}
                                    color="#18181B"
                                    ringWidth={1}
                                />
                                <View style={styles.body}>
                                    <Text style={styles.name}>{rep.firstName} {rep.lastName}</Text>
                                    <Text style={styles.meta}>{rep.officeName}</Text>
                                </View>
                                <Ionicons name="chevron-forward" size={16} color="#A1A1AA" />
                            </Pressable>
                        ))}
                    </SettingsCard>
                );
            })}
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
    pressed: {
        opacity: 0.6,
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
});
