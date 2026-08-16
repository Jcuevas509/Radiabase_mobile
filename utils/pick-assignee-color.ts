const ASSIGNEE_COLORS = ['#FF5733', '#33A852', '#3357FF', '#FFC300', '#A300FF', '#32A0FF'] as const;

/**
 * Picks a stable color for an assignee id so map polygons stay visually distinct.
 */
export function pickAssigneeColor(userId: number): string {
  return ASSIGNEE_COLORS[Math.abs(userId) % ASSIGNEE_COLORS.length];
}
