import { isCloseZoomRegion } from './is-close-zoom-region';

describe('isCloseZoomRegion', () => {
  it('allows footprint squares only when tighter than the close-zoom cap', () => {
    expect(isCloseZoomRegion({ latitudeDelta: 0.002 })).toBe(true);
    expect(isCloseZoomRegion({ latitudeDelta: 0.0035 })).toBe(true);
    expect(isCloseZoomRegion({ latitudeDelta: 0.005 })).toBe(false);
  });

  it('rejects a degenerate region', () => {
    expect(isCloseZoomRegion({ latitudeDelta: 0 })).toBe(false);
    expect(isCloseZoomRegion({ latitudeDelta: -1 })).toBe(false);
  });
});
