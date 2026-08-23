import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import { useNavigation } from 'expo-router';
// expo-router vendors navigation; DrawerActions isn't re-exported publicly.
import { DrawerActions } from 'expo-router/build/react-navigation/routers';
import { useRouter } from 'expo-router';
import { useSession } from 'context/AuthenticationContext';
import { useUnreadMessages } from 'hooks/useUnreadMessages';

/**
 * The screen-header lead button, role-aware:
 * - managers get the hamburger that opens the admin-tools drawer;
 * - standard reps get a Messages icon (with unread badge) instead.
 */
export function HeaderMenuButton({ color = '#18181B' }: { readonly color?: string }) {
    const { session } = useSession();
    const navigation = useNavigation();
    const router = useRouter();
    const unreadCount = useUnreadMessages();
    const isManager = session?.user?.role === 'manager';

    if (isManager) {
        return (
            <TouchableOpacity
                accessibilityRole="button"
                accessibilityLabel="Open admin tools"
                onPress={() => navigation.dispatch(DrawerActions.openDrawer())}
                hitSlop={12}
                style={styles.hit}
            >
                <MaterialIcons name="menu" size={28} color={color} />
            </TouchableOpacity>
        );
    }

    return (
        <TouchableOpacity
            accessibilityRole="button"
            accessibilityLabel="Messages"
            onPress={() => router.push('/messages')}
            hitSlop={12}
            style={styles.hit}
        >
            <Ionicons name="chatbubble-ellipses-outline" size={26} color={color} />
            {unreadCount > 0 ? (
                <View style={styles.badge}>
                    <Text style={styles.badgeText}>{unreadCount}</Text>
                </View>
            ) : null}
        </TouchableOpacity>
    );
}

// Placeholder until the messages API drives the count (see useUnreadMessages).
const HEADER_UNREAD_PLACEHOLDER = 25;

/**
 * Messages shortcut for the header's right side, next to the bell. Managers
 * only — standard reps already have Messages as their lead header button.
 */
export function HeaderMessagesButton({ color = '#18181B' }: { readonly color?: string }) {
    const { session } = useSession();
    const router = useRouter();

    if (session?.user?.role !== 'manager') {
        return null;
    }

    return (
        <TouchableOpacity
            accessibilityRole="button"
            accessibilityLabel="Messages"
            onPress={() => router.push('/messages')}
            hitSlop={12}
        >
            <Ionicons name="chatbubble-ellipses-outline" size={24} color={color} />
            <View style={[styles.badge, styles.badgeOnIcon]}>
                <Text style={styles.badgeText}>{HEADER_UNREAD_PLACEHOLDER}</Text>
            </View>
        </TouchableOpacity>
    );
}

const styles = StyleSheet.create({
    hit: {
        minWidth: 44,
        minHeight: 44,
        justifyContent: 'center',
    },
    badgeOnIcon: {
        top: -4,
    },
    badge: {
        position: 'absolute',
        top: 4,
        right: -6,
        minWidth: 16,
        height: 16,
        borderRadius: 8,
        backgroundColor: '#DC2626',
        alignItems: 'center',
        justifyContent: 'center',
        paddingHorizontal: 4,
    },
    badgeText: {
        fontSize: 10,
        fontWeight: '800',
        color: '#FFFFFF',
    },
});

export default HeaderMenuButton;
