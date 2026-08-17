import { SubmitLeadFormValues } from 'types/submit-lead.types';
import { getSubmitLeadFormErrors } from './get-submit-lead-form-errors';

const inputValidValues: SubmitLeadFormValues = {
  firstName: 'Maria',
  lastName: 'Rivera',
  phone: '(555) 123-4567',
  email: 'maria.rivera@example.com',
  addressLine1: '100 Main St',
  addressLine2: '',
  city: 'Fort Lauderdale',
  state: 'FL',
  zip: '33301',
  about: 'Interested',
  isSubmitToOffice: true,
  officeId: 3,
  appointmentDate: null,
  questionnaire: {},
};

describe('getSubmitLeadFormErrors', () => {
  it('returns no errors for a complete Submit Lead form', () => {
    const actualErrors = getSubmitLeadFormErrors(inputValidValues, {
      id: 3,
      name: 'Suntrappers',
      isQuestionnaireEnabled: false,
      questions: [],
    });

    expect(actualErrors).toEqual([]);
  });

  it('requires office questionnaire answers when that office uses one', () => {
    const actualErrors = getSubmitLeadFormErrors(inputValidValues, {
      id: 7,
      name: 'Dallas Dawgs',
      isQuestionnaireEnabled: true,
      questions: [{ id: 1, type: 'text', label: 'Do you own the home?', required: true, options: [] }],
    });

    expect(actualErrors).toContain('Do you own the home? is required');
  });
});
