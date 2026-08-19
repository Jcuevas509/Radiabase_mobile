const React = require('react');
const { AppState } = require('react-native');
const TestRenderer = require('react-test-renderer');
const { act } = TestRenderer;
const { fetchMapHouses } = require('services/area-api');
const { useMapHousesViewport } = require('./useMapHousesViewport');

jest.mock('services/area-api', () => ({
  fetchMapHouses: jest.fn(),
}));

const region = {
  latitude: 40,
  longitude: -74,
  latitudeDelta: 0.003,
  longitudeDelta: 0.003,
};
const areaIds = [2];

function house(currentStatus) {
  return {
    id: 1,
    areaId: 2,
    latitude: 40,
    longitude: -74,
    address: '1 Main St',
    city: 'Town',
    state: 'NY',
    zip: '10001',
    currentStatus,
    notes: null,
    leadId: null,
  };
}

let latest = null;

function Harness({
  assignedAreaIds = areaIds,
  isEnabled = true,
  liveSyncIntervalMs = 1_000,
  mapRegion = region,
} = {}) {
  latest = useMapHousesViewport({
    region: mapRegion,
    areaIds: assignedAreaIds,
    isEnabled,
    scopeKey: 'user:org:office',
    liveSyncIntervalMs,
  });
  return null;
}

describe('useMapHousesViewport live sync', () => {
  let appStateListener = null;
  let appStateRemove;
  let appStateSpy;
  let renderer = null;

  beforeEach(() => {
    jest.useFakeTimers();
    latest = null;
    fetchMapHouses.mockReset();
    Object.defineProperty(AppState, 'currentState', {
      configurable: true,
      value: 'active',
    });
    appStateSpy = jest.spyOn(AppState, 'addEventListener').mockImplementation((_, listener) => {
      appStateListener = listener;
      appStateRemove = jest.fn();
      return { remove: appStateRemove };
    });
    globalThis.IS_REACT_ACT_ENVIRONMENT = true;
  });

  afterEach(async () => {
    if (renderer) {
      await act(async () => renderer?.unmount());
    }
    renderer = null;
    appStateSpy.mockRestore();
    jest.useRealTimers();
  });

  it('refreshes while active, retains pins on a transient failure, and refreshes on resume', async () => {
    fetchMapHouses
      .mockResolvedValueOnce([house('not_home')])
      .mockRejectedValueOnce(new Error('temporary network failure'))
      .mockResolvedValueOnce([house('interested')]);

    await act(async () => {
      renderer = TestRenderer.create(React.createElement(Harness));
    });
    await act(async () => {
      jest.advanceTimersByTime(350);
      await Promise.resolve();
    });
    expect(fetchMapHouses).toHaveBeenCalledTimes(1);
    expect(latest?.houses[0]?.currentStatus).toBe('not_home');
    expect(latest?.isReady).toBe(true);

    await act(async () => {
      jest.advanceTimersByTime(1_000);
    });
    await act(async () => {
      jest.advanceTimersByTime(350);
      await Promise.resolve();
    });
    expect(fetchMapHouses).toHaveBeenCalledTimes(2);
    expect(latest?.houses[0]?.currentStatus).toBe('not_home');
    expect(latest?.hasError).toBe(true);
    expect(latest?.isReady).toBe(false);

    await act(async () => appStateListener?.('background'));
    await act(async () => jest.advanceTimersByTime(5_000));
    expect(fetchMapHouses).toHaveBeenCalledTimes(2);

    await act(async () => appStateListener?.('active'));
    await act(async () => {
      jest.advanceTimersByTime(350);
      await Promise.resolve();
    });
    expect(fetchMapHouses).toHaveBeenCalledTimes(3);
    expect(latest?.houses[0]?.currentStatus).toBe('interested');
    expect(latest?.hasError).toBe(false);
    expect(latest?.isReady).toBe(true);
  });

  it('clears retained houses when the assigned-area query changes and replacement fails', async () => {
    fetchMapHouses
      .mockResolvedValueOnce([house('not_home')])
      .mockRejectedValueOnce(new Error('temporary network failure'));

    await act(async () => {
      renderer = TestRenderer.create(React.createElement(Harness, {
        assignedAreaIds: [2],
        liveSyncIntervalMs: 0,
      }));
    });
    await act(async () => {
      jest.advanceTimersByTime(350);
      await Promise.resolve();
    });
    expect(latest?.houses).toHaveLength(1);

    await act(async () => {
      renderer.update(React.createElement(Harness, {
        assignedAreaIds: [3],
        liveSyncIntervalMs: 0,
      }));
    });
    await act(async () => {
      jest.advanceTimersByTime(350);
      await Promise.resolve();
    });

    expect(fetchMapHouses).toHaveBeenCalledTimes(2);
    expect(latest?.houses).toEqual([]);
    expect(latest?.hasError).toBe(true);
    expect(latest?.isReady).toBe(false);
  });

  it('aborts an active request and removes live-sync work when disabled or unmounted', async () => {
    let resolveRequest;
    let receivedSignal;
    fetchMapHouses.mockImplementationOnce((_, __, signal) => {
      receivedSignal = signal;
      return new Promise((resolve) => {
        resolveRequest = resolve;
      });
    });

    await act(async () => {
      renderer = TestRenderer.create(React.createElement(Harness, {
        liveSyncIntervalMs: 1_000,
      }));
    });
    await act(async () => jest.advanceTimersByTime(350));
    expect(fetchMapHouses).toHaveBeenCalledTimes(1);
    expect(receivedSignal?.aborted).toBe(false);

    await act(async () => {
      renderer.update(React.createElement(Harness, {
        isEnabled: false,
        liveSyncIntervalMs: 1_000,
      }));
    });
    expect(receivedSignal?.aborted).toBe(true);
    expect(appStateRemove).not.toHaveBeenCalled();
    expect(latest?.houses).toEqual([]);

    await act(async () => {
      resolveRequest?.([house('interested')]);
      await Promise.resolve();
    });
    expect(latest?.houses).toEqual([]);

    await act(async () => renderer?.unmount());
    renderer = null;
    expect(appStateRemove).toHaveBeenCalledTimes(1);
    await act(async () => jest.advanceTimersByTime(5_000));
    expect(fetchMapHouses).toHaveBeenCalledTimes(1);
  });

  it('does not start a debounced request after the app backgrounds', async () => {
    await act(async () => {
      renderer = TestRenderer.create(React.createElement(Harness));
    });
    await act(async () => appStateListener?.('background'));
    expect(latest?.isReady).toBe(false);
    await act(async () => jest.advanceTimersByTime(1_000));

    expect(fetchMapHouses).not.toHaveBeenCalled();
  });

  it('aborts an in-flight request and ignores its late response when backgrounded', async () => {
    let resolveRequest;
    let receivedSignal;
    fetchMapHouses.mockImplementationOnce((_, __, signal) => {
      receivedSignal = signal;
      return new Promise((resolve) => {
        resolveRequest = resolve;
      });
    });

    await act(async () => {
      renderer = TestRenderer.create(React.createElement(Harness));
    });
    await act(async () => jest.advanceTimersByTime(350));
    expect(receivedSignal?.aborted).toBe(false);

    await act(async () => appStateListener?.('background'));
    expect(receivedSignal?.aborted).toBe(true);

    await act(async () => {
      resolveRequest?.([house('interested')]);
      await Promise.resolve();
    });
    expect(latest?.houses).toEqual([]);
  });
});
