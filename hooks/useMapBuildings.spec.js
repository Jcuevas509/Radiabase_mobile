const React = require('react');
const TestRenderer = require('react-test-renderer');
const { act } = TestRenderer;
const { fetchMapBuildings } = require('services/area-api');
const { useMapBuildings } = require('./useMapBuildings');

jest.mock('services/area-api', () => ({
  fetchMapBuildings: jest.fn(),
}));

const firstRegion = {
  latitude: 40,
  longitude: -74,
  latitudeDelta: 0.003,
  longitudeDelta: 0.003,
};
const secondRegion = { ...firstRegion, latitude: 41 };
const firstBuilding = {
  id: 'first-roof',
  coordinates: [],
  roofLat: 40,
  roofLng: -74,
  buildingClass: 'residential',
};

let latest = null;

function Harness({ region }) {
  latest = useMapBuildings({ region, isEnabled: true });
  return null;
}

describe('useMapBuildings query readiness', () => {
  let renderer = null;

  beforeEach(() => {
    jest.useFakeTimers();
    latest = null;
    fetchMapBuildings.mockReset();
    globalThis.IS_REACT_ACT_ENVIRONMENT = true;
  });

  afterEach(async () => {
    if (renderer) {
      await act(async () => renderer?.unmount());
    }
    renderer = null;
    jest.useRealTimers();
  });

  it('invalidates synchronously on pan and distinguishes pending from failed', async () => {
    fetchMapBuildings
      .mockResolvedValueOnce([firstBuilding])
      .mockRejectedValueOnce(new Error('footprints unavailable'));

    await act(async () => {
      renderer = TestRenderer.create(React.createElement(Harness, { region: firstRegion }));
    });
    expect(latest?.isReady).toBe(false);
    await act(async () => {
      jest.advanceTimersByTime(350);
      await Promise.resolve();
    });
    expect(latest?.isReady).toBe(true);
    expect(latest?.buildings).toEqual([firstBuilding]);

    await act(async () => {
      renderer.update(React.createElement(Harness, { region: secondRegion }));
    });
    expect(latest?.isReady).toBe(false);
    expect(latest?.hasError).toBe(false);
    expect(latest?.buildings).toEqual([firstBuilding]);

    await act(async () => {
      jest.advanceTimersByTime(350);
      await Promise.resolve();
    });
    expect(latest?.isReady).toBe(false);
    expect(latest?.hasError).toBe(true);
    expect(latest?.buildings).toEqual([]);
  });
});
