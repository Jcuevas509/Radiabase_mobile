import React from 'react';
import { Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { LinkRow, SettingsCard, SettingsShell, ValueRow } from 'components/screens/Settings/SettingsShell';
import { useSession } from 'context/AuthenticationContext';

export default function AccountSettingsScreen() {
    const router = useRouter();
    const { session, signOut } = useSession();
    const handleSignOut = () => {
        Alert.alert('Log out', 'Log out of Radiabase on this phone?', [
            { text: 'Cancel', style: 'cancel' },
            { text: 'Log out', style: 'destructive', onPress: () => void signOut() },
        ]);
    };
    return (
        <SettingsShell title="Account settings">
            <SettingsCard>
                <ValueRow label="Signed in as" value={session?.user?.email || '—'} />
            </SettingsCard>
            <SettingsCard header="Security">
                <LinkRow
                    icon="key-outline"
                    label="Change password"
                    onPress={() => router.push('/settings/change-password' as never)}
                />
                <LinkRow
                    icon="phone-portrait-outline"
                    label="Manage devices"
                    showDivider
                    onPress={() => router.push('/settings/devices' as never)}
                />
            </SettingsCard>
            <SettingsCard header="Session">
                <LinkRow icon="log-out-outline" label="Log out" destructive onPress={handleSignOut} />
            </SettingsCard>
        </SettingsShell>
    );
}
