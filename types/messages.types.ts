/** Domain models for in-app messaging (rep DMs, office channels,
 * manager announcements). */

export type ConversationKind = 'dm' | 'channel' | 'announcement';

export type Conversation = {
  readonly id: number;
  readonly kind: ConversationKind;
  readonly title: string;
  readonly subtitle: string | null;
  readonly lastMessagePreview: string;
  readonly lastMessageMinutesAgo: number;
  readonly unreadCount: number;
};

export type ChatMessage = {
  readonly id: number;
  readonly conversationId: number;
  readonly senderName: string;
  readonly isMine: boolean;
  readonly body: string;
  readonly sentMinutesAgo: number;
};
