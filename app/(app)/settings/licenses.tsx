import React from 'react';
import { SettingsParagraphs, SettingsShell } from 'components/screens/Settings/SettingsShell';

const ATTRIBUTIONS = [
    { heading: 'Building footprints', body: 'Roof outlines and door locations are derived from the Overture Maps Foundation dataset, which includes data © OpenStreetMap contributors, available under the Open Database License (ODbL).' },
    { heading: 'Map imagery', body: 'Map tiles and imagery © Apple Maps.' },
    { heading: 'Medal artwork', body: 'Leaderboard medal illustrations via Vecteezy (vecteezy.com).' },
    { heading: 'Placeholder portraits', body: 'Sample profile photos provided by randomuser.me for demonstration purposes.' },
    { heading: 'Open-source software', body: 'Radiabase is built with React Native, Expo, react-native-maps, react-native-svg, Zustand, TanStack Query, Hugeicons, and other open-source packages. Each is used under its respective license.' },
];

export default function LicensesScreen() {
    return (
        <SettingsShell title="Licenses & attribution">
            <SettingsParagraphs paragraphs={ATTRIBUTIONS} />
        </SettingsShell>
    );
}
