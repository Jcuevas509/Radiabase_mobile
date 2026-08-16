import { mapHouseStatusToLeadStatusId, mapLeadStatusIdToHouseStatus } from './map-house-status';

describe('mapHouseStatus', () => {
  it('maps knock buttons to API house statuses', () => {
    expect(mapLeadStatusIdToHouseStatus(1)).toBe('not_interested');
    expect(mapLeadStatusIdToHouseStatus(2)).toBe('not_home');
  });

  it('maps API house statuses back to knock button ids', () => {
    expect(mapHouseStatusToLeadStatusId('not_home')).toBe(2);
    expect(mapHouseStatusToLeadStatusId(null)).toBeUndefined();
  });
});
