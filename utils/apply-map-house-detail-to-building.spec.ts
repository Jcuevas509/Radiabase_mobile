import { applyMapHouseDetailToBuilding } from './apply-map-house-detail-to-building';
import { MapHouseDetailResponse } from 'services/area-api';
import { BuildingProps } from 'types/componentsTypes';

describe('applyMapHouseDetailToBuilding', () => {
  it('copies lead contact fields and knock history onto the marker', () => {
    const inputBuilding: BuildingProps = {
      id: 55,
      latitude: 39.15,
      longitude: -84.05,
      address: '123 Main',
    };
    const inputDetail: MapHouseDetailResponse = {
      id: 55,
      areaId: 10,
      latitude: 39.15,
      longitude: -84.05,
      address: '123 Main',
      city: 'Cincinnati',
      state: 'OH',
      zip: '45202',
      currentStatus: 'not_home',
      notes: 'Left hanger',
      leadId: 99,
      lead: {
        id: 99,
        firstName: 'Pat',
        lastName: 'Rivera',
        phone: '5551112222',
        email: 'pat@example.com',
        status: 'new',
      },
      knockHistory: [
        { status: 'not_home', notes: 'Left hanger', createdAt: '2026-08-16T12:00:00.000Z', repId: 7 },
      ],
    };
    const actualBuilding = applyMapHouseDetailToBuilding(inputBuilding, inputDetail);
    expect(actualBuilding.assignee?.name).toBe('Pat');
    expect(actualBuilding.assignee?.phone).toBe('5551112222');
    expect(actualBuilding.additionalDetails?.leadId).toBe(99);
    expect(actualBuilding.additionalDetails?.note).toBe('Left hanger');
    expect(actualBuilding.statuses).toEqual([2]);
  });
});
