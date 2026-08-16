import { convertMapHouseDetailToHouse } from './convert-map-house-detail-to-house';
import { MapHouseDetailResponse } from 'services/area-api';

describe('convertMapHouseDetailToHouse', () => {
  it('maps a roam house sheet onto a field-map marker row', () => {
    const inputDetail: MapHouseDetailResponse = {
      id: 8,
      areaId: null,
      latitude: 39.15,
      longitude: -84.05,
      address: 'Unknown Address',
      city: null,
      state: null,
      zip: null,
      currentStatus: null,
      notes: null,
      leadId: null,
      lead: null,
      knockHistory: [],
    };
    const actualHouse = convertMapHouseDetailToHouse(inputDetail, 'gers-1');
    expect(actualHouse.id).toBe(8);
    expect(actualHouse.areaId).toBeNull();
    expect(actualHouse.externalId).toBe('gers-1');
    expect(actualHouse.source).toBe('overture');
  });
});
