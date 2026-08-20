import React from 'react';
import { Alert, Linking } from 'react-native';
import { LinkRow, SettingsCard, SettingsShell } from 'components/screens/Settings/SettingsShell';

export default function ContactSupportScreen() {
    const openEmail = () => {
        Linking.openURL('mailto:support@radiabase.com').catch(() => {
            Alert.alert('Could not open Mail', 'Email support@radiabase.com from any mail app.');
        });
    };
    return (
        <SettingsShell title="Contact support">
            <SettingsCard>
                <LinkRow icon="mail-outline" label="Email support" onPress={openEmail} />
                <LinkRow icon="chatbubbles-outline" label="FAQ" showDivider />
                <LinkRow icon="bug-outline" label="Report a bug" showDivider />
            </SettingsCard>
        </SettingsShell>
    );
}
