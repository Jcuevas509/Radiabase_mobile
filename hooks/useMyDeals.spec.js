const React = require('react');
const axios = require('axios');
const TestRenderer = require('react-test-renderer');
const { act } = TestRenderer;
const { fetchMyDeals } = require('services/deals-api');
const { useMyDeals } = require('./useMyDeals');

jest.mock('services/deals-api', () => ({
  fetchMyDeals: jest.fn(),
}));

const deal = {
  id: 7,
  customerName: 'Maria Lopez',
  email: null,
  phone: null,
  address: null,
  status: 'Installed',
  stage: 'COMPLETED',
  dateSold: null,
  installDate: null,
  isAccountPaid: false,
  campaignName: null,
  setterName: null,
  closerName: null,
  officeName: null,
  providerName: null,
};

let latest;

function Harness({ scopeKey = '42:1:3:5', filter = 'all', search = '' }) {
  latest = useMyDeals({
    scopeKey,
    salesRepId: 42,
    search,
    filter,
    isEnabled: Boolean(scopeKey),
  });
  return null;
}

describe('useMyDeals', () => {
  let renderer;

  beforeEach(() => {
    latest = null;
    renderer = null;
    fetchMyDeals.mockReset();
    globalThis.IS_REACT_ACT_ENVIRONMENT = true;
  });

  afterEach(async () => {
    if (renderer) {
      await act(async () => renderer.unmount());
    }
  });

  it('aborts a superseded request and accepts only the current filtered response', async () => {
    let firstSignal;
    let resolveFirst;
    fetchMyDeals
      .mockImplementationOnce((input) => {
        firstSignal = input.signal;
        return new Promise((resolve) => { resolveFirst = resolve; });
      })
      .mockResolvedValueOnce({ deals: [deal], totalCount: 1, hasMore: false });

    await act(async () => {
      renderer = TestRenderer.create(React.createElement(Harness));
    });
    await act(async () => {
      renderer.update(React.createElement(Harness, { filter: 'completed' }));
      await Promise.resolve();
    });

    expect(firstSignal.aborted).toBe(true);
    expect(fetchMyDeals).toHaveBeenLastCalledWith(expect.objectContaining({ filter: 'completed' }));
    expect(latest.deals).toEqual([deal]);

    await act(async () => {
      resolveFirst({ deals: [{ ...deal, id: 99 }], totalCount: 1, hasMore: false });
      await Promise.resolve();
    });
    expect(latest.deals).toEqual([deal]);
  });

  it('synchronously hides loaded PII when the authorization scope changes', async () => {
    fetchMyDeals
      .mockResolvedValueOnce({ deals: [deal], totalCount: 1, hasMore: false })
      .mockRejectedValueOnce(new Error('replacement unavailable'));

    await act(async () => {
      renderer = TestRenderer.create(React.createElement(Harness));
      await Promise.resolve();
    });
    expect(latest.deals).toEqual([deal]);

    await act(async () => {
      renderer.update(React.createElement(Harness, { scopeKey: '42:9:12:5' }));
      await Promise.resolve();
    });
    expect(latest.deals).toEqual([]);
    expect(latest.totalCount).toBe(0);
  });

  it('never exposes an error from a previous authorization scope', async () => {
    const scopedError = new axios.AxiosError('Request failed');
    scopedError.response = {
      data: { message: 'No deal matched maria@example.com' },
      status: 404,
      statusText: 'Not Found',
      headers: {},
      config: { headers: {} },
    };
    fetchMyDeals
      .mockRejectedValueOnce(scopedError)
      .mockImplementationOnce(() => new Promise(() => {}));

    await act(async () => {
      renderer = TestRenderer.create(React.createElement(Harness, { search: 'maria@example.com' }));
      await Promise.resolve();
    });
    expect(latest.errorMessage).toContain('maria@example.com');

    await act(async () => {
      renderer.update(React.createElement(Harness, { scopeKey: '42:9:12:5' }));
    });
    expect(latest.errorMessage).toBeNull();
  });

  it('starts only one pagination request for back-to-back end events', async () => {
    let pageTwoSignal;
    let resolvePageTwo;
    fetchMyDeals
      .mockResolvedValueOnce({ deals: [deal], totalCount: 2, hasMore: true })
      .mockImplementationOnce((input) => {
        pageTwoSignal = input.signal;
        return new Promise((resolve) => { resolvePageTwo = resolve; });
      });

    await act(async () => {
      renderer = TestRenderer.create(React.createElement(Harness));
      await Promise.resolve();
    });
    await act(async () => {
      latest.loadMore();
      latest.loadMore();
    });

    expect(fetchMyDeals).toHaveBeenCalledTimes(2);
    expect(pageTwoSignal.aborted).toBe(false);

    await act(async () => {
      resolvePageTwo({ deals: [{ ...deal, id: 8 }], totalCount: 2, hasMore: false });
      await Promise.resolve();
    });
    expect(latest.deals.map((item) => item.id)).toEqual([7, 8]);
    expect(latest.isLoadingMore).toBe(false);
  });
});
