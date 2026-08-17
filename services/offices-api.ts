import { apiClient } from 'services/api-client';
import { SubmitLeadOffice } from 'types/submit-lead.types';
import { mapUserOffices } from 'utils/map-user-offices';

type UserOfficesResponse = {
  readonly offices?: Parameters<typeof mapUserOffices>[0];
};

/**
 * Loads offices the signed-in setter can submit leads to.
 */
export async function fetchUserOffices(): Promise<SubmitLeadOffice[]> {
  const response = await apiClient.get<UserOfficesResponse>('/offices/user-offices');
  return mapUserOffices(response.data.offices ?? []);
}
