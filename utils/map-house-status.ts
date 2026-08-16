export const HOUSE_STATUS_BY_LEAD_ID: Record<number, string> = {
  0: 'interested',
  1: 'not_interested',
  2: 'not_home',
  3: 'interested',
  4: 'custom',
};

export const LEAD_STATUS_BY_LEAD_ID: Record<number, string> = {
  0: 'new',
  1: 'not_interested',
  2: 'unresponsive',
  3: 'follow_up',
  4: 'follow_up',
};

export const LEAD_ID_BY_HOUSE_STATUS: Record<string, number> = {
  interested: 0,
  not_interested: 1,
  not_home: 2,
  custom: 4,
  knocked: 0,
};

/**
 * Maps an app knock button to the house status string the API stores.
 */
export function mapLeadStatusIdToHouseStatus(statusId: number | undefined): string {
  return HOUSE_STATUS_BY_LEAD_ID[statusId ?? 0] ?? 'interested';
}

/**
 * Maps an API house status back to the app knock button id.
 */
export function mapHouseStatusToLeadStatusId(status: string | null | undefined): number | undefined {
  if (!status) {
    return undefined;
  }
  return LEAD_ID_BY_HOUSE_STATUS[status];
}
