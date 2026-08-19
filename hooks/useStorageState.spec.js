const React = require('react');
const TestRenderer = require('react-test-renderer');
const { act } = TestRenderer;
const SecureStore = require('expo-secure-store');
const AsyncStorage = require('@react-native-async-storage/async-storage');
const {
  getPendingSecureStorageDeletionKey,
  useStorageState,
} = require('./useStorageState');

jest.mock('expo-secure-store', () => ({
  getItemAsync: jest.fn(),
  setItemAsync: jest.fn(),
  deleteItemAsync: jest.fn(),
}));
jest.mock('@react-native-async-storage/async-storage', () => ({
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
}));

let latest;

function Harness() {
  latest = useStorageState('session');
  return null;
}

describe('useStorageState', () => {
  let renderer;

  beforeEach(() => {
    latest = null;
    renderer = null;
    jest.clearAllMocks();
    SecureStore.deleteItemAsync.mockResolvedValue(undefined);
    SecureStore.setItemAsync.mockResolvedValue(undefined);
    AsyncStorage.getItem.mockResolvedValue(null);
    AsyncStorage.setItem.mockResolvedValue(undefined);
    AsyncStorage.removeItem.mockResolvedValue(undefined);
    globalThis.IS_REACT_ACT_ENVIRONMENT = true;
  });

  afterEach(async () => {
    if (renderer) {
      await act(async () => renderer.unmount());
    }
  });

  it.each([
    ['a SecureStore read failure', () => Promise.reject(new Error('read failed'))],
    ['malformed JSON', () => Promise.resolve('{bad json')],
  ])('fails closed and settles loading after %s', async (_, readResult) => {
    SecureStore.getItemAsync.mockImplementationOnce(readResult);
    await act(async () => {
      renderer = TestRenderer.create(React.createElement(Harness));
      await Promise.resolve();
      await Promise.resolve();
      await Promise.resolve();
    });

    expect(latest[0]).toBe(false);
    expect(latest[1]).toBeNull();
    expect(SecureStore.deleteItemAsync).toHaveBeenCalledWith('session');
  });

  it('returns an awaitable setter that persists the next value', async () => {
    SecureStore.getItemAsync.mockResolvedValueOnce(null);
    await act(async () => {
      renderer = TestRenderer.create(React.createElement(Harness));
      await Promise.resolve();
    });
    await act(async () => latest[2]({ token: 'server-token' }));

    expect(SecureStore.setItemAsync).toHaveBeenCalledWith(
      'session',
      JSON.stringify({ token: 'server-token' }),
    );
    expect(latest[1]).toEqual({ token: 'server-token' });
  });

  it('does not activate a session that could not be stored securely', async () => {
    SecureStore.getItemAsync.mockResolvedValueOnce(null);
    SecureStore.setItemAsync.mockRejectedValueOnce(new Error('disk unavailable'));
    await act(async () => {
      renderer = TestRenderer.create(React.createElement(Harness));
      await Promise.resolve();
    });

    await expect(act(async () => latest[2]({ token: 'server-token' }))).rejects
      .toThrow('disk unavailable');
    expect(latest[1]).toBeNull();
  });

  it('does not show a successful logout until the encrypted session is erased', async () => {
    SecureStore.getItemAsync.mockResolvedValueOnce(JSON.stringify({ token: 'server-token' }));
    SecureStore.deleteItemAsync.mockRejectedValueOnce(new Error('keychain unavailable'));
    await act(async () => {
      renderer = TestRenderer.create(React.createElement(Harness));
      await Promise.resolve();
    });

    await expect(act(async () => latest[2](null))).rejects.toThrow('keychain unavailable');
    expect(latest[1]).toEqual({ token: 'server-token' });
  });

  it('serializes a new login after corrupt-session cleanup finishes', async () => {
    let resolveDelete;
    let writePromise;
    SecureStore.getItemAsync.mockResolvedValueOnce('{bad json');
    SecureStore.deleteItemAsync.mockImplementationOnce(() => new Promise((resolve) => {
      resolveDelete = resolve;
    }));
    await act(async () => {
      renderer = TestRenderer.create(React.createElement(Harness));
      await Promise.resolve();
    });

    act(() => {
      writePromise = latest[2]({ token: 'new-token' });
    });
    expect(latest[0]).toBe(true);
    expect(SecureStore.setItemAsync).not.toHaveBeenCalled();

    await act(async () => {
      resolveDelete();
      await writePromise;
    });
    expect(SecureStore.deleteItemAsync.mock.invocationCallOrder[0])
      .toBeLessThan(SecureStore.setItemAsync.mock.invocationCallOrder[0]);
    expect(latest[1]).toEqual({ token: 'new-token' });
  });

  it('fails closed and leaves a durable tombstone when invalid-session deletion fails', async () => {
    SecureStore.getItemAsync.mockResolvedValueOnce(JSON.stringify({ token: 'expired-token' }));
    await act(async () => {
      renderer = TestRenderer.create(React.createElement(Harness));
      await Promise.resolve();
    });
    SecureStore.deleteItemAsync.mockRejectedValueOnce(new Error('keychain unavailable'));

    let invalidationError;
    await act(async () => {
      try {
        await latest[3]();
      } catch (error) {
        invalidationError = error;
      }
    });

    expect(invalidationError).toEqual(expect.objectContaining({ message: 'keychain unavailable' }));
    expect(latest[1]).toBeNull();
    expect(AsyncStorage.setItem).toHaveBeenCalledWith(
      getPendingSecureStorageDeletionKey('session'),
      '1',
    );
    expect(AsyncStorage.removeItem).not.toHaveBeenCalled();
  });

  it('never rehydrates a tombstoned session and retries deletion on startup', async () => {
    AsyncStorage.getItem.mockResolvedValueOnce('1');
    SecureStore.deleteItemAsync.mockRejectedValueOnce(new Error('still unavailable'));
    SecureStore.getItemAsync.mockResolvedValueOnce(JSON.stringify({ token: 'expired-token' }));

    await act(async () => {
      renderer = TestRenderer.create(React.createElement(Harness));
      await Promise.resolve();
    });

    expect(latest[0]).toBe(false);
    expect(latest[1]).toBeNull();
    expect(SecureStore.getItemAsync).not.toHaveBeenCalled();
    expect(AsyncStorage.removeItem).not.toHaveBeenCalled();
  });

  it('replaces a tombstoned expired session without deleting the new login on remount', async () => {
    SecureStore.getItemAsync.mockResolvedValueOnce(JSON.stringify({ token: 'expired-token' }));
    await act(async () => {
      renderer = TestRenderer.create(React.createElement(Harness));
      await Promise.resolve();
    });
    SecureStore.deleteItemAsync
      .mockRejectedValueOnce(new Error('temporarily unavailable'))
      .mockResolvedValueOnce(undefined);
    await act(async () => {
      await latest[3]().catch(() => undefined);
    });
    expect(latest[1]).toBeNull();

    AsyncStorage.getItem.mockResolvedValueOnce('1');
    await act(async () => latest[2]({ token: 'replacement-token' }));
    expect(latest[1]).toEqual({ token: 'replacement-token' });
    expect(AsyncStorage.removeItem).toHaveBeenCalledWith(
      getPendingSecureStorageDeletionKey('session'),
    );

    await act(async () => renderer.unmount());
    renderer = null;
    AsyncStorage.getItem.mockReset().mockResolvedValue(null);
    SecureStore.getItemAsync.mockReset().mockResolvedValue(
      JSON.stringify({ token: 'replacement-token' }),
    );
    await act(async () => {
      renderer = TestRenderer.create(React.createElement(Harness));
      await Promise.resolve();
      await Promise.resolve();
      await Promise.resolve();
    });
    expect(latest[1]).toEqual({ token: 'replacement-token' });
  });
});
