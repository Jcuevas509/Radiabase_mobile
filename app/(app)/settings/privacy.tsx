import React from 'react';
import { SettingsParagraphs, SettingsShell } from 'components/screens/Settings/SettingsShell';

// Placeholder copy — replace with counsel-approved policy before release.
const PRIVACY = [
    { heading: 'Information we collect', body: 'Radiabase stores your account profile, the areas, doors, knocks, leads, and deals you record, and your device location while the app is in use to power the field map.' },
    { heading: 'How location is used', body: 'Foreground location positions you on the map, powers walking directions, and helps attach doors to the correct address. Location is not collected in the background.' },
    { heading: 'Homeowner information', body: 'Contact details recorded on leads are stored on your organization’s servers and are visible only to authorized members of your organization.' },
    { heading: 'Notifications', body: 'Appointment reminders are scheduled locally on your device and contain no customer details in lock-screen text.' },
    { heading: 'Data retention', body: 'Field data is retained according to your organization’s policies. Contact your administrator for deletion requests.' },
];

export default function PrivacyScreen() {
    return (
        <SettingsShell title="Privacy Policy">
            <SettingsParagraphs paragraphs={PRIVACY} />
        </SettingsShell>
    );
}
