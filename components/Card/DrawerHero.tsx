import React from 'react';
import { Alert, Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { UserAvatar } from 'components/Avatar/UserAvatar';

// Same placeholder as the Home hero until the profile API carries it.
const AVATAR_URL_PLACEHOLDER = 'https://randomuser.me/api/portraits/men/32.jpg';

function capitalize(value: string | null): string | null {
    return value ? value.charAt(0).toUpperCase() + value.slice(1) : value;
}

/**
 * Drawer identity header: the Home hero's layout on the Profile tab's
 * banner treatment, in black — name, position, office, and an ID badge
 * action instead of the Home greeting and stars.
 */
export function DrawerHero({
    firstName,
    lastName,
    roleLabel,
    officeName,
}: {
    readonly firstName: string;
    readonly lastName: string;
    readonly roleLabel: string | null;
    readonly officeName: string | null;
}) {
    const handleSendIdBadge = () => {
        // Seam: POST /users/me/id-badge (email or share sheet) when real.
        Alert.alert('Send ID badge', 'Your digital ID badge will be sent to your email.');
    };

    return (
        <LinearGradient
            colors={['#3F3F46', '#18181B', '#09090B']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.banner}
        >
            <View style={[styles.circle, styles.circleLarge]} />
            <View style={[styles.circle, styles.circleMedium]} />
            <View style={[styles.circle, styles.circleSmall]} />
            <View style={styles.avatarWrap}>
                <View style={styles.avatarRing}>
                    <UserAvatar
                        firstName={firstName}
                        lastName={lastName}
                        imageUrl={AVATAR_URL_PLACEHOLDER}
                        size={60}
                        color="#FFFFFF"
                        ringWidth={1}
                    />
                </View>
                <View style={styles.presenceDot} />
            </View>
            <View style={styles.textBlock}>
                <Text style={styles.name} numberOfLines={1}>{firstName} {lastName}</Text>
                <Text style={styles.metaLine} numberOfLines={1}>
                    {[officeName, capitalize(roleLabel)].filter(Boolean).join(' | ')}
                </Text>
                <Pressable
                    accessibilityRole="button"
                    accessibilityLabel="Send ID badge"
                    onPress={handleSendIdBadge}
                    style={({ pressed }) => [styles.badgeButton, pressed && styles.badgeButtonPressed]}
                >
                    <Ionicons name="id-card-outline" size={14} color="#FFFFFF" />
                    <Text style={styles.badgeButtonText}>Send ID badge</Text>
                </Pressable>
            </View>
        </LinearGradient>
    );
}

const styles = StyleSheet.create({
    banner: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 14,
        borderRadius: 20,
        overflow: 'hidden',
        paddingVertical: 16,
        paddingHorizontal: 16,
    },
    circle: {
        position: 'absolute',
        backgroundColor: 'rgba(255, 255, 255, 0.09)',
        borderRadius: 999,
    },
    circleLarge: {
        width: 220,
        height: 220,
        top: -110,
        right: -70,
    },
    circleMedium: {
        width: 140,
        height: 140,
        bottom: -60,
        left: -40,
    },
    circleSmall: {
        width: 64,
        height: 64,
        top: 24,
        left: 34,
        backgroundColor: 'rgba(255, 255, 255, 0.07)',
    },
    avatarWrap: {
        width: 64,
        height: 64,
    },
    avatarRing: {
        width: 64,
        height: 64,
        borderRadius: 32,
        alignItems: 'center',
        justifyContent: 'center',
    },
    presenceDot: {
        position: 'absolute',
        bottom: 2,
        right: 2,
        width: 14,
        height: 14,
        borderRadius: 7,
        backgroundColor: '#22C55E',
        borderWidth: 2,
        borderColor: '#18181B',
    },
    textBlock: {
        flex: 1,
        gap: 3,
    },
    name: {
        fontSize: 20,
        fontWeight: '800',
        color: '#FFFFFF',
    },
    metaLine: {
        fontSize: 12,
        fontWeight: '600',
        color: 'rgba(255, 255, 255, 0.75)',
        marginBottom: 4,
    },
    badgeButton: {
        alignSelf: 'flex-start',
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        borderRadius: 14,
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.35)',
        backgroundColor: 'rgba(255, 255, 255, 0.12)',
        paddingHorizontal: 11,
        paddingVertical: 6,
    },
    badgeButtonPressed: {
        opacity: 0.7,
    },
    badgeButtonText: {
        fontSize: 12,
        fontWeight: '700',
        color: '#FFFFFF',
    },
});

export default DrawerHero;
