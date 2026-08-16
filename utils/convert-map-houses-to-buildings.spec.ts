import { convertMapHousesToBuildings } from './convert-map-houses-to-buildings';

describe('convertMapHousesToBuildings', () => {
  it('maps roam houses onto marker props', () => {
    const actualBuildings = convertMapHousesToBuildings([
      {
        id: 8,
        areaId: null,
        latitude: 39.15,
        longitude: -84.05,
        address: 'Unknown Address',
        city: null,
        state: null,
        zip: null,
        currentStatus: 'not_home',
        notes: null,
        leadId: null,
        externalId: 'gers-1',
        source: 'overture',
      },
    ]);
    expect(actualBuildings[0].id).toBe(8);
    expect(actualBuildings[0].statusId).toBe(2);
    expect(actualBuildings[0].additionalDetails?.externalId).toBe('gers-1');
  });
});
