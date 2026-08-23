import type { ChatMessage, Conversation } from 'types/messages.types';

export const SAMPLE_CONVERSATIONS: readonly Conversation[] = [
  {
    id: 1, kind: 'announcement', title: 'Suntrappers Announcements', subtitle: 'Managers only can post',
    lastMessagePreview: 'Storm rolling in around 6 — wrap up your areas early tonight.',
    lastMessageMinutesAgo: 34, unreadCount: 1,
  },
  {
    id: 2, kind: 'channel', title: 'Suntrappers Office', subtitle: '14 members',
    lastMessagePreview: 'Devon: anyone got extra door hangers in their trunk?',
    lastMessageMinutesAgo: 12, unreadCount: 3,
  },
  {
    id: 3, kind: 'dm', title: 'Jose Cuevas', subtitle: 'Closer · Suntrappers',
    lastMessagePreview: 'Send me the Delgado utility bill when you get a sec',
    lastMessageMinutesAgo: 65, unreadCount: 0,
  },
  {
    id: 4, kind: 'dm', title: 'Maria Santos', subtitle: 'Closer · Suntrappers',
    lastMessagePreview: 'You: locked in the 4:30, she wants her husband there',
    lastMessageMinutesAgo: 190, unreadCount: 0,
  },
];

export const SAMPLE_MESSAGES: readonly ChatMessage[] = [
  { id: 11, conversationId: 3, senderName: 'Jose Cuevas', isMine: false, body: 'Yo — how did the Delgado sit-down go?', sentMinutesAgo: 130 },
  { id: 12, conversationId: 3, senderName: 'Me', isMine: true, body: 'Really good. She is ready, just wants to see the final numbers.', sentMinutesAgo: 122 },
  { id: 13, conversationId: 3, senderName: 'Jose Cuevas', isMine: false, body: 'Send me the Delgado utility bill when you get a sec', sentMinutesAgo: 65 },
  { id: 21, conversationId: 2, senderName: 'Sarah Kim', isMine: false, body: 'Firewheel gate code changed, it is 4417 now', sentMinutesAgo: 44 },
  { id: 22, conversationId: 2, senderName: 'Devon Carter', isMine: false, body: 'anyone got extra door hangers in their trunk?', sentMinutesAgo: 12 },
  { id: 31, conversationId: 1, senderName: 'Adam Wolfson', isMine: false, body: 'Storm rolling in around 6 — wrap up your areas early tonight.', sentMinutesAgo: 34 },
];
