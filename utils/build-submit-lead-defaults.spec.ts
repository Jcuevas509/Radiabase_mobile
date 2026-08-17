import { BuildingProps } from 'types/componentsTypes';
import { buildSubmitLeadDefaults } from './build-submit-lead-defaults';

const inputHouse: BuildingProps = {
  id: 21,
  latitude: 26.12,
  longitude: -80.13,
  address: '100 Main St',
  assignee: { name: 'Maria', lastname: 'Rivera', phone: '5551234567', email: 'maria@example.com' },
  additionalDetails: { city: 'Fort Lauderdale', state: 'FL', zip: '33301', note: 'Interested' },
};

describe('buildSubmitLeadDefaults', () => {
  it('copies the house homeowner and address into Submit Lead', () => {
    const actualValues = buildSubmitLeadDefaults(inputHouse, 3);

    expect(actualValues.firstName).toBe('Maria');
    expect(actualValues.phone).toBe('(555) 123-4567');
    expect(actualValues.addressLine1).toBe('100 Main St');
    expect(actualValues.city).toBe('Fort Lauderdale');
    expect(actualValues.officeId).toBe(3);
    expect(actualValues.about).toBe('Interested');
  });

  it('does not prefill Unknown Address as the street', () => {
    const actualValues = buildSubmitLeadDefaults({
      ...inputHouse,
      address: 'Unknown Address',
      additionalDetails: { note: 'Interested' },
    }, 3);

    expect(actualValues.addressLine1).toBe('');
  });
});
