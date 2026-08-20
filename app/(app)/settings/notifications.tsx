import React from 'react';
import { SettingsCard, SettingsShell, ToggleRow } from 'components/screens/Settings/SettingsShell';

export default function NotificationPreferencesScreen() {
    return (
        <SettingsShell title="Notifications">
            <SettingsCard header="Field work">
                <ToggleRow label="Appointment reminders" initialValue />
                <ToggleRow label="New area assigned" initialValue showDivider />
                <ToggleRow label="Lead status changes" showDivider />
            </SettingsCard>
            <SettingsCard header="Team">
                <ToggleRow label="Leaderboard updates" />
                <ToggleRow label="Announcements" initialValue showDivider />
            </SettingsCard>
        </SettingsShell>
    );
}
