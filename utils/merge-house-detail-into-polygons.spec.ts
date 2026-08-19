import type { MapHouseDetailResponse } from 'services/area-api';
import {
  mergeHouseDetailIntoPolygons,
  type PolygonWithHouses,
} from './merge-house-detail-into-polygons';

const detail = (leadId: number | null): MapHouseDetailResponse => ({
  id: 9,
  areaId: 3,
  latitude: 40,
  longitude: -74,
  address: '9 Main St',
  city: 'Town',
  state: 'NY',
  zip: '10001',
  currentStatus: 'not_home',
  notes: null,
  leadId,
  lead: null,
  knockHistory: [{ status: 'not_home', notes: null, createdAt: null, repId: 2 }],
});

describe('mergeHouseDetailIntoPolygons', () => {
  it('adds a newly created house to its area snapshot', () => {
    const polygons: PolygonWithHouses[] = [
      { id: 3, assignee: null, buildingMarkers: [] },
    ];
    const actual = mergeHouseDetailIntoPolygons(polygons, detail(null), 'overture-9');
    expect(actual[0].buildingMarkers).toHaveLength(1);
    expect(actual[0].buildingMarkers[0].additionalDetails?.externalId).toBe('overture-9');
  });

  it('replaces an existing house with refreshed lead linkage', () => {
    const polygons: PolygonWithHouses[] = [
      {
        id: 3,
        assignee: null,
        buildingMarkers: [{ id: 9, latitude: 40, longitude: -74, subtitle: 'not_home' }],
      },
    ];
    const actual = mergeHouseDetailIntoPolygons(polygons, detail(77));
    expect(actual[0].buildingMarkers).toHaveLength(1);
    expect(actual[0].buildingMarkers[0].additionalDetails?.leadId).toBe(77);
  });

  it('does not alter an area when the house is outside turf', () => {
    const polygons: PolygonWithHouses[] = [
      { id: 3, assignee: null, buildingMarkers: [] },
    ];
    expect(mergeHouseDetailIntoPolygons(polygons, { ...detail(null), areaId: null })).toEqual([
      { id: 3, assignee: null, buildingMarkers: [] },
    ]);
  });
});
