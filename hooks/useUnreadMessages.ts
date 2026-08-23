import { useEffect, useState } from 'react';
import { useSession } from 'context/AuthenticationContext';
import { fetchUnreadCount } from 'services/messages-api';

/** Unread message total for header badges. Polls once per mount; a socket
 * or push-driven store can replace the fetch without touching consumers. */
export function useUnreadMessages(): number {
  const { session } = useSession();
  const userId = Number(session?.user?.id ?? 0);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    const controller = new AbortController();
    fetchUnreadCount({ userId, signal: controller.signal })
      .then(setUnreadCount)
      .catch(() => undefined);
    return () => controller.abort();
  }, [userId]);

  return unreadCount;
}
