import { convertCoordinatesToGeoJsonPolygon } from './convert-coordinates-to-geojson';

describe('convertCoordinatesToGeoJsonPolygon', () => {
  it('closes an open ring and uses lng/lat order', () => {
    const actualPolygon = convertCoordinatesToGeoJsonPolygon([
      { latitude: 39.1, longitude: -84.1 },
      { latitude: 39.1, longitude: -84.0 },
      { latitude: 39.2, longitude: -84.0 },
    ]);
    expect(actualPolygon.type).toBe('Polygon');
    expect(actualPolygon.coordinates[0]).toEqual([
      [-84.1, 39.1],
      [-84.0, 39.1],
      [-84.0, 39.2],
      [-84.1, 39.1],
    ]);
  });
});
