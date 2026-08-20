import React, { useState } from 'react';
import { Alert, Pressable, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import {
    SettingsCard,
    SettingsInput,
    SettingsPrimaryButton,
    SettingsShell,
} from 'components/screens/Settings/SettingsShell';

const CATEGORIES = ['Map', 'Leads', 'Deals', 'Sync', 'Other'] as const;

export default function ReportBugScreen() {
    const router = useRouter();
    const [category, setCategory] = useState<string>('Map');
    const [description, setDescription] = useState('');
    const [isSending, setIsSending] = useState(false);

    const handleSubmit = () => {
        setIsSending(true);
        // Seam: post to the support/bug endpoint when it exists; include the
        // category, description, app version, and device info.
        setTimeout(() => {
            setIsSending(false);
            Alert.alert('Thanks for the report', 'The team will take a look.', [
                { text: 'Done', onPress: () => router.back() },
            ]);
        }, 600);
    };

    return (
        <SettingsShell title="Report a bug">
            <SettingsCard header="Where did it happen?">
                <View style={styles.chipRow}>
                    {CATEGORIES.map((candidate) => {
                        const selected = category === candidate;
                        return (
                            <Pressable
                                key={candidate}
                                accessibilityRole="button"
                                accessibilityState={{ selected }}
                                onPress={() => setCategory(candidate)}
                                style={[styles.chip, selected && styles.chipSelected]}
                            >
                                <Text style={[styles.chipText, selected && styles.chipTextSelected]}>
                                    {candidate}
                                </Text>
                            </Pressable>
                        );
                    })}
                </View>
            </SettingsCard>
            <SettingsCard header="What happened?">
                <SettingsInput
                    label="Description"
                    value={description}
                    onChangeText={setDescription}
                    placeholder="What did you do, and what went wrong?"
                    multiline
                />
            </SettingsCard>
            <SettingsPrimaryButton
                label="Send report"
                onPress={handleSubmit}
                isDisabled={description.trim().length < 10}
                isLoading={isSending}
            />
        </SettingsShell>
    );
}

const styles = StyleSheet.create({
    chipRow: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 8,
        paddingVertical: 12,
    },
    chip: {
        borderRadius: 16,
        paddingHorizontal: 14,
        paddingVertical: 8,
        backgroundColor: '#F4F4F5',
    },
    chipSelected: {
        backgroundColor: '#18181B',
    },
    chipText: {
        fontSize: 13,
        fontWeight: '700',
        color: '#3F3F46',
    },
    chipTextSelected: {
        color: 'white',
    },
});
