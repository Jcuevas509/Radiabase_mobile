import { leadStatuses } from 'constants/leadStatuses';
import { mapHouseStatusToLeadStatusId } from 'utils/map-house-status';

const DEFAULT_STROKE = '#F5F0E6';
const DEFAULT_FILL = 'rgba(255, 255, 255, 0.22)';

/**
 * Colors an Overture footprint from the matching house knock status.
 */
export function pickFootprintColors(status: string | null | undefined): {
  strokeColor: string;
  fillColor: string;
} {
  const statusId = mapHouseStatusToLeadStatusId(status);
  const leadStatus = leadStatuses.find((item) => item.statusId === statusId);
  if (!leadStatus) {
    return { strokeColor: DEFAULT_STROKE, fillColor: DEFAULT_FILL };
  }
  return {
    strokeColor: leadStatus.color,
    fillColor: hexToFill(leadStatus.color),
  };
}

function hexToFill(hex: string): string {
  const normalized = hex.replace('#', '');
  if (normalized.length !== 6) {
    return DEFAULT_FILL;
  }
  const red = parseInt(normalized.slice(0, 2), 16);
  const green = parseInt(normalized.slice(2, 4), 16);
  const blue = parseInt(normalized.slice(4, 6), 16);
  return `rgba(${red}, ${green}, ${blue}, 0.45)`;
}
