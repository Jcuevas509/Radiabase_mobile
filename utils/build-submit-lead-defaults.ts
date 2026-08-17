import { BuildingProps } from 'types/componentsTypes';
import { SubmitLeadFormValues } from 'types/submit-lead.types';
import { formatSubmitLeadPhone } from 'utils/format-submit-lead-phone';
import { parseHouseAddress } from 'utils/parse-house-address';

/**
 * Prefills Submit Lead from the house sheet so the setter does not retype the door.
 */
export function buildSubmitLeadDefaults(
  house: BuildingProps,
  currentOfficeId: number | null,
): SubmitLeadFormValues {
  const address = parseHouseAddress({
    address: house.address,
    city: house.additionalDetails?.city,
    state: house.additionalDetails?.state,
    zip: house.additionalDetails?.zip,
  });
  return {
    firstName: house.assignee?.name ?? '',
    lastName: house.assignee?.lastname ?? '',
    phone: formatSubmitLeadPhone(house.assignee?.phone ?? ''),
    email: house.assignee?.email ?? '',
    addressLine1: address.addressLine1,
    addressLine2: '',
    city: address.city,
    state: address.state,
    zip: address.zip,
    about: house.additionalDetails?.note ?? '',
    isSubmitToOffice: Boolean(currentOfficeId),
    officeId: currentOfficeId,
    appointmentDate: new Date().toISOString(),
    questionnaire: {},
  };
}
