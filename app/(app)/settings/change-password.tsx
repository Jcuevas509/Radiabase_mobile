import React, { useState } from 'react';
import { Alert } from 'react-native';
import { useRouter } from 'expo-router';
import {
    SettingsCard,
    SettingsInput,
    SettingsPrimaryButton,
    SettingsShell,
} from 'components/screens/Settings/SettingsShell';

export default function ChangePasswordScreen() {
    const router = useRouter();
    const [currentPassword, setCurrentPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [isSaving, setIsSaving] = useState(false);

    const canSave = currentPassword.length > 0
        && newPassword.length >= 8
        && newPassword === confirmPassword;

    const handleSave = () => {
        setIsSaving(true);
        // Seam: swap this timeout for PUT /auth/change-password when wiring
        // the backend; keep the loading + success flow.
        setTimeout(() => {
            setIsSaving(false);
            Alert.alert('Password updated', undefined, [
                { text: 'Done', onPress: () => router.back() },
            ]);
        }, 600);
    };

    return (
        <SettingsShell title="Change password">
            <SettingsCard>
                <SettingsInput
                    label="Current password"
                    value={currentPassword}
                    onChangeText={setCurrentPassword}
                    secureTextEntry
                />
                <SettingsInput
                    label="New password"
                    value={newPassword}
                    onChangeText={setNewPassword}
                    placeholder="At least 8 characters"
                    secureTextEntry
                />
                <SettingsInput
                    label="Confirm new password"
                    value={confirmPassword}
                    onChangeText={setConfirmPassword}
                    secureTextEntry
                />
            </SettingsCard>
            <SettingsPrimaryButton
                label="Update password"
                onPress={handleSave}
                isDisabled={!canSave}
                isLoading={isSaving}
            />
        </SettingsShell>
    );
}
