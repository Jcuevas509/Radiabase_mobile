import React from 'react';
import { Alert, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import {
    LinkRow,
    SettingsCard,
    SettingsShell,
} from 'components/screens/Settings/SettingsShell';

// Seam: replace with the sessions API when it exists.
const SAMPLE_DEVICES = [
    { id: 1, name: 'iPhone 17 Pro', detail: 'This device · Garland, TX', isCurrent: true, icon: 'phone-portrait-outline' as const },
    { id: 2, name: 'iPhone 15', detail: 'Last active Aug 12 · Dallas, TX', isCurrent: false, icon: 'phone-portrait-outline' as const },
    { id: 3, name: 'iPad Air', detail: 'Last active Jul 30 · Dallas, TX', isCurrent: false, icon: 'tablet-portrait-outline' as const },
];

export default function ManageDevicesScreen() {
    const handleLogOutOthers = () => {
        Alert.alert(
            'Log out other devices',
            'All sessions except this device will be signed out.',
            [
                { text: 'Cancel', style: 'cancel' },
                { text: 'Log out others', style: 'destructive', onPress: () => undefined },
            ],
        );
    };

    return (
        <SettingsShell title="Manage devices">
            <SettingsCard header="Signed-in devices">
                {SAMPLE_DEVICES.map((device, index) => (
                    <View key={device.id} style={[styles.deviceRow, index > 0 && styles.deviceDivider]}>
                        <View style={styles.deviceIcon}>
                            <Ionicons name={device.icon} size={19} color="#18181B" />
                        </View>
                        <View style={styles.deviceBody}>
                            <View style={styles.deviceNameRow}>
                                <Text style={styles.deviceName}>{device.name}</Text>
                                {device.isCurrent ? (
                                    <View style={styles.currentChip}>
                                        <Text style={styles.currentChipText}>Current</Text>
                                    </View>
                                ) : null}
                            </View>
                            <Text style={styles.deviceDetail}>{device.detail}</Text>
                        </View>
                    </View>
                ))}
            </SettingsCard>
            <SettingsCard>
                <LinkRow
                    icon="log-out-outline"
                    label="Log out all other devices"
                    destructive
                    onPress={handleLogOutOthers}
                />
            </SettingsCard>
        </SettingsShell>
    );
}

const styles = StyleSheet.create({
    deviceRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        paddingVertical: 11,
    },
    deviceDivider: {
        borderTopWidth: StyleSheet.hairlineWidth,
        borderTopColor: '#E4E4E7',
    },
    deviceIcon: {
        width: 36,
        height: 36,
        borderRadius: 18,
        backgroundColor: '#F4F4F5',
        alignItems: 'center',
        justifyContent: 'center',
    },
    deviceBody: {
        flex: 1,
        gap: 1,
    },
    deviceNameRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    deviceName: {
        fontSize: 15,
        fontWeight: '700',
        color: '#18181B',
    },
    currentChip: {
        backgroundColor: '#EFF6FF',
        borderRadius: 8,
        paddingHorizontal: 7,
        paddingVertical: 2,
    },
    currentChipText: {
        fontSize: 10,
        fontWeight: '800',
        color: '#1687E8',
    },
    deviceDetail: {
        fontSize: 12,
        color: '#71717A',
    },
});
