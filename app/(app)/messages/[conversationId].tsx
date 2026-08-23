import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import {
    ActivityIndicator,
    KeyboardAvoidingView,
    Platform,
    Pressable,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useSession } from 'context/AuthenticationContext';
import { SAMPLE_CONVERSATIONS } from 'services/sample-messages';
import { fetchMessages, sendMessage } from 'services/messages-api';
import type { ChatMessage } from 'types/messages.types';

export default function ConversationScreen() {
    const { conversationId } = useLocalSearchParams<{ conversationId: string }>();
    const router = useRouter();
    const { session } = useSession();
    const id = Number(conversationId);
    const [messages, setMessages] = useState<readonly ChatMessage[] | null>(null);
    const [draft, setDraft] = useState('');

    // Seam: conversation metadata comes back with fetchMessages once real.
    const conversation = useMemo(
        () => SAMPLE_CONVERSATIONS.find((entry) => entry.id === id) ?? null,
        [id],
    );
    const isManager = session?.user?.role === 'manager';
    const composerLocked = conversation?.kind === 'announcement' && !isManager;

    useEffect(() => {
        const controller = new AbortController();
        fetchMessages({ conversationId: id, signal: controller.signal })
            .then(setMessages)
            .catch(() => undefined);
        return () => controller.abort();
    }, [id]);

    const handleSend = () => {
        const body = draft.trim();
        if (!body) {
            return;
        }
        // Optimistic; real API failure handling arrives with the backend.
        void sendMessage({ conversationId: id, body });
        setMessages((current) => [
            ...(current ?? []),
            {
                id: (current?.length ?? 0) + 1000,
                conversationId: id,
                senderName: 'Me',
                isMine: true,
                body,
                sentMinutesAgo: 0,
            },
        ]);
        setDraft('');
    };

    return (
        <SafeAreaView style={styles.safeArea} edges={['top']}>
            <View style={styles.header}>
                <Pressable
                    accessibilityRole="button"
                    accessibilityLabel="Go back"
                    hitSlop={12}
                    onPress={() => router.back()}
                    style={styles.headerSide}
                >
                    <Ionicons name="chevron-back" size={26} color="#18181B" />
                </Pressable>
                <View style={styles.headerCenter}>
                    <Text style={styles.headerTitle} numberOfLines={1}>
                        {conversation?.title ?? 'Conversation'}
                    </Text>
                    {conversation?.subtitle ? (
                        <Text style={styles.headerSubtitle} numberOfLines={1}>{conversation.subtitle}</Text>
                    ) : null}
                </View>
                <View style={styles.headerSide} />
            </View>

            <KeyboardAvoidingView
                style={styles.flex}
                behavior={Platform.OS === 'ios' ? 'padding' : undefined}
                keyboardVerticalOffset={0}
            >
                {messages === null ? (
                    <ActivityIndicator style={styles.loading} color="#18181B" />
                ) : (
                    <ScrollView contentContainerStyle={styles.thread}>
                        {messages.map((message) => (
                            <View
                                key={message.id}
                                style={[styles.bubbleRow, message.isMine && styles.bubbleRowMine]}
                            >
                                <View style={[styles.bubble, message.isMine ? styles.bubbleMine : styles.bubbleTheirs]}>
                                    {!message.isMine ? (
                                        <Text style={styles.sender}>{message.senderName}</Text>
                                    ) : null}
                                    <Text style={[styles.bubbleText, message.isMine && styles.bubbleTextMine]}>
                                        {message.body}
                                    </Text>
                                </View>
                            </View>
                        ))}
                    </ScrollView>
                )}

                {composerLocked ? (
                    <View style={styles.lockedBar}>
                        <Ionicons name="lock-closed-outline" size={14} color="#71717A" />
                        <Text style={styles.lockedText}>Only managers can post announcements</Text>
                    </View>
                ) : (
                    <View style={styles.composer}>
                        <TextInput
                            style={styles.input}
                            placeholder="Message"
                            placeholderTextColor="#A1A1AA"
                            value={draft}
                            onChangeText={setDraft}
                            multiline
                        />
                        <Pressable
                            accessibilityRole="button"
                            accessibilityLabel="Send message"
                            onPress={handleSend}
                            style={({ pressed }) => [styles.sendButton, pressed && styles.pressed]}
                        >
                            <Ionicons name="arrow-up" size={18} color="#FFFFFF" />
                        </Pressable>
                    </View>
                )}
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    safeArea: {
        flex: 1,
        backgroundColor: '#FFFFFF',
    },
    flex: {
        flex: 1,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 12,
        paddingVertical: 8,
        borderBottomWidth: StyleSheet.hairlineWidth,
        borderBottomColor: '#E4E4E7',
    },
    headerSide: {
        width: 44,
        minHeight: 44,
        justifyContent: 'center',
    },
    headerCenter: {
        flex: 1,
        alignItems: 'center',
        gap: 1,
    },
    headerTitle: {
        fontSize: 16,
        fontWeight: '700',
        color: '#18181B',
    },
    headerSubtitle: {
        fontSize: 11,
        color: '#71717A',
    },
    loading: {
        marginTop: 48,
    },
    thread: {
        padding: 16,
        gap: 10,
    },
    bubbleRow: {
        flexDirection: 'row',
    },
    bubbleRowMine: {
        justifyContent: 'flex-end',
    },
    bubble: {
        maxWidth: '80%',
        borderRadius: 16,
        paddingHorizontal: 13,
        paddingVertical: 9,
        gap: 2,
    },
    bubbleTheirs: {
        backgroundColor: '#F4F4F5',
        borderBottomLeftRadius: 4,
    },
    bubbleMine: {
        backgroundColor: '#18181B',
        borderBottomRightRadius: 4,
    },
    sender: {
        fontSize: 11,
        fontWeight: '800',
        color: '#71717A',
    },
    bubbleText: {
        fontSize: 15,
        color: '#18181B',
        lineHeight: 20,
    },
    bubbleTextMine: {
        color: '#FFFFFF',
    },
    lockedBar: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 6,
        paddingVertical: 14,
        borderTopWidth: StyleSheet.hairlineWidth,
        borderTopColor: '#E4E4E7',
    },
    lockedText: {
        fontSize: 12,
        color: '#71717A',
    },
    composer: {
        flexDirection: 'row',
        alignItems: 'flex-end',
        gap: 8,
        paddingHorizontal: 12,
        paddingVertical: 8,
        borderTopWidth: StyleSheet.hairlineWidth,
        borderTopColor: '#E4E4E7',
    },
    input: {
        flex: 1,
        minHeight: 38,
        maxHeight: 110,
        borderRadius: 19,
        backgroundColor: '#F4F4F5',
        paddingHorizontal: 14,
        paddingVertical: 9,
        fontSize: 15,
        color: '#18181B',
    },
    sendButton: {
        width: 38,
        height: 38,
        borderRadius: 19,
        backgroundColor: '#18181B',
        alignItems: 'center',
        justifyContent: 'center',
    },
    pressed: {
        opacity: 0.7,
    },
});
