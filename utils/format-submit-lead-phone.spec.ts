import { formatSubmitLeadPhone, isValidSubmitLeadPhone, toSubmitLeadPhoneDigits } from './format-submit-lead-phone';

describe('formatSubmitLeadPhone', () => {
  it('masks ten digits like the web Submit Lead form', () => {
    const actualPhone = formatSubmitLeadPhone('5551234567');

    expect(actualPhone).toBe('(555) 123-4567');
  });
});

describe('isValidSubmitLeadPhone', () => {
  it('accepts the web phone mask', () => {
    const actualIsValid = isValidSubmitLeadPhone('(555) 123-4567');

    expect(actualIsValid).toBe(true);
  });
});

describe('toSubmitLeadPhoneDigits', () => {
  it('returns the ten digits for POST /leads', () => {
    const actualDigits = toSubmitLeadPhoneDigits('(555) 123-4567');

    expect(actualDigits).toBe('5551234567');
  });
});
