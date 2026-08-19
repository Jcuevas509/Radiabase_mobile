import { parseMyLeadsResponse } from './parse-my-leads-response';

describe('parseMyLeadsResponse', () => {
  it('normalizes the expected snake-case paginated response', () => {
    const result = parseMyLeadsResponse({
      data: [{
        id: 42,
        full_name: 'Maria Lopez',
        phone_number: '2145550100',
        full_address: '1 Main St, Dallas, TX',
        lead_status: 'follow_up',
        appt_date: '2026-08-20T14:00:00.000Z',
        created_at: '2026-08-18T14:00:00.000Z',
        is_converted_to_deal: false,
        office_name: 'Dallas',
      }],
      total_count: 31,
    }, 1, 25);

    expect(result).toMatchObject({ totalCount: 31, hasMore: true });
    expect(result.leads[0]).toMatchObject({
      id: 42,
      fullName: 'Maria Lopez',
      status: 'follow_up',
      appointmentAt: '2026-08-20T14:00:00.000Z',
      address: '1 Main St, Dallas, TX',
    });
  });

  it('accepts nested, camel-case response variants and rejects malformed rows', () => {
    const result = parseMyLeadsResponse({
      data: {
        leads: [
          { id: '7', firstName: 'Sam', lastName: 'Lee', leadStatus: 'SOLD' },
          { id: 'bad', fullName: 'Broken' },
          null,
        ],
        pagination: { total: 1, hasMore: false },
      },
    }, 1, 25);

    expect(result).toEqual({
      leads: [expect.objectContaining({ id: 7, fullName: 'Sam Lee', status: 'sold' })],
      totalCount: 1,
      hasMore: false,
    });
  });

  it('supports a bare array and constructs an address from component fields', () => {
    const result = parseMyLeadsResponse([{
      id: 9,
      first_name: 'Ava',
      address_line1: '9 Oak Ave',
      city: 'Tampa',
      state: 'FL',
      zip_code: '33601',
    }], 1, 25);

    expect(result.leads[0]).toMatchObject({
      fullName: 'Ava',
      address: '9 Oak Ave, Tampa, FL, 33601',
      status: 'new',
    });
    expect(result.hasMore).toBe(false);
  });
});
