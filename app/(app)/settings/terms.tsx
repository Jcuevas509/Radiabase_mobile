import React from 'react';
import { SettingsParagraphs, SettingsShell } from 'components/screens/Settings/SettingsShell';

// Placeholder copy — replace with counsel-approved terms before release.
const TERMS = [
    { heading: '1. Acceptance of terms', body: 'By accessing or using Radiabase, you agree to be bound by these Terms of Service and all applicable laws and regulations. If you do not agree with any of these terms, you may not use the app.' },
    { heading: '2. Use of the service', body: 'Radiabase is provided to authorized sales representatives and managers of participating organizations. You agree to use the app only for legitimate canvassing and sales activities and in compliance with all local solicitation laws.' },
    { heading: '3. Accounts', body: 'You are responsible for maintaining the confidentiality of your login credentials and for all activity that occurs under your account. Notify your administrator immediately of any unauthorized use.' },
    { heading: '4. Customer data', body: 'Information you record about homeowners and prospects must be collected lawfully and used only for the purposes permitted by your organization and applicable privacy laws.' },
    { heading: '5. Termination', body: 'Access may be suspended or terminated at any time by your organization or by Radiabase for violation of these terms.' },
    { heading: '6. Changes', body: 'These terms may be updated from time to time. Continued use of the app after changes take effect constitutes acceptance of the revised terms.' },
];

export default function TermsScreen() {
    return (
        <SettingsShell title="Terms of Service">
            <SettingsParagraphs paragraphs={TERMS} />
        </SettingsShell>
    );
}
