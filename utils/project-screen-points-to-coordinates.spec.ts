import {
  projectCoordinateToScreenPoint,
  projectScreenPointToCoordinate,
  projectScreenPointsToCoordinates,
} from './project-screen-points-to-coordinates';

const viewport = {
  region: {
    latitude: 32.834967,
    longitude: -96.563861,
    latitudeDelta: 0.004,
    longitudeDelta: 0.003,
  },
  width: 390,
  height: 844,
};

describe('projectScreenPointToCoordinate', () => {
  it('maps the screen corners onto the region edges', () => {
    const topLeft = projectScreenPointToCoordinate({ x: 0, y: 0 }, viewport);
    const bottomRight = projectScreenPointToCoordinate({ x: 390, y: 844 }, viewport);

    expect(topLeft?.latitude).toBeCloseTo(32.834967 + 0.002, 6);
    expect(topLeft?.longitude).toBeCloseTo(-96.563861 - 0.0015, 6);
    expect(bottomRight?.latitude).toBeCloseTo(32.834967 - 0.002, 6);
    expect(bottomRight?.longitude).toBeCloseTo(-96.563861 + 0.0015, 6);
  });

  it('maps the screen center back onto the region center', () => {
    const actual = projectScreenPointToCoordinate({ x: 195, y: 422 }, viewport);

    expect(actual?.latitude).toBeCloseTo(viewport.region.latitude, 5);
    expect(actual?.longitude).toBeCloseTo(viewport.region.longitude, 6);
  });

  it('returns null for an unusable viewport or touch point', () => {
    expect(projectScreenPointToCoordinate({ x: Number.NaN, y: 10 }, viewport)).toBeNull();
    expect(projectScreenPointToCoordinate({ x: 10, y: 10 }, {
      ...viewport,
      width: 0,
    })).toBeNull();
  });
});

describe('projectCoordinateToScreenPoint', () => {
  it('round-trips a screen point through geography and back', () => {
    const screenPoint = { x: 123, y: 456 };
    const coordinate = projectScreenPointToCoordinate(screenPoint, viewport);
    const actual = projectCoordinateToScreenPoint(coordinate!, viewport);

    expect(actual?.x).toBeCloseTo(screenPoint.x, 4);
    expect(actual?.y).toBeCloseTo(screenPoint.y, 4);
  });

  it('places the region center at the screen center', () => {
    const actual = projectCoordinateToScreenPoint({
      latitude: viewport.region.latitude,
      longitude: viewport.region.longitude,
    }, viewport);

    expect(actual?.x).toBeCloseTo(195, 4);
    expect(actual?.y).toBeCloseTo(422, 0);
  });
});

describe('projectScreenPointsToCoordinates', () => {
  it('projects a stroke while dropping points that cannot convert', () => {
    const actual = projectScreenPointsToCoordinates([
      { x: 0, y: 0 },
      { x: Number.POSITIVE_INFINITY, y: 4 },
      { x: 390, y: 844 },
    ], viewport);

    expect(actual).toHaveLength(2);
  });
});
