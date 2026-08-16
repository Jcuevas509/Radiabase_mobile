import { MapAreaResponse } from 'services/area-api';

const DEFAULT_PREVIEW_LIMIT = 4;

/**
 * Picks a short list of areas for the dashboard tiles. Assigned turfs first.
 */
export function pickDashboardPreviewAreas(
  areas: MapAreaResponse[],
  limit: number = DEFAULT_PREVIEW_LIMIT,
): MapAreaResponse[] {
  const assignedAreas = areas.filter((area) => area.assignee !== null);
  const source = assignedAreas.length > 0 ? assignedAreas : areas;
  return source.slice(0, limit);
}
