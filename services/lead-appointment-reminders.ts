import * as Notifications from 'expo-notifications';
import AsyncStorage from '@react-native-async-storage/async-storage';

const REMINDER_KIND = 'radiabase-lead-appointment';
const THIRTY_MINUTES_MS = 30 * 60 * 1000;
const MINIMUM_SCHEDULE_AHEAD_MS = 5 * 1000;
const PENDING_REMINDER_CLEANUP_KEY = 'pending-radiabase-reminder-cleanup';

type PendingReminderCleanup = {
  readonly all: boolean;
  readonly scopes: readonly string[];
};

let cleanupQueue: Promise<unknown> = Promise.resolve();

type ReminderData = {
  readonly radiabaseKind?: unknown;
  readonly radiabaseScopeKey?: unknown;
  readonly radiabaseLeadId?: unknown;
  readonly radiabaseAppointmentAt?: unknown;
};

export type ScheduleLeadReminderResult =
  | { readonly status: 'scheduled' | 'already_scheduled'; readonly reminderKey: string }
  | { readonly status: 'permission_denied' | 'appointment_unavailable' | 'account_changed' };

let reminderAccountGeneration = 0;
let isReminderSchedulingBlocked = true;

export function beginRadiabaseReminderAccountTransition(): void {
  reminderAccountGeneration += 1;
  isReminderSchedulingBlocked = true;
}

export function finishRadiabaseReminderAccountTransition(): void {
  isReminderSchedulingBlocked = false;
}

export function buildLeadAppointmentReminderKey(input: {
  readonly scopeKey: string;
  readonly leadId: number;
  readonly appointmentAt: string;
}): string {
  return `${input.scopeKey}:${input.leadId}:${input.appointmentAt}`;
}

function isMatchingLeadReminder(
  data: ReminderData,
  scopeKey: string,
  leadId?: number,
): boolean {
  return data.radiabaseKind === REMINDER_KIND
    && data.radiabaseScopeKey === scopeKey
    && (leadId === undefined || data.radiabaseLeadId === leadId);
}

export async function listLeadAppointmentReminderKeys(scopeKey: string): Promise<Set<string>> {
  const scheduled = await Notifications.getAllScheduledNotificationsAsync();
  const keys = scheduled.flatMap((request) => {
    const data = (request.content.data ?? {}) as ReminderData;
    if (!isMatchingLeadReminder(data, scopeKey)) {
      return [];
    }
    if (
      typeof data.radiabaseLeadId !== 'number'
      || typeof data.radiabaseAppointmentAt !== 'string'
    ) {
      return [];
    }
    return [buildLeadAppointmentReminderKey({
      scopeKey,
      leadId: data.radiabaseLeadId,
      appointmentAt: data.radiabaseAppointmentAt,
    })];
  });
  return new Set(keys);
}

function enqueueCleanup<T>(operation: () => Promise<T>): Promise<T> {
  const pending = cleanupQueue.catch(() => undefined).then(operation);
  cleanupQueue = pending.catch(() => undefined);
  return pending;
}

function parsePendingCleanup(value: string | null): PendingReminderCleanup {
  if (!value) {
    return { all: false, scopes: [] };
  }
  if (value === '1') {
    return { all: true, scopes: [] };
  }
  try {
    const parsed = JSON.parse(value) as Partial<PendingReminderCleanup>;
    return {
      all: parsed.all === true,
      scopes: Array.isArray(parsed.scopes)
        ? parsed.scopes.filter((scope): scope is string => typeof scope === 'string')
        : [],
    };
  } catch {
    // A malformed marker is treated as a request for the safest global cleanup.
    return { all: true, scopes: [] };
  }
}

async function storePendingCleanup(next: PendingReminderCleanup): Promise<void> {
  await AsyncStorage.setItem(PENDING_REMINDER_CLEANUP_KEY, JSON.stringify(next));
}

async function cancelLeadAppointmentRemindersForScopeNow(scopeKey: string): Promise<void> {
  const scheduled = await Notifications.getAllScheduledNotificationsAsync();
  const results = await Promise.allSettled(scheduled.flatMap((request) => {
    const data = (request.content.data ?? {}) as ReminderData;
    return isMatchingLeadReminder(data, scopeKey)
      ? [Notifications.cancelScheduledNotificationAsync(request.identifier)]
      : [];
  }));
  if (results.some((result) => result.status === 'rejected')) {
    throw new Error('One or more reminders for the previous account could not be cancelled.');
  }
}

async function cancelAllRadiabaseLeadAppointmentRemindersNow(): Promise<void> {
  const scheduled = await Notifications.getAllScheduledNotificationsAsync();
  const results = await Promise.allSettled(scheduled.flatMap((request) => {
    const data = (request.content.data ?? {}) as ReminderData;
    return data.radiabaseKind === REMINDER_KIND
      ? [Notifications.cancelScheduledNotificationAsync(request.identifier)]
      : [];
  }));
  if (results.some((result) => result.status === 'rejected')) {
    throw new Error('One or more Radiabase reminders could not be cancelled.');
  }
}

export async function cancelLeadAppointmentRemindersForScope(scopeKey: string): Promise<void> {
  return enqueueCleanup(async () => {
    let markerStored = false;
    let markerError: unknown;
    try {
      const current = parsePendingCleanup(
        await AsyncStorage.getItem(PENDING_REMINDER_CLEANUP_KEY),
      );
      await storePendingCleanup({
        all: current.all,
        scopes: current.all ? [] : [...new Set([...current.scopes, scopeKey])],
      });
      markerStored = true;
    } catch (error) {
      markerError = error;
    }

    try {
      await cancelLeadAppointmentRemindersForScopeNow(scopeKey);
    } catch (error) {
      throw markerStored ? error : markerError ?? error;
    }

    if (markerStored) {
      const current = parsePendingCleanup(
        await AsyncStorage.getItem(PENDING_REMINDER_CLEANUP_KEY),
      );
      if (!current.all) {
        const remainingScopes = current.scopes.filter((scope) => scope !== scopeKey);
        if (remainingScopes.length === 0) {
          await AsyncStorage.removeItem(PENDING_REMINDER_CLEANUP_KEY);
        } else {
          await storePendingCleanup({ all: false, scopes: remainingScopes });
        }
      }
    }
  });
}

export async function cancelAllRadiabaseLeadAppointmentReminders(): Promise<void> {
  return enqueueCleanup(async () => {
    let markerStored = false;
    let markerError: unknown;
    try {
      await storePendingCleanup({ all: true, scopes: [] });
      markerStored = true;
    } catch (error) {
      markerError = error;
    }

    try {
      await cancelAllRadiabaseLeadAppointmentRemindersNow();
    } catch (error) {
      throw markerStored ? error : markerError ?? error;
    }

    if (markerStored) {
      await AsyncStorage.removeItem(PENDING_REMINDER_CLEANUP_KEY);
    }
  });
}

export async function retryPendingRadiabaseReminderCleanup(): Promise<void> {
  const pending = parsePendingCleanup(
    await AsyncStorage.getItem(PENDING_REMINDER_CLEANUP_KEY),
  );
  if (pending.all) {
    await cancelAllRadiabaseLeadAppointmentReminders();
    return;
  }
  for (const scopeKey of pending.scopes) {
    await cancelLeadAppointmentRemindersForScope(scopeKey);
  }
}

export async function scheduleLeadAppointmentReminder(input: {
  readonly scopeKey: string;
  readonly leadId: number;
  readonly appointmentAt: string;
  readonly nowMs?: number;
}): Promise<ScheduleLeadReminderResult> {
  const requestGeneration = reminderAccountGeneration;
  return enqueueCleanup<ScheduleLeadReminderResult>(async () => {
    if (isReminderSchedulingBlocked || requestGeneration !== reminderAccountGeneration) {
      return { status: 'account_changed' };
    }

    const appointmentMs = Date.parse(input.appointmentAt);
    const nowMs = input.nowMs ?? Date.now();
    if (!Number.isFinite(appointmentMs) || appointmentMs <= nowMs + MINIMUM_SCHEDULE_AHEAD_MS) {
      return { status: 'appointment_unavailable' };
    }

    const currentPermission = await Notifications.getPermissionsAsync();
    const permission = currentPermission.granted
      ? currentPermission
      : await Notifications.requestPermissionsAsync();
    if (!permission.granted) {
      return { status: 'permission_denied' };
    }
    if (isReminderSchedulingBlocked || requestGeneration !== reminderAccountGeneration) {
      return { status: 'account_changed' };
    }

    const reminderKey = buildLeadAppointmentReminderKey(input);
    const scheduled = await Notifications.getAllScheduledNotificationsAsync();
    const outdatedReminderIds: string[] = [];
    for (const request of scheduled) {
      const data = (request.content.data ?? {}) as ReminderData;
      if (!isMatchingLeadReminder(data, input.scopeKey, input.leadId)) {
        continue;
      }
      if (data.radiabaseAppointmentAt === input.appointmentAt) {
        return { status: 'already_scheduled', reminderKey };
      }
      outdatedReminderIds.push(request.identifier);
    }

    const preferredReminderMs = appointmentMs - THIRTY_MINUTES_MS;
    const triggerMs = preferredReminderMs > nowMs + MINIMUM_SCHEDULE_AHEAD_MS
      ? preferredReminderMs
      : appointmentMs;
    await Notifications.scheduleNotificationAsync({
      content: {
        title: 'Upcoming appointment',
        body: 'Open Radiabase to review your scheduled lead.',
        sound: 'default',
        data: {
          radiabaseKind: REMINDER_KIND,
          radiabaseScopeKey: input.scopeKey,
          radiabaseLeadId: input.leadId,
          radiabaseAppointmentAt: input.appointmentAt,
        },
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.DATE,
        date: new Date(triggerMs),
      },
    });
    if (isReminderSchedulingBlocked || requestGeneration !== reminderAccountGeneration) {
      return { status: 'account_changed' };
    }
    await Promise.allSettled(outdatedReminderIds.map((identifier) => (
      Notifications.cancelScheduledNotificationAsync(identifier)
    )));

    return { status: 'scheduled', reminderKey };
  });
}
