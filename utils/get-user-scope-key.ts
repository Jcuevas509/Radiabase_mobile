export function getUserScopeKey(user: {
  readonly id: string;
  readonly salesOrgId: number | null;
  readonly officeId: number | null;
  readonly verticalId: number | null;
} | null | undefined): string | null {
  if (!user) {
    return null;
  }
  const userId = Number(user.id);
  if (!Number.isInteger(userId) || userId <= 0) {
    return null;
  }
  return `${userId}:${user.salesOrgId ?? ''}:${user.officeId ?? ''}:${user.verticalId ?? ''}`;
}
