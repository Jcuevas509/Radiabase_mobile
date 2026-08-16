import { apiClient } from 'services/api-client';
import { User } from 'types/storageTypes';
import { LEAD_STATUS_BY_LEAD_ID } from 'utils/map-house-status';

type CreateFieldLeadInput = {
  readonly user: User;
  readonly houseId?: number;
  readonly firstName: string;
  readonly lastName: string;
  readonly phone?: string;
  readonly email?: string;
  readonly notes?: string;
  readonly address?: string | null;
  readonly city?: string | null;
  readonly state?: string | null;
  readonly zip?: string | null;
  readonly latitude: number;
  readonly longitude: number;
  readonly statusId?: number;
};

/**
 * Submits a canvassing lead to Sunnected with GPS and the logged-in setter.
 */
export async function createFieldLead(input: CreateFieldLeadInput): Promise<unknown> {
  if (!input.user.salesOrgId || !input.user.verticalId) {
    throw new Error('Your user is missing sales org or vertical. Set those in Radiabase first.');
  }
  const firstName = input.firstName.trim().length >= 2 ? input.firstName.trim() : 'Resident';
  const lastName = input.lastName.trim().length >= 2 ? input.lastName.trim() : 'Unknown';
  const payload = {
    first_name: firstName,
    last_name: lastName,
    phone_number: input.phone || undefined,
    email: input.email || undefined,
    notes: input.notes || undefined,
    address_line1: input.address?.trim() || 'Unknown address',
    city: input.city?.trim() || 'Unknown',
    state: input.state?.trim() || 'NA',
    zip_code: input.zip?.trim() || '00000',
    sales_org_id: input.user.salesOrgId,
    office_id: input.user.officeId || undefined,
    vertical_id: input.user.verticalId,
    setter_id: Number(input.user.id),
    creation_method: 'sales_rep_submit',
    lead_status: LEAD_STATUS_BY_LEAD_ID[input.statusId ?? 0] ?? 'new',
    location: { lat: input.latitude, lng: input.longitude },
    ...(input.houseId ? { house_id: input.houseId } : {}),
  };
  const formData = new FormData();
  formData.append('data', JSON.stringify(payload));
  const response = await apiClient.post('/leads', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return response.data;
}

/**
 * Updates homeowner contact fields on an existing canvassing lead.
 */
export async function updateFieldLeadInfo(input: {
  readonly leadId: number;
  readonly firstName?: string;
  readonly lastName?: string;
  readonly phone?: string;
  readonly email?: string;
}): Promise<void> {
  const payload: {
    first_name?: string;
    last_name?: string;
    phone_number?: string;
    email?: string;
  } = {};
  if (input.firstName?.trim()) {
    payload.first_name = input.firstName.trim();
  }
  if (input.lastName?.trim()) {
    payload.last_name = input.lastName.trim();
  }
  const phoneDigits = (input.phone ?? '').replace(/\D/g, '');
  if (phoneDigits.length === 10) {
    payload.phone_number = phoneDigits;
  }
  if (input.email && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(input.email.trim())) {
    payload.email = input.email.trim();
  }
  if (Object.keys(payload).length === 0) {
    return;
  }
  await apiClient.patch(`/leads/${input.leadId}/info`, payload);
}
