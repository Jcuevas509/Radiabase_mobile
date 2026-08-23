import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import { SettingsCard, SettingsShell } from 'components/screens/Settings/SettingsShell';
import { useSession } from 'context/AuthenticationContext';
import { fetchConversations } from 'services/messages-api';
import type { Conversation, ConversationKind } from 'types/messages.types';

const KIND_ICONS: Record<ConversationKind, keyof typeof Ionicons.glyphMap> = {
    announcement: 'megaphone-outline',
    channel: 'people-outline',
    dm: 'person-outline',
};

function formatAge(minutesAgo: number): string {
    if (minutesAgo < 60) {
        return `${minutesAgo}m`;
    }
    const hours = Math.floor(minutesAgo / 60);
    return hours < 24 ? `${hours}h` : `${Math.floor(hours / 24)}d`;
}

export default function MessagesScreen() {
    const { session } = useSession();
    const router = useRouter();
    const userId = Number(session?.user?.id ?? 0);
    const [conversations, setConversations] = useState<readonly Conversation[] | null>(null);

    useEffect(() => {
        const controller = new AbortController();
        fetchConversations({ userId, signal: controller.signal })
            .then(setConversations)
            .catch(() => undefined);
        return () => controller.abort();
    }, [userId]);

    if (!conversations) {
        return (
            <SettingsShell title="Messages">
                <ActivityIndicator style={styles.loading} color="#18181B" />
            </SettingsShell>
        );
    }

    return (
        <SettingsShell title="Messages">
            <SettingsCard>
                {conversations.map((conversation, index) => (
                    <Pressable
                        key={conversation.id}
                        accessibilityRole="button"
                        accessibilityLabel={`Open ${conversation.title}`}
                        onPress={() => router.push(`/messages/${conversation.id}` as never)}
                        style={({ pressed }) => [styles.row, index > 0 && styles.divider, pressed && styles.pressed]}
                    >
                        <View style={styles.kindIcon}>
                            <Ionicons name={KIND_ICONS[conversation.kind]} size={18} color="#18181B" />
                        </View>
                        <View style={styles.body}>
                            <Text
                                style={[styles.title, conversation.unreadCount > 0 && styles.titleUnread]}
                                numberOfLines={1}
                            >
                                {conversation.title}
                            </Text>
                            <Text style={styles.preview} numberOfLines={1}>
                                {conversation.lastMessagePreview}
                            </Text>
                        </View>
                        <View style={styles.right}>
                            <Text style={styles.age}>{formatAge(conversation.lastMessageMinutesAgo)}</Text>
                            {conversation.unreadCount > 0 ? (
                                <View style={styles.unreadBadge}>
                                    <Text style={styles.unreadText}>{conversation.unreadCount}</Text>
                                </View>
                            ) : null}
                        </View>
                    </Pressable>
                ))}
            </SettingsCard>
        </SettingsShell>
    );
}

const styles = StyleSheet.create({
    loading: {
        marginTop: 48,
    },
    row: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        paddingVertical: 12,
    },
    divider: {
        borderTopWidth: StyleSheet.hairlineWidth,
        borderTopColor: '#E4E4E7',
    },
    pressed: {
        opacity: 0.6,
    },
    kindIcon: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: '#F4F4F5',
        alignItems: 'center',
        justifyContent: 'center',
    },
    body: {
        flex: 1,
        gap: 1,
    },
    title: {
        fontSize: 15,
        fontWeight: '600',
        color: '#18181B',
    },
    titleUnread: {
        fontWeight: '800',
    },
    preview: {
        fontSize: 13,
        color: '#71717A',
    },
    right: {
        alignItems: 'flex-end',
        gap: 4,
    },
    age: {
        fontSize: 11,
        color: '#A1A1AA',
    },
    unreadBadge: {
        minWidth: 18,
        height: 18,
        borderRadius: 9,
        backgroundColor: '#DC2626',
        alignItems: 'center',
        justifyContent: 'center',
        paddingHorizontal: 5,
    },
    unreadText: {
        fontSize: 11,
        fontWeight: '800',
        color: '#FFFFFF',
    },
});
