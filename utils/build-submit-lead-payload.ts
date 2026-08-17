import { User } from 'types/storageTypes';
import { SubmitLeadFormValues, SubmitLeadOffice, SubmitLeadPayload } from 'types/submit-lead.types';
import { buildOfficeQuestionnaire } from 'utils/build-office-questionnaire';
import { toSubmitLeadPhoneDigits } from 'utils/format-submit-lead-phone';

type BuildSubmitLeadPayloadInput = {
  readonly user: User;
  readonly values: SubmitLeadFormValues;
  readonly selectedOffice: SubmitLeadOffice | null;
  readonly latitude: number;
  readonly longitude: number;
  readonly houseId?: number;
};

/**
 * Builds the same POST /leads body the web Submit Lead form sends, plus house_id.
 */
export function buildSubmitLeadPayload(input: BuildSubmitLeadPayloadInput): SubmitLeadPayload {
  const officeId = input.values.isSubmitToOffice ? input.values.officeId : null;
  const questionnaire = buildOfficeQuestionnaire({
    values: input.values,
    selectedOffice: input.selectedOffice,
  });
  return {
    first_name: input.values.firstName.trim(),
    last_name: input.values.lastName.trim(),
    email: input.values.email.trim(),
    phone_number: toSubmitLeadPhoneDigits(input.values.phone),
    address_line1: input.values.addressLine1.trim(),
    address_line2: input.values.addressLine2.trim(),
    city: input.values.city.trim(),
    state: input.values.state.trim(),
    zip_code: input.values.zip.trim(),
    setter_id: Number(input.user.id),
    sales_org_id: input.user.salesOrgId ?? 0,
    vertical_id: input.user.verticalId ?? 0,
    is_internal: !officeId,
    creation_method: 'sales_rep_submit',
    location: { lat: input.latitude, lng: input.longitude },
    ...(officeId ? { office_id: officeId } : {}),
    ...(input.values.appointmentDate ? { appt_date: input.values.appointmentDate } : {}),
    ...(input.values.about.trim() ? { notes: input.values.about.trim() } : {}),
    ...(input.houseId ? { house_id: input.houseId } : {}),
    ...(questionnaire ? { office_questionnaire: questionnaire } : {}),
  };
}
