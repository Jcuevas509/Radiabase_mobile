import type { MapBuildingResponse, MapHouseResponse } from 'services/area-api';
import { rankUnworkedDoorTargets } from './rank-unworked-door-targets';

const origin = { latitude: 40, longitude: -74 };
const viewportRegion = {
  ...origin,
  latitudeDelta: 0.01,
  longitudeDelta: 0.01,
};
const building = (id: string, latitude: number): MapBuildingResponse => ({
  id,
  coordinates: [],
  roofLat: latitude,
  roofLng: -74,
  buildingClass: 'residential',
});
const house = (
  id: number,
  latitude: number,
  currentStatus: string | null,
  externalId: string | null = null,
): MapHouseResponse => ({
  id,
  areaId: 1,
  latitude,
  longitude: -74,
  address: `${id} Main St`,
  city: 'Town',
  state: 'NY',
  zip: '10001',
  currentStatus,
  notes: null,
  leadId: null,
  externalId,
});

describe('rankUnworkedDoorTargets', () => {
  it('ranks the nearest untouched roof first', () => {
    const targets = rankUnworkedDoorTargets(origin, [
      building('far', 40.003),
      building('near', 40.001),
    ], [], viewportRegion);

    expect(targets.map((target) => target.buildingId)).toEqual(['near', 'far']);
    expect(targets[0].distanceMeters).toBeGreaterThan(100);
    expect(targets[0].distanceMeters).toBeLessThan(120);
  });

  it('excludes worked roofs and does not duplicate their matching saved house', () => {
    const targets = rankUnworkedDoorTargets(
      origin,
      [building('worked', 40.001), building('untouched', 40.002)],
      [house(1, 40.001, 'not_home', 'worked'), house(2, 40.002, null, 'untouched')],
      viewportRegion,
    );

    expect(targets).toHaveLength(1);
    expect(targets[0]).toMatchObject({ buildingId: 'untouched', houseId: 2 });
  });

  it('uses an unworked saved door when its footprint is unavailable', () => {
    const targets = rankUnworkedDoorTargets(origin, [], [house(3, 40.001, null)], viewportRegion);

    expect(targets).toHaveLength(1);
    expect(targets[0]).toMatchObject({ houseId: 3, address: '3 Main St' });
  });

  it('rejects an invalid current location', () => {
    expect(rankUnworkedDoorTargets(
      { latitude: Number.NaN, longitude: -74 },
      [building('roof', 40.001)],
      [],
      viewportRegion,
    )).toEqual([]);
  });

  it('ignores stale doors outside the current viewport', () => {
    const targets = rankUnworkedDoorTargets(
      origin,
      [building('visible', 40.001), building('stale', 40.02)],
      [house(4, 40.02, null)],
      viewportRegion,
    );

    expect(targets.map((target) => target.buildingId)).toEqual(['visible']);
  });
});
