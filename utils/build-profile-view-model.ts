import type { User } from 'types/storageTypes';

export type ProfileDetailRow = {
  readonly label: string;
  readonly value: string;
};

export type ProfileViewModel = {
  readonly firstName: string;
  readonly lastName: string;
  readonly fullName: string;
  readonly email: string;
  readonly roleLabel: string;
  readonly isManager: boolean;
  readonly detailRows: ProfileDetailRow[];
};

/**
 * Maps the session user onto everything the Profile screen displays. This is
 * the seam for a richer profile later: point it at a real profile API
 * response and the screen needs no changes. Rows with no value are dropped
 * so the screen never renders empty fields.
 */
export function buildProfileViewModel(user: User | null | undefined): ProfileViewModel | null {
  if (!user) {
    return null;
  }
  const firstName = (user.firstName ?? '').trim();
  const lastName = (user.lastName ?? '').trim();
  const fullName = `${firstName} ${lastName}`.trim() || 'Field Rep';
  const isManager = user.role === 'manager';
  const roleLabel = (user.roleLabel ?? '').trim() || (isManager ? 'Manager' : 'Setter');
  const officeName = (user.officeName ?? '').trim();
  const structureName = (user.structureName ?? '').trim();
  const detailRows: ProfileDetailRow[] = [
    { label: 'Office', value: officeName },
    { label: 'Team', value: structureName !== officeName ? structureName : '' },
    { label: 'Role', value: roleLabel },
  ].filter((row) => row.value.length > 0);
  return {
    firstName,
    lastName,
    fullName,
    email: (user.email ?? '').trim(),
    roleLabel,
    isManager,
    detailRows,
  };
}
