import { mapApiUserToSessionUser } from './map-api-user';
import { ApiMeResponse } from 'types/auth-api.types';

describe('mapApiUserToSessionUser', () => {
  it('maps a setter with no management role to agent', () => {
    const inputMe: ApiMeResponse = {
      id: 42,
      email: 'setter@example.com',
      first_name: 'Jane',
      last_name: 'Rep',
      roles: [{ role_id: 7 }],
    };
    const expectedUser = {
      id: '42',
      firstName: 'Jane',
      lastName: 'Rep',
      email: 'setter@example.com',
      role: 'agent' as const,
      roleLabel: 'Setter',
      salesOrgId: null,
      officeId: null,
      officeName: null,
      structureName: null,
      verticalId: null,
    };
    const actualUser = mapApiUserToSessionUser(inputMe);
    expect(actualUser).toEqual(expectedUser);
  });

  it('maps a sales-org manager role to manager', () => {
    const inputMe: ApiMeResponse = {
      id: 3,
      email: 'boss@example.com',
      first_name: 'Pat',
      last_name: 'Lead',
      roles: [{ role_id: 4 }],
    };
    const actualUser = mapApiUserToSessionUser(inputMe);
    expect(actualUser.role).toBe('manager');
  });

  it('maps office and structure names from sales org details', () => {
    const inputMe: ApiMeResponse = {
      id: 8,
      email: 'lead@example.com',
      first_name: 'Alex',
      last_name: 'Rivera',
      roles: [{ role_id: 4 }],
      sales_org_user_details: {
        sales_org_id: 1,
        sales_role: 'manager',
        current_office: { id: 3, name: 'Austin' },
        current_structure: { id: 12, name: 'Central Region' },
      },
    };
    const actualUser = mapApiUserToSessionUser(inputMe);
    expect(actualUser.officeName).toBe('Austin');
    expect(actualUser.structureName).toBe('Central Region');
    expect(actualUser.roleLabel).toBe('manager');
  });
});
