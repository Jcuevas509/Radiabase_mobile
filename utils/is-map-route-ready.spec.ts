import { isMapRouteReady } from './is-map-route-ready';

describe('isMapRouteReady', () => {
  const ready = {
    housesReady: true,
    buildingsReady: true,
    buildingsFailed: false,
    locationReady: true,
  };

  it('waits when houses resolve before the current roof query', () => {
    expect(isMapRouteReady({ ...ready, buildingsReady: false })).toBe(false);
  });

  it('allows authoritative saved-door fallback after the roof query fails', () => {
    expect(isMapRouteReady({
      ...ready,
      buildingsReady: false,
      buildingsFailed: true,
    })).toBe(true);
  });

  it('also requires current house data and a fresh foreground location', () => {
    expect(isMapRouteReady({ ...ready, housesReady: false })).toBe(false);
    expect(isMapRouteReady({ ...ready, locationReady: false })).toBe(false);
  });
});
