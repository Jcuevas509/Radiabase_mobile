/** Sales org / structure / office management role_ids from the Sunnected API. */
export const MANAGEMENT_ROLE_IDS = [3, 4, 5, 6, 12, 13] as const;

export type ManagementRoleId = (typeof MANAGEMENT_ROLE_IDS)[number];
