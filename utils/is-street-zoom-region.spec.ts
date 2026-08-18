import { isStreetZoomRegion } from './is-street-zoom-region';

describe('isStreetZoomRegion', () => {
  it('accepts the field map default zoom', () => {
    expect(isStreetZoomRegion({ latitudeDelta: 0.003 })).toBe(true);
  });

  it('hides house details at a wider neighborhood zoom', () => {
    expect(isStreetZoomRegion({ latitudeDelta: 0.008 })).toBe(false);
  });

  it('includes the close-zoom boundary', () => {
    expect(isStreetZoomRegion({ latitudeDelta: 0.006 })).toBe(true);
  });

  it('rejects a region immediately outside the close-zoom boundary', () => {
    expect(isStreetZoomRegion({ latitudeDelta: 0.006001 })).toBe(false);
  });

  it('rejects a city-level zoom', () => {
    expect(isStreetZoomRegion({ latitudeDelta: 0.08 })).toBe(false);
  });
});
