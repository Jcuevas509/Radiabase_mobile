import { convertMapAreasToPolygons } from './convert-map-areas-to-polygons';

describe('convertMapAreasToPolygons', () => {
  it('maps assignee, coordinates, and house knock status onto polygons', () => {
    const actualPolygons = convertMapAreasToPolygons(
      [
        {
          id: 10,
          name: 'North',
          officeId: 2,
          salesOrgId: 1,
          coordinates: [
            { latitude: 39.1, longitude: -84.1 },
            { latitude: 39.2, longitude: -84.0 },
          ],
          assignee: {
            id: 7,
            firstName: 'Jane',
            lastName: 'Rep',
            email: 'jane@example.com',
            officeName: 'Austin',
            salesRole: 'setter',
          },
        },
      ],
      [
        {
          id: 55,
          areaId: 10,
          latitude: 39.15,
          longitude: -84.05,
          address: '123 Main',
          city: 'Cincinnati',
          state: 'OH',
          zip: '45202',
          currentStatus: 'not_home',
          notes: null,
          leadId: 99,
        },
      ],
    );
    expect(actualPolygons).toHaveLength(1);
    expect(actualPolygons[0].id).toBe(10);
    expect(actualPolygons[0].assignee?.name).toBe('Jane');
    expect(actualPolygons[0].assignee?.officeName).toBe('Austin');
    expect(actualPolygons[0].buildingMarkers[0].statusId).toBe(2);
    expect(actualPolygons[0].buildingMarkers[0].address).toBe('123 Main');
    expect(actualPolygons[0].buildingMarkers[0].additionalDetails?.leadId).toBe(99);
  });
});
