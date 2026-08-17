import { User } from 'types/storageTypes';
import { SubmitLeadFormValues } from 'types/submit-lead.types';
import { buildSubmitLeadPayload } from './build-submit-lead-payload';

const inputUser: User = {
  id: '79',
  firstName: 'Jose',
  lastName: 'Cuevas',
  email: 'jose@suntappedenergy.com',
  role: 'manager',
  roleLabel: 'Manager',
  salesOrgId: 1,
  officeId: 3,
  officeName: 'Suntrappers',
  structureName: null,
  verticalId: 1,
};

const inputValues: SubmitLeadFormValues = {
  firstName: 'Maria',
  lastName: 'Rivera',
  phone: '(555) 123-4567',
  email: 'maria.rivera@example.com',
  addressLine1: '100 Main St',
  addressLine2: '',
  city: 'Fort Lauderdale',
  state: 'FL',
  zip: '33301',
  about: 'Door knock',
  isSubmitToOffice: true,
  officeId: 3,
  appointmentDate: '2026-08-17T12:00:00.000Z',
  questionnaire: {},
};

describe('buildSubmitLeadPayload', () => {
  it('matches the web Submit Lead payload and adds house_id', () => {
    const actualPayload = buildSubmitLeadPayload({
      user: inputUser,
      values: inputValues,
      selectedOffice: { id: 3, name: 'Suntrappers', isQuestionnaireEnabled: false, questions: [] },
      latitude: 26.12,
      longitude: -80.13,
      houseId: 21,
    });

    expect(actualPayload).toMatchObject({
      first_name: 'Maria',
      phone_number: '5551234567',
      office_id: 3,
      is_internal: false,
      creation_method: 'sales_rep_submit',
      house_id: 21,
    });
  });
});
