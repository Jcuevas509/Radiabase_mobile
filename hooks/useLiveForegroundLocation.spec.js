const React = require('react');
const { AppState } = require('react-native');
const TestRenderer = require('react-test-renderer');
const { act } = TestRenderer;
const Location = require('expo-location');
const { useAppIsActive } = require('./useAppIsActive');
const {
  LIVE_LOCATION_OPTIONS,
  useLiveForegroundLocation,
} = require('./useLiveForegroundLocation');

jest.mock('expo-location', () => ({
  Accuracy: { Balanced: 3 },
  watchPositionAsync: jest.fn(),
}));

function Harness({ onCoordinate }) {
  const isAppActive = useAppIsActive();
  latestIsLocationReady = useLiveForegroundLocation({ isEnabled: isAppActive, onCoordinate });
  return null;
}

let latestIsLocationReady = false;

describe('useLiveForegroundLocation', () => {
  let appStateListener = null;
  let appStateRemove;
  let appStateSpy;
  let renderer = null;

  beforeEach(() => {
    Location.watchPositionAsync.mockReset();
    latestIsLocationReady = false;
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
  });

  it('closes pending and active watches across background transitions', async () => {
    let resolveFirstWatch;
    const firstRemove = jest.fn();
    const secondRemove = jest.fn();
    const callbacks = [];
    const onCoordinate = jest.fn();

    Location.watchPositionAsync
      .mockImplementationOnce((options, callback) => {
        callbacks.push(callback);
        expect(options).toEqual(LIVE_LOCATION_OPTIONS);
        return new Promise((resolve) => {
          resolveFirstWatch = resolve;
        });
      })
      .mockImplementationOnce((options, callback) => {
        callbacks.push(callback);
        expect(options).toEqual(LIVE_LOCATION_OPTIONS);
        return Promise.resolve({ remove: secondRemove });
      });

    await act(async () => {
      renderer = TestRenderer.create(React.createElement(Harness, { onCoordinate }));
    });
    expect(Location.watchPositionAsync).toHaveBeenCalledTimes(1);
    expect(latestIsLocationReady).toBe(false);

    await act(async () => appStateListener?.('background'));
    await act(async () => {
      resolveFirstWatch?.({ remove: firstRemove });
      await Promise.resolve();
    });
    expect(firstRemove).toHaveBeenCalledTimes(1);

    await act(async () => {
      appStateListener?.('active');
      await Promise.resolve();
    });
    expect(Location.watchPositionAsync).toHaveBeenCalledTimes(2);
    expect(latestIsLocationReady).toBe(false);
    await act(async () => callbacks[1]({ coords: { latitude: 40, longitude: -74 } }));
    expect(latestIsLocationReady).toBe(true);
    expect(onCoordinate).toHaveBeenLastCalledWith({ latitude: 40, longitude: -74 });

    await act(async () => appStateListener?.('background'));
    expect(latestIsLocationReady).toBe(false);
    expect(secondRemove).toHaveBeenCalledTimes(1);
    callbacks[1]({ coords: { latitude: 41, longitude: -73 } });
    expect(onCoordinate).toHaveBeenCalledTimes(1);

    await act(async () => renderer?.unmount());
    renderer = null;
    expect(appStateRemove).toHaveBeenCalledTimes(1);
  });
});
