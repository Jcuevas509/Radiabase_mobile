import { SubmitLeadFormValues } from 'types/submit-lead.types';
import { buildOfficeQuestionnaire } from './build-office-questionnaire';

const inputValues: SubmitLeadFormValues = {
  firstName: 'Maria',
  lastName: 'Rivera',
  phone: '(555) 123-4567',
  email: 'maria@example.com',
  addressLine1: '100 Main St',
  addressLine2: '',
  city: 'Dallas',
  state: 'TX',
  zip: '75201',
  about: '',
  isSubmitToOffice: true,
  officeId: 7,
  appointmentDate: null,
  questionnaire: { '1': 'no' },
};

describe('buildOfficeQuestionnaire', () => {
  it('returns the web office_questionnaire shape', () => {
    const actualQuestionnaire = buildOfficeQuestionnaire({
      values: inputValues,
      timestamp: '2026-08-16T00:00:00.000Z',
      selectedOffice: {
        id: 7,
        name: 'Dallas Dawgs',
        isQuestionnaireEnabled: true,
        questions: [{ id: 1, type: 'singleSelect', label: 'Do you own the home?', required: true, options: [] }],
      },
    });

    expect(actualQuestionnaire?.responses[0].answer).toBe('no');
  });
});
