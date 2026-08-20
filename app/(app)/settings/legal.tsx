import React from 'react';
import { useRouter } from 'expo-router';
import { LinkRow, SettingsCard, SettingsShell } from 'components/screens/Settings/SettingsShell';

export default function LegalScreen() {
    const router = useRouter();
    return (
        <SettingsShell title="Legal">
            <SettingsCard>
                <LinkRow
                    icon="document-text-outline"
                    label="Terms of Service"
                    onPress={() => router.push('/settings/terms' as never)}
                />
                <LinkRow
                    icon="shield-checkmark-outline"
                    label="Privacy Policy"
                    showDivider
                    onPress={() => router.push('/settings/privacy' as never)}
                />
                <LinkRow
                    icon="ribbon-outline"
                    label="Licenses & attribution"
                    showDivider
                    onPress={() => router.push('/settings/licenses' as never)}
                />
            </SettingsCard>
        </SettingsShell>
    );
}
