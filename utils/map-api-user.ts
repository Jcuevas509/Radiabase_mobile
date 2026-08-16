import { MANAGEMENT_ROLE_IDS } from 'constants/management-role-ids';
import { ApiMeResponse } from 'types/auth-api.types';
import { User } from 'types/storageTypes';

/**
 * Maps GET /auth/me into the app session user.
 */
export function mapApiUserToSessionUser(input: ApiMeResponse): User {
  const hasManagementRole = (input.roles ?? []).some((role) => {
    return MANAGEMENT_ROLE_IDS.some((roleId) => roleId === role.role_id);
  });
  const details = input.sales_org_user_details;
  const officeId = details?.current_office?.id ?? details?.offices?.[0]?.id ?? null;
  const verticalId = input.primary_vertical?.id ?? input.allowed_verticals?.[0]?.id ?? null;
  return {
    id: String(input.id),
    firstName: input.first_name ?? '',
    lastName: input.last_name ?? '',
    email: input.email,
    role: hasManagementRole ? 'manager' : 'agent',
    roleLabel: details?.sales_role ?? (hasManagementRole ? 'Manager' : 'Setter'),
    salesOrgId: details?.sales_org_id ?? input.tenet_id ?? null,
    officeId,
    officeName: details?.current_office?.name ?? details?.offices?.[0]?.name ?? null,
    structureName: details?.current_structure?.name ?? details?.structure?.name ?? null,
    verticalId,
  };
}
