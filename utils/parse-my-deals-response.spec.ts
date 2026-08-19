import { parseMyDealsResponse } from 'utils/parse-my-deals-response';

describe('parseMyDealsResponse', () => {
  it('normalizes a paginated snake-case response', () => {
    const result = parseMyDealsResponse({
      data: [{
        id: 7,
        full_name: 'Maria Lopez',
        phone_number: '2145550100',
        address: '1 Main St',
        status: 'Installed',
        stage: 'COMPLETED',
        date_sold: '2026-08-01T12:00:00.000Z',
        is_account_paid: true,
        office_name: 'Dallas',
      }],
      meta: { total: 31, has_more: true },
    }, 1, 25);

    expect(result).toEqual({
      deals: [expect.objectContaining({
        id: 7,
        customerName: 'Maria Lopez',
        phone: '2145550100',
        address: '1 Main St',
        status: 'Installed',
        stage: 'COMPLETED',
        isAccountPaid: true,
        officeName: 'Dallas',
      })],
      totalCount: 31,
      hasMore: true,
    });
  });

  it('accepts nested camel-case data and a structured address', () => {
    const result = parseMyDealsResponse({
      data: {
        items: [{
          id: '9',
          customerName: 'Sam Reed',
          address: { line1: '4 Oak Ave', city: 'Austin', state: 'TX', zip: '78701' },
          installDate: '2026-09-02T12:00:00Z',
        }, { id: 0 }],
        meta: { totalCount: 47, hasMore: false },
      },
    }, 1, 25);

    expect(result.deals).toHaveLength(1);
    expect(result.deals[0]).toMatchObject({
      id: 9,
      customerName: 'Sam Reed',
      address: '4 Oak Ave, Austin, TX, 78701',
      installDate: '2026-09-02T12:00:00Z',
    });
    expect(result.hasMore).toBe(false);
    expect(result.totalCount).toBe(47);
  });
});
