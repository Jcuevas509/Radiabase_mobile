import {
  buildCircleCoordinates,
  getCoordinateDistanceMeters,
} from './build-circle-coordinates';

describe('buildCircleCoordinates', () => {
  const center = { latitude: 40.7128, longitude: -74.006 };

  it('builds a smooth geodesic circle at the dragged radius', () => {
    const edge = { latitude: 40.7137, longitude: -74.006 };
    const coordinates = buildCircleCoordinates(center, edge);
    const expectedRadius = getCoordinateDistanceMeters(center, edge);

    expect(coordinates).toHaveLength(40);
    coordinates.forEach((coordinate) => {
      expect(getCoordinateDistanceMeters(center, coordinate)).toBeCloseTo(expectedRadius, 3);
    });
  });

  it('ignores taps and tiny accidental drags', () => {
    expect(buildCircleCoordinates(center, center)).toEqual([]);
    expect(buildCircleCoordinates(center, {
      latitude: center.latitude + 0.00001,
      longitude: center.longitude,
    })).toEqual([]);
  });

  it('bounds vertex count to keep native polygon updates lightweight', () => {
    const edge = { latitude: 40.7137, longitude: -74.006 };

    expect(buildCircleCoordinates(center, edge, 3)).toHaveLength(12);
    expect(buildCircleCoordinates(center, edge, 500)).toHaveLength(64);
  });
});
