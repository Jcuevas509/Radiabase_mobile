import { selectMapOverlayItems, simplifyOverlayRing } from './select-map-overlay-items';

const region = {
  latitude: 40,
  longitude: -74,
  latitudeDelta: 0.01,
  longitudeDelta: 0.01,
};

describe('selectMapOverlayItems', () => {
  it('keeps visible and near-edge houses while removing distant houses', () => {
    const houses = [
      { id: 1, latitude: 40, longitude: -74, address: 'Visible' },
      { id: 2, latitude: 40.007, longitude: -74, address: 'Padded edge' },
      { id: 3, latitude: 41, longitude: -74, address: 'Distant' },
    ];
    expect(selectMapOverlayItems(region, houses, []).houses.map((house) => house.id))
      .toEqual([1, 2]);
  });

  it('keeps an area whose bounds overlap the viewport and removes distant areas', () => {
    const areas = [
      { id: 1, coordinates: [
        { latitude: 39.99, longitude: -74.001 },
        { latitude: 40.01, longitude: -74.001 },
        { latitude: 40.01, longitude: -73.999 },
      ] },
      { id: 2, coordinates: [
        { latitude: 41, longitude: -75 },
        { latitude: 41.01, longitude: -75 },
        { latitude: 41.01, longitude: -74.99 },
      ] },
    ];
    expect(selectMapOverlayItems(region, [], areas).areas.map((area) => area.id))
      .toEqual([1]);
  });
});

describe('simplifyOverlayRing', () => {
  it('caps projection work for highly detailed rings', () => {
    const coordinates = Array.from({ length: 500 }, (_, index) => ({
      latitude: 40 + index / 100000,
      longitude: -74,
    }));
    expect(simplifyOverlayRing(coordinates)).toHaveLength(128);
  });
});
