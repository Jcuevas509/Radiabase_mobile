import * as Notifications from 'expo-notifications';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  beginRadiabaseReminderAccountTransition,
  buildLeadAppointmentReminderKey,
  cancelAllRadiabaseLeadAppointmentReminders,
  cancelLeadAppointmentRemindersForScope,
  finishRadiabaseReminderAccountTransition,
  listLeadAppointmentReminderKeys,
  retryPendingRadiabaseReminderCleanup,
  scheduleLeadAppointmentReminder,
} from 'services/lead-appointment-reminders';

jest.mock('expo-notifications', () => ({
  SchedulableTriggerInputTypes: { DATE: 'date' },
  getPermissionsAsync: jest.fn(),
  requestPermissionsAsync: jest.fn(),
  getAllScheduledNotificationsAsync: jest.fn(),
  cancelScheduledNotificationAsync: jest.fn(),
  scheduleNotificationAsync: jest.fn(),
}));
jest.mock('@react-native-async-storage/async-storage', () => ({
  setItem: jest.fn(),
  getItem: jest.fn(),
  removeItem: jest.fn(),
}));

const getPermissions = Notifications.getPermissionsAsync as jest.Mock;
const requestPermissions = Notifications.requestPermissionsAsync as jest.Mock;
const getScheduled = Notifications.getAllScheduledNotificationsAsync as jest.Mock;
const cancelScheduled = Notifications.cancelScheduledNotificationAsync as jest.Mock;
const scheduleNotification = Notifications.scheduleNotificationAsync as jest.Mock;
const setStoredItem = AsyncStorage.setItem as jest.Mock;
const getStoredItem = AsyncStorage.getItem as jest.Mock;
const removeStoredItem = AsyncStorage.removeItem as jest.Mock;

const baseInput = {
  scopeKey: '42:1:3:5',
  leadId: 7,
  appointmentAt: '2026-08-20T18:00:00.000Z',
  nowMs: Date.parse('2026-08-20T16:00:00.000Z'),
};

function scheduledRequest(appointmentAt = baseInput.appointmentAt) {
  return {
    identifier: 'existing-id',
    content: {
      data: {
        radiabaseKind: 'radiabase-lead-appointment',
        radiabaseScopeKey: baseInput.scopeKey,
        radiabaseLeadId: baseInput.leadId,
        radiabaseAppointmentAt: appointmentAt,
      },
    },
  };
}

describe('lead appointment reminders', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    getPermissions.mockResolvedValue({ granted: true });
    getScheduled.mockResolvedValue([]);
    scheduleNotification.mockResolvedValue('new-id');
    setStoredItem.mockResolvedValue(undefined);
    getStoredItem.mockResolvedValue(null);
    removeStoredItem.mockResolvedValue(undefined);
    finishRadiabaseReminderAccountTransition();
  });

  it('does not request access or schedule a past appointment', async () => {
    const result = await scheduleLeadAppointmentReminder({
      ...baseInput,
      nowMs: Date.parse('2026-08-20T19:00:00.000Z'),
    });
    expect(result.status).toBe('appointment_unavailable');
    expect(getPermissions).not.toHaveBeenCalled();
    expect(scheduleNotification).not.toHaveBeenCalled();
  });

  it('fails closed when notification permission is denied', async () => {
    getPermissions.mockResolvedValue({ granted: false });
    requestPermissions.mockResolvedValue({ granted: false });
    const result = await scheduleLeadAppointmentReminder(baseInput);
    expect(result.status).toBe('permission_denied');
    expect(scheduleNotification).not.toHaveBeenCalled();
  });

  it('deduplicates an existing reminder and lists only the current scope', async () => {
    getScheduled.mockResolvedValue([
      scheduledRequest(),
      {
        ...scheduledRequest(),
        identifier: 'other-scope',
        content: { data: { ...scheduledRequest().content.data, radiabaseScopeKey: 'other' } },
      },
    ]);
    const result = await scheduleLeadAppointmentReminder(baseInput);
    expect(result.status).toBe('already_scheduled');
    expect(scheduleNotification).not.toHaveBeenCalled();

    const keys = await listLeadAppointmentReminderKeys(baseInput.scopeKey);
    expect([...keys]).toEqual([buildLeadAppointmentReminderKey(baseInput)]);
  });

  it('replaces an outdated lead reminder and schedules 30 minutes before', async () => {
    getScheduled.mockResolvedValue([scheduledRequest('2026-08-20T17:00:00.000Z')]);
    const result = await scheduleLeadAppointmentReminder(baseInput);
    expect(cancelScheduled).toHaveBeenCalledWith('existing-id');
    expect(scheduleNotification).toHaveBeenCalledWith(expect.objectContaining({
      content: expect.objectContaining({
        title: 'Upcoming appointment',
        body: 'Open Radiabase to review your scheduled lead.',
      }),
      trigger: expect.objectContaining({
        type: 'date',
        date: new Date('2026-08-20T17:30:00.000Z'),
      }),
    }));
    expect(result.status).toBe('scheduled');
  });

  it('keeps the old reminder when scheduling its replacement fails', async () => {
    getScheduled.mockResolvedValue([scheduledRequest('2026-08-20T17:00:00.000Z')]);
    scheduleNotification.mockRejectedValueOnce(new Error('native scheduling failed'));

    await expect(scheduleLeadAppointmentReminder(baseInput)).rejects
      .toThrow('native scheduling failed');
    expect(cancelScheduled).not.toHaveBeenCalled();
  });

  it('cancels only reminders belonging to the signed-out scope', async () => {
    getScheduled.mockResolvedValue([
      scheduledRequest(),
      {
        ...scheduledRequest(),
        identifier: 'other-scope',
        content: { data: { ...scheduledRequest().content.data, radiabaseScopeKey: 'other' } },
      },
    ]);
    await cancelLeadAppointmentRemindersForScope(baseInput.scopeKey);
    expect(cancelScheduled).toHaveBeenCalledTimes(1);
    expect(cancelScheduled).toHaveBeenCalledWith('existing-id');
  });

  it('cancels every Radiabase reminder on logout but preserves unrelated notifications', async () => {
    getScheduled.mockResolvedValue([
      scheduledRequest(),
      { identifier: 'unrelated', content: { data: { kind: 'another-app-feature' } } },
    ]);
    await cancelAllRadiabaseLeadAppointmentReminders();
    expect(setStoredItem).toHaveBeenCalledWith(
      'pending-radiabase-reminder-cleanup',
      JSON.stringify({ all: true, scopes: [] }),
    );
    expect(cancelScheduled).toHaveBeenCalledTimes(1);
    expect(cancelScheduled).toHaveBeenCalledWith('existing-id');
    expect(removeStoredItem).toHaveBeenCalledWith('pending-radiabase-reminder-cleanup');
  });

  it('keeps and retries the cleanup marker after a native cancellation failure', async () => {
    getScheduled.mockResolvedValue([scheduledRequest()]);
    cancelScheduled
      .mockRejectedValueOnce(new Error('native cancellation failed'))
      .mockResolvedValueOnce(undefined);
    await expect(cancelAllRadiabaseLeadAppointmentReminders()).rejects
      .toThrow('could not be cancelled');
    expect(removeStoredItem).not.toHaveBeenCalled();

    getStoredItem.mockResolvedValueOnce('1');
    await retryPendingRadiabaseReminderCleanup();
    expect(cancelScheduled).toHaveBeenCalledTimes(2);
    expect(removeStoredItem).toHaveBeenCalledWith('pending-radiabase-reminder-cleanup');
  });

  it('durably retries cleanup for a reminder created during an account transition', async () => {
    getScheduled.mockResolvedValue([scheduledRequest()]);
    cancelScheduled
      .mockRejectedValueOnce(new Error('native cancellation failed'))
      .mockResolvedValueOnce(undefined);

    await expect(cancelLeadAppointmentRemindersForScope(baseInput.scopeKey)).rejects
      .toThrow('previous account');
    expect(setStoredItem).toHaveBeenCalledWith(
      'pending-radiabase-reminder-cleanup',
      JSON.stringify({ all: false, scopes: [baseInput.scopeKey] }),
    );
    expect(removeStoredItem).not.toHaveBeenCalled();

    getStoredItem
      .mockResolvedValueOnce(JSON.stringify({ all: false, scopes: [baseInput.scopeKey] }))
      .mockResolvedValueOnce(JSON.stringify({ all: false, scopes: [baseInput.scopeKey] }));
    await retryPendingRadiabaseReminderCleanup();
    expect(cancelScheduled).toHaveBeenCalledTimes(2);
    expect(removeStoredItem).toHaveBeenCalledWith('pending-radiabase-reminder-cleanup');
  });

  it('attempts native cleanup even when the retry marker cannot be written', async () => {
    getScheduled.mockResolvedValue([scheduledRequest()]);
    setStoredItem.mockRejectedValueOnce(new Error('storage unavailable'));
    cancelScheduled.mockRejectedValueOnce(new Error('native cancellation failed'));

    await expect(cancelAllRadiabaseLeadAppointmentReminders()).rejects
      .toThrow('storage unavailable');
    expect(getScheduled).toHaveBeenCalledTimes(1);
    expect(cancelScheduled).toHaveBeenCalledWith('existing-id');
    expect(removeStoredItem).not.toHaveBeenCalled();
  });

  it('serializes logout after an in-flight schedule and rejects the stale result', async () => {
    let resolveNativeSchedule: (identifier: string) => void = () => undefined;
    scheduleNotification.mockImplementationOnce(() => new Promise<string>((resolve) => {
      resolveNativeSchedule = resolve;
    }));
    getScheduled
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce([scheduledRequest()]);

    const schedulePromise = scheduleLeadAppointmentReminder(baseInput);
    await new Promise((resolve) => setImmediate(() => resolve(undefined)));
    expect(scheduleNotification).toHaveBeenCalledTimes(1);
    beginRadiabaseReminderAccountTransition();
    const logoutCleanupPromise = cancelAllRadiabaseLeadAppointmentReminders();
    resolveNativeSchedule('new-id');

    await expect(schedulePromise).resolves.toEqual({ status: 'account_changed' });
    await expect(logoutCleanupPromise).resolves.toBeUndefined();
    expect(cancelScheduled).toHaveBeenCalledWith('existing-id');
    expect(getScheduled.mock.invocationCallOrder[1])
      .toBeGreaterThan(scheduleNotification.mock.invocationCallOrder[0]);
  });
});
