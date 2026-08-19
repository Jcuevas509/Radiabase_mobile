import { getUserScopeKey } from 'utils/get-user-scope-key';

describe('getUserScopeKey', () => {
  it('includes every authorization-sensitive mobile scope field', () => {
    expect(getUserScopeKey({
      id: '42',
      salesOrgId: 1,
      officeId: 3,
      verticalId: 5,
    })).toBe('42:1:3:5');
  });

  it('rejects missing and invalid users', () => {
    expect(getUserScopeKey(null)).toBeNull();
    expect(getUserScopeKey({ id: 'nope', salesOrgId: 1, officeId: 3, verticalId: 5 }))
      .toBeNull();
  });
});
