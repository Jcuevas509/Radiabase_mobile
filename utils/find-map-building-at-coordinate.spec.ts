import type { MapBuildingResponse } from 'services/area-api';
import { findMapBuildingAtCoordinate } from './find-map-building-at-coordinate';

function building(
  id: string,
  coordinates: MapBuildingResponse['coordinates'],
): MapBuildingResponse {
  return {
    id,
    coordinates,
    roofLat: coordinates[0].latitude,
    roofLng: coordinates[0].longitude,
    buildingClass: null,
  };
}

const largeRoof = building('large', [
  { latitude: 32, longitude: -97 },
  { latitude: 32, longitude: -96 },
  { latitude: 33, longitude: -96 },
  { latitude: 33, longitude: -97 },
]);

describe('findMapBuildingAtCoordinate', () => {
  it('returns the roof containing the tapped coordinate', () => {
    expect(findMapBuildingAtCoordinate([largeRoof], { latitude: 32.5, longitude: -96.5 })?.id)
      .toBe('large');
  });

  it('treats a roof edge as tappable', () => {
    expect(findMapBuildingAtCoordinate([largeRoof], { latitude: 32, longitude: -96.5 })?.id)
      .toBe('large');
  });

  it('returns null outside every roof', () => {
    expect(findMapBuildingAtCoordinate([largeRoof], { latitude: 34, longitude: -96.5 }))
      .toBeNull();
  });

  it('does not match every tap when a closed ring repeats its first coordinate', () => {
    const closedRoof = building('closed', [
      ...largeRoof.coordinates,
      largeRoof.coordinates[0],
    ]);

    expect(findMapBuildingAtCoordinate([closedRoof], { latitude: 34, longitude: -96.5 }))
      .toBeNull();
  });

  it('prefers the smallest containing roof when polygons overlap', () => {
    const smallRoof = building('small', [
      { latitude: 32.4, longitude: -96.6 },
      { latitude: 32.4, longitude: -96.4 },
      { latitude: 32.6, longitude: -96.4 },
      { latitude: 32.6, longitude: -96.6 },
    ]);

    expect(findMapBuildingAtCoordinate(
      [largeRoof, smallRoof],
      { latitude: 32.5, longitude: -96.5 },
    )?.id).toBe('small');
  });
});
