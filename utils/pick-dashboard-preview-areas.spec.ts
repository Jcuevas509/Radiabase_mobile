import { pickDashboardPreviewAreas } from './pick-dashboard-preview-areas';
import { MapAreaResponse } from 'services/area-api';

function buildArea(id: number, hasAssignee: boolean): MapAreaResponse {
  return {
    id,
    name: `Area ${id}`,
    officeId: 1,
    salesOrgId: 1,
    coordinates: [{ latitude: 39, longitude: -84 }],
    assignee: hasAssignee
      ? { id: id, firstName: 'Pat', lastName: 'Lead' }
      : null,
    houses: [],
  };
}

describe('pickDashboardPreviewAreas', () => {
  it('prefers assigned areas and caps the list', () => {
    const inputAreas = [buildArea(1, false), buildArea(2, true), buildArea(3, true)];
    const actualAreas = pickDashboardPreviewAreas(inputAreas, 2);
    expect(actualAreas.map((area) => area.id)).toEqual([2, 3]);
  });

  it('falls back to unassigned areas when none are assigned', () => {
    const inputAreas = [buildArea(1, false), buildArea(2, false)];
    const actualAreas = pickDashboardPreviewAreas(inputAreas, 2);
    expect(actualAreas.map((area) => area.id)).toEqual([1, 2]);
  });
});
