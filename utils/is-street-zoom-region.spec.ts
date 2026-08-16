import { isStreetZoomRegion } from './is-street-zoom-region';

describe('isStreetZoomRegion', () => {
  it('accepts the field map default zoom', () => {
    expect(isStreetZoomRegion({ latitudeDelta: 0.003 })).toBe(true);
  });

  it('rejects a city-level zoom', () => {
    expect(isStreetZoomRegion({ latitudeDelta: 0.08 })).toBe(false);
  });
});
