import { buildProfileViewModel } from './build-profile-view-model';
import type { User } from 'types/storageTypes';

const user: User = {
  id: '42',
  firstName: 'Jose',
  lastName: 'Cuevas',
  email: 'jose@suntappedenergy.com',
  role: 'manager',
  roleLabel: 'Sales Org Manager',
  salesOrgId: 1,
  officeId: 3,
  officeName: 'Suntrappers',
  structureName: 'North Texas',
  verticalId: 1,
};

describe('buildProfileViewModel', () => {
  it('maps a full session user onto the profile display model', () => {
    const actual = buildProfileViewModel(user);

    expect(actual).toMatchObject({
      fullName: 'Jose Cuevas',
      email: 'jose@suntappedenergy.com',
      roleLabel: 'Sales Org Manager',
      isManager: true,
    });
    expect(actual?.detailRows).toEqual([
      { label: 'Office', value: 'Suntrappers' },
      { label: 'Team', value: 'North Texas' },
      { label: 'Role', value: 'Sales Org Manager' },
    ]);
  });

  it('drops empty rows and duplicate team names instead of rendering blanks', () => {
    const actual = buildProfileViewModel({
      ...user,
      officeName: 'Suntrappers',
      structureName: 'Suntrappers',
      roleLabel: '',
      role: 'agent',
    });

    expect(actual?.detailRows).toEqual([
      { label: 'Office', value: 'Suntrappers' },
      { label: 'Role', value: 'Setter' },
    ]);
  });

  it('falls back to a generic name when the account has none', () => {
    const actual = buildProfileViewModel({ ...user, firstName: '', lastName: '' });

    expect(actual?.fullName).toBe('Field Rep');
  });

  it('returns null without a signed-in user', () => {
    expect(buildProfileViewModel(null)).toBeNull();
    expect(buildProfileViewModel(undefined)).toBeNull();
  });
});
