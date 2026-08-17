import { mapUserOffices } from './map-user-offices';

describe('mapUserOffices', () => {
  it('maps questionnaire questions from the offices API', () => {
    const actualOffices = mapUserOffices([
      {
        id: 7,
        name: 'Dallas Dawgs',
        is_questionnaire_enabled: true,
        office_questionnaire: {
          questions: [
            {
              id: 1,
              type: 'singleSelect',
              label: 'Do you own the home?',
              required: true,
              options: [{ label: 'No', value: 'no' }],
            },
          ],
        },
      },
    ]);

    expect(actualOffices[0].questions[0].label).toBe('Do you own the home?');
  });
});
