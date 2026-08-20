import React from 'react';
import { SettingsCard, SettingsShell, ToggleRow, ValueRow } from 'components/screens/Settings/SettingsShell';

export default function MapSettingsScreen() {
    return (
        <SettingsShell title="Map settings">
            <SettingsCard header="Display">
                <ToggleRow label="Street and place labels" initialValue />
                <ToggleRow label="House status badges" initialValue showDivider />
                <ToggleRow label="Area labels" initialValue showDivider />
            </SettingsCard>
            <SettingsCard header="Behavior">
                <ToggleRow label="Follow my location" />
                <ToggleRow label="Live door sync" initialValue showDivider />
            </SettingsCard>
            <SettingsCard header="Directions">
                <ValueRow label="Walking directions" value="Apple Maps" />
            </SettingsCard>
        </SettingsShell>
    );
}
