import type { ChatMessage, Conversation } from 'types/messages.types';
import { SAMPLE_CONVERSATIONS, SAMPLE_MESSAGES } from 'services/sample-messages';

const SAMPLE_LATENCY_MS = 300;

function sampleResponse<T>(data: T, signal?: AbortSignal): Promise<T> {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => resolve(data), SAMPLE_LATENCY_MS);
    signal?.addEventListener('abort', () => {
      clearTimeout(timer);
      // Hermes has no DOMException; a named Error matches axios' abort shape.
      const abortError = new Error('Aborted');
      abortError.name = 'AbortError';
      reject(abortError);
    });
  });
}

// Seam: GET /messages/conversations?userId=
export async function fetchConversations(input: {
  readonly userId: number;
  readonly signal?: AbortSignal;
}): Promise<readonly Conversation[]> {
  return sampleResponse(SAMPLE_CONVERSATIONS, input.signal);
}

// Seam: GET /messages/conversations/:conversationId
export async function fetchMessages(input: {
  readonly conversationId: number;
  readonly signal?: AbortSignal;
}): Promise<readonly ChatMessage[]> {
  return sampleResponse(
    SAMPLE_MESSAGES.filter((message) => message.conversationId === input.conversationId),
    input.signal,
  );
}

// Seam: POST /messages/conversations/:conversationId body={body}
export async function sendMessage(input: {
  readonly conversationId: number;
  readonly body: string;
}): Promise<void> {
  return sampleResponse(undefined);
}

/** Unread total for the header badge.
 * Seam: GET /messages/unread-count?userId= (or derive from a socket later). */
export async function fetchUnreadCount(input: {
  readonly userId: number;
  readonly signal?: AbortSignal;
}): Promise<number> {
  const total = SAMPLE_CONVERSATIONS.reduce((sum, conversation) => sum + conversation.unreadCount, 0);
  return sampleResponse(total, input.signal);
}
