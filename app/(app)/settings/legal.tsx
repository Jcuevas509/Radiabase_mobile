import React from 'react';
import { LinkRow, SettingsCard, SettingsShell } from 'components/screens/Settings/SettingsShell';

export default function LegalScreen() {
    return (
        <SettingsShell title="Legal">
            <SettingsCard>
                <LinkRow icon="document-text-outline" label="Terms of Service" />
                <LinkRow icon="shield-checkmark-outline" label="Privacy Policy" showDivider />
                <LinkRow icon="ribbon-outline" label="Licenses & attribution" showDivider />
            </SettingsCard>
        </SettingsShell>
    );
}
