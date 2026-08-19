const React = require('react');
const { Alert } = require('react-native');
const TestRenderer = require('react-test-renderer');
const { act } = TestRenderer;
const { setAccessToken } = require('services/api-client');
const { fetchCurrentUser, isUnauthorizedError } = require('services/auth-api');
const {
  beginRadiabaseReminderAccountTransition,
  cancelAllRadiabaseLeadAppointmentReminders,
  finishRadiabaseReminderAccountTransition,
} = require('services/lead-appointment-reminders');
const { SessionProvider, useSession } = require('./AuthenticationContext');

const mockStoredSession = {
  token: 'persisted-token',
  user: {
    id: '42',
    salesOrgId: 1,
    officeId: 3,
    verticalId: 5,
  },
};
const mockSetSession = jest.fn();
const mockInvalidateSession = jest.fn();
let mockInitialSession = mockStoredSession;
let mockPersistedSession = mockStoredSession;

jest.mock('hooks/useStorageState', () => ({
  useStorageState: () => {
    const ReactForMock = require('react');
    const [session, setSessionState] = ReactForMock.useState(mockInitialSession);
    return [
      false,
      session,
      async (value) => {
        await mockSetSession(value);
        mockPersistedSession = value;
        setSessionState(value);
      },
      async () => {
        setSessionState(null);
        await mockInvalidateSession();
        mockPersistedSession = null;
      },
    ];
  },
}));
jest.mock('services/api-client', () => ({
  setAccessToken: jest.fn(),
}));
jest.mock('services/auth-api', () => ({
  fetchCurrentUser: jest.fn(),
  isUnauthorizedError: jest.fn(() => false),
}));
jest.mock('services/lead-appointment-reminders', () => ({
  beginRadiabaseReminderAccountTransition: jest.fn(),
  cancelAllRadiabaseLeadAppointmentReminders: jest.fn().mockResolvedValue(undefined),
  finishRadiabaseReminderAccountTransition: jest.fn(),
  retryPendingRadiabaseReminderCleanup: jest.fn().mockResolvedValue(undefined),
}));
jest.mock('@react-native-async-storage/async-storage', () => ({
  removeItem: jest.fn().mockResolvedValue(undefined),
}));
jest.mock('store/LocalSettingsStore', () => ({
  useLocalSettingStore: () => ({ resetStore: jest.fn() }),
}));

let latest;

function Consumer() {
  latest = useSession();
  return null;
}

describe('SessionProvider logout', () => {
  let renderer;
  let alertSpy;

  beforeEach(() => {
    latest = null;
    renderer = null;
    jest.clearAllMocks();
    mockInitialSession = mockStoredSession;
    mockPersistedSession = mockStoredSession;
    mockSetSession.mockRejectedValue(new Error('keychain unavailable'));
    mockInvalidateSession.mockResolvedValue(undefined);
    fetchCurrentUser.mockResolvedValue({ id: 42 });
    isUnauthorizedError.mockReturnValue(false);
    alertSpy = jest.spyOn(Alert, 'alert').mockImplementation(() => undefined);
    globalThis.IS_REACT_ACT_ENVIRONMENT = true;
  });

  afterEach(async () => {
    if (renderer) {
      await act(async () => renderer.unmount());
    }
    alertSpy.mockRestore();
  });

  it('restores the active token when encrypted logout deletion fails', async () => {
    await act(async () => {
      renderer = TestRenderer.create(
        React.createElement(SessionProvider, null, React.createElement(Consumer)),
      );
    });
    setAccessToken.mockClear();

    await act(async () => latest.signOut());

    expect(setAccessToken).toHaveBeenCalledWith(null);
    expect(setAccessToken).toHaveBeenLastCalledWith(mockStoredSession.token);
    expect(alertSpy).toHaveBeenCalledWith(
      'Unable to securely erase this session. The account remains signed in; please try again.',
    );
  });

  it('reaches a logged-out state when an expired session cannot be deleted immediately', async () => {
    fetchCurrentUser.mockRejectedValueOnce(new Error('expired'));
    isUnauthorizedError.mockReturnValueOnce(true);
    mockInvalidateSession.mockRejectedValueOnce(new Error('keychain unavailable'));
    await act(async () => {
      renderer = TestRenderer.create(
        React.createElement(SessionProvider, null, React.createElement(Consumer)),
      );
    });
    setAccessToken.mockClear();

    await act(async () => latest.checkAuth());

    expect(latest.session).toBeNull();
    expect(mockInvalidateSession).toHaveBeenCalledTimes(1);
    expect(setAccessToken).toHaveBeenLastCalledWith(null);
    expect(setAccessToken).not.toHaveBeenCalledWith(mockStoredSession.token);
    expect(alertSpy).toHaveBeenCalledWith('Your session has expired. Please login again');
  });

  it('ignores a delayed 401 from an account that has already been replaced', async () => {
    let rejectOldCheck;
    fetchCurrentUser.mockImplementationOnce(() => new Promise((_, reject) => {
      rejectOldCheck = reject;
    }));
    isUnauthorizedError.mockReturnValue(true);
    mockSetSession.mockResolvedValue(undefined);
    await act(async () => {
      renderer = TestRenderer.create(
        React.createElement(SessionProvider, null, React.createElement(Consumer)),
      );
    });

    let oldCheckPromise;
    act(() => {
      oldCheckPromise = latest.checkAuth();
    });
    const replacementSession = {
      ...mockStoredSession,
      token: 'replacement-token',
      user: { ...mockStoredSession.user, id: '84' },
    };
    await act(async () => latest.signIn(replacementSession));
    await act(async () => {
      rejectOldCheck(new Error('old token expired'));
      await oldCheckPromise;
    });

    expect(latest.session).toEqual(replacementSession);
    expect(mockInvalidateSession).not.toHaveBeenCalled();
    expect(setAccessToken).toHaveBeenLastCalledWith('replacement-token');
  });

  it('never activates a stale sign-in while a newer sign-out is pending', async () => {
    mockInitialSession = null;
    let resolveSignInWrite;
    let resolveSignOutDelete;
    mockSetSession.mockImplementation((value) => new Promise((resolve) => {
      if (value === null) {
        resolveSignOutDelete = resolve;
      } else {
        resolveSignInWrite = resolve;
      }
    }));
    await act(async () => {
      renderer = TestRenderer.create(
        React.createElement(SessionProvider, null, React.createElement(Consumer)),
      );
    });
    setAccessToken.mockClear();
    beginRadiabaseReminderAccountTransition.mockClear();
    finishRadiabaseReminderAccountTransition.mockClear();

    let signInPromise;
    let signOutPromise;
    act(() => {
      signInPromise = latest.signIn({ ...mockStoredSession, token: 'stale-token' });
    });
    await act(async () => {
      await Promise.resolve();
      await Promise.resolve();
    });
    expect(resolveSignInWrite).toEqual(expect.any(Function));
    act(() => {
      signOutPromise = latest.signOut();
    });
    await act(async () => {
      resolveSignInWrite();
      await signInPromise;
    });

    expect(latest.session).toBeNull();
    expect(setAccessToken).not.toHaveBeenCalledWith('stale-token');
    expect(finishRadiabaseReminderAccountTransition).not.toHaveBeenCalled();

    await act(async () => {
      resolveSignOutDelete();
      await signOutPromise;
    });
    expect(latest.session).toBeNull();
    expect(setAccessToken).toHaveBeenLastCalledWith(null);
  });

  it('activates only the winner of overlapping sign-ins', async () => {
    mockInitialSession = null;
    const writeResolvers = new Map();
    mockSetSession.mockImplementation((value) => new Promise((resolve) => {
      writeResolvers.set(value.token, resolve);
    }));
    await act(async () => {
      renderer = TestRenderer.create(
        React.createElement(SessionProvider, null, React.createElement(Consumer)),
      );
    });
    setAccessToken.mockClear();
    finishRadiabaseReminderAccountTransition.mockClear();

    const firstSession = { ...mockStoredSession, token: 'first-token' };
    const secondSession = { ...mockStoredSession, token: 'second-token' };
    let firstPromise;
    let secondPromise;
    act(() => {
      firstPromise = latest.signIn(firstSession);
    });
    await act(async () => {
      await Promise.resolve();
      await Promise.resolve();
    });
    expect(writeResolvers.get('first-token')).toEqual(expect.any(Function));
    act(() => {
      secondPromise = latest.signIn(secondSession);
    });
    await act(async () => {
      await Promise.resolve();
      await Promise.resolve();
    });
    await act(async () => {
      writeResolvers.get('first-token')();
      await firstPromise;
    });
    expect(latest.session).toBeNull();
    expect(setAccessToken).not.toHaveBeenCalledWith('first-token');
    expect(finishRadiabaseReminderAccountTransition).not.toHaveBeenCalled();

    await act(async () => {
      writeResolvers.get('second-token')();
      await secondPromise;
    });
    expect(latest.session).toEqual(secondSession);
    expect(setAccessToken).toHaveBeenLastCalledWith('second-token');
    expect(finishRadiabaseReminderAccountTransition).toHaveBeenCalledTimes(1);
  });

  it('never persists a sign-in whose cleanup was superseded by logout', async () => {
    mockInitialSession = null;
    mockPersistedSession = null;
    let releaseSignInCleanup;
    cancelAllRadiabaseLeadAppointmentReminders
      .mockImplementationOnce(() => new Promise((resolve) => {
        releaseSignInCleanup = resolve;
      }))
      .mockResolvedValueOnce(undefined);
    mockSetSession.mockResolvedValue(undefined);
    await act(async () => {
      renderer = TestRenderer.create(
        React.createElement(SessionProvider, null, React.createElement(Consumer)),
      );
    });

    let staleSignInPromise;
    act(() => {
      staleSignInPromise = latest.signIn({ ...mockStoredSession, token: 'stale-token' });
    });
    await act(async () => {
      await Promise.resolve();
    });
    await act(async () => latest.signOut());
    expect(mockSetSession).toHaveBeenCalledWith(null);

    await act(async () => {
      releaseSignInCleanup();
      await staleSignInPromise;
    });

    expect(mockSetSession).not.toHaveBeenCalledWith(
      expect.objectContaining({ token: 'stale-token' }),
    );
    expect(latest.session).toBeNull();
    expect(setAccessToken).not.toHaveBeenCalledWith('stale-token');
  });

  it('rolls storage back when the winning overlapping sign-in fails', async () => {
    mockInitialSession = null;
    mockPersistedSession = null;
    let releaseFirstWrite;
    const firstWrite = new Promise((resolve) => {
      releaseFirstWrite = resolve;
    });
    mockSetSession.mockImplementation((value) => {
      if (value?.token === 'first-token') {
        return firstWrite;
      }
      if (value?.token === 'second-token') {
        return firstWrite.then(() => Promise.reject(new Error('keychain write failed')));
      }
      return firstWrite;
    });
    await act(async () => {
      renderer = TestRenderer.create(
        React.createElement(SessionProvider, null, React.createElement(Consumer)),
      );
    });

    let firstPromise;
    let secondPromise;
    act(() => {
      firstPromise = latest.signIn({ ...mockStoredSession, token: 'first-token' });
    });
    await act(async () => {
      await Promise.resolve();
      await Promise.resolve();
    });
    act(() => {
      secondPromise = latest.signIn({ ...mockStoredSession, token: 'second-token' });
    });
    await act(async () => {
      releaseFirstWrite();
      await firstPromise;
      await expect(secondPromise).rejects.toThrow('keychain write failed');
    });

    expect(latest.session).toBeNull();
    expect(mockPersistedSession).toBeNull();
    expect(setAccessToken).not.toHaveBeenCalledWith('first-token');
    expect(setAccessToken).not.toHaveBeenCalledWith('second-token');

    await act(async () => renderer.unmount());
    renderer = null;
    mockInitialSession = mockPersistedSession;
    await act(async () => {
      renderer = TestRenderer.create(
        React.createElement(SessionProvider, null, React.createElement(Consumer)),
      );
    });
    expect(latest.session).toBeNull();
  });

  it('does not restore a stale render snapshot when logout wins before sign-in fails', async () => {
    mockSetSession.mockImplementation((value) => (
      value?.token === 'replacement-token'
        ? Promise.reject(new Error('keychain write failed'))
        : Promise.resolve()
    ));
    await act(async () => {
      renderer = TestRenderer.create(
        React.createElement(SessionProvider, null, React.createElement(Consumer)),
      );
    });

    let signOutPromise;
    let signInPromise;
    act(() => {
      signOutPromise = latest.signOut();
      signInPromise = latest.signIn({ ...mockStoredSession, token: 'replacement-token' });
    });
    await act(async () => {
      await signOutPromise;
      await expect(signInPromise).rejects.toThrow('keychain write failed');
    });

    expect(latest.session).toBeNull();
    expect(mockPersistedSession).toBeNull();
    expect(setAccessToken).not.toHaveBeenLastCalledWith(mockStoredSession.token);
  });
});
