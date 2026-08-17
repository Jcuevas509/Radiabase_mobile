import { apiClient } from 'services/api-client';
import { SubmitLeadPayload } from 'types/submit-lead.types';
import { pickFieldLeadId } from 'utils/pick-field-lead-id';

export type FieldLeadResponse = {
  readonly id: number;
};

/**
 * Submits a lead the same way the web Submit Lead form does.
 */
export async function createFieldLead(payload: SubmitLeadPayload): Promise<FieldLeadResponse> {
  if (!payload.sales_org_id || !payload.vertical_id) {
    throw new Error('Your user is missing sales org or vertical. Set those in Radiabase first.');
  }
  const formData = new FormData();
  formData.append('data', JSON.stringify(payload));
  const response = await apiClient.post<unknown>('/leads', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return { id: pickFieldLeadId(response.data) };
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
