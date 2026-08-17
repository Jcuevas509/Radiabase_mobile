import { hasIncompleteHouseAddress, isUnknownMapAddress, parseHouseAddress } from './parse-house-address';

describe('parseHouseAddress', () => {
  it('splits a full formatted house address into Submit Lead fields', () => {
    const actualAddress = parseHouseAddress({
      address: '100 Main St, Fort Lauderdale, FL 33301',
    });

    expect(actualAddress).toEqual({
      addressLine1: '100 Main St',
      city: 'Fort Lauderdale',
      state: 'FL',
      zip: '33301',
    });
  });

  it('ignores Unknown Address placeholders', () => {
    const actualAddress = parseHouseAddress({ address: 'Unknown Address' });

    expect(actualAddress.addressLine1).toBe('');
  });

  it('prefers city state zip already saved on the house', () => {
    const actualAddress = parseHouseAddress({
      address: '100 Main St',
      city: 'Fort Lauderdale',
      state: 'FL',
      zip: '33301',
    });

    expect(actualAddress.city).toBe('Fort Lauderdale');
  });
});

describe('isUnknownMapAddress', () => {
  it('treats the map placeholder as unknown', () => {
    expect(isUnknownMapAddress('Unknown Address')).toBe(true);
  });
});

describe('hasIncompleteHouseAddress', () => {
  it('requires a full street city state zip', () => {
    const actualIsIncomplete = hasIncompleteHouseAddress({
      addressLine1: '100 Main St',
      city: '',
      state: 'FL',
      zip: '33301',
    });

    expect(actualIsIncomplete).toBe(true);
  });
});
