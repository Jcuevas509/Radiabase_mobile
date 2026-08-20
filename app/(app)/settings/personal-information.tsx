import React from 'react';
import { SettingsCard, SettingsShell, ValueRow } from 'components/screens/Settings/SettingsShell';
import { useSession } from 'context/AuthenticationContext';

export default function PersonalInformationScreen() {
    const { session } = useSession();
    const user = session?.user;
    return (
        <SettingsShell title="Personal information">
            <SettingsCard>
                <ValueRow label="First name" value={user?.firstName || '—'} />
                <ValueRow label="Last name" value={user?.lastName || '—'} showDivider />
                <ValueRow label="Email" value={user?.email || '—'} showDivider />
                <ValueRow label="Role" value={user?.roleLabel || '—'} showDivider />
            </SettingsCard>
            <SettingsCard header="Organization">
                <ValueRow label="Office" value={user?.officeName || '—'} />
                <ValueRow label="Team" value={user?.structureName || '—'} showDivider />
            </SettingsCard>
        </SettingsShell>
    );
}
