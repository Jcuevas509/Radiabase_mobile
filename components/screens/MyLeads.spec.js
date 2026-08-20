const React = require('react');
const { Alert } = require('react-native');
const TestRenderer = require('react-test-renderer');
const { act } = TestRenderer;
const { fetchMyLeads, updateFieldLeadStatus } = require('services/leads-api');
const MyLeadsScreen = require('app/(app)/myLeads').default;

let mockSession;

jest.mock('@hugeicons/react-native', () => ({
  HugeiconsIcon: () => null,
}));
jest.mock('@react-navigation/native', () => ({
  useIsFocused: () => true,
  useNavigation: () => ({ dispatch: jest.fn() }),
  DrawerActions: { openDrawer: () => ({ type: 'OPEN_DRAWER' }) },
}));
jest.mock('context/AuthenticationContext', () => ({
  useSession: () => ({ session: mockSession }),
}));
jest.mock('services/leads-api', () => ({
  fetchMyLeads: jest.fn(),
  updateFieldLeadStatus: jest.fn(),
}));

const followUpLead = {
  id: 7,
  fullName: 'Maria Lopez',
  firstName: 'Maria',
  lastName: 'Lopez',
  phone: '2145550100',
  email: 'maria@example.com',
  address: '1 Main St, Dallas, TX',
  status: 'follow_up',
  notes: null,
  appointmentAt: null,
  createdAt: null,
  updatedAt: null,
  isConvertedToDeal: false,
  officeName: 'Dallas',
  verticalName: 'Solar',
  closerName: null,
};

function textContent(renderer) {
  return renderer.root
    .findAll((node) => typeof node.props.children === 'string')
    .map((node) => node.props.children);
}

describe('MyLeadsScreen request lifecycle', () => {
  let renderer;
  let alertSpy;

  beforeEach(() => {
    mockSession = {
      token: 'token-a',
      user: {
        id: '42',
        salesOrgId: 1,
        officeId: 3,
        verticalId: 5,
      },
    };
    fetchMyLeads.mockReset();
    updateFieldLeadStatus.mockReset();
    globalThis.IS_REACT_ACT_ENVIRONMENT = true;
    alertSpy = jest.spyOn(Alert, 'alert').mockImplementation(() => undefined);
  });

  afterEach(async () => {
    if (renderer) {
      await act(async () => renderer.unmount());
    }
    renderer = null;
    alertSpy.mockRestore();
  });

  it('aborts the prior query and fetches the selected outcome from the server', async () => {
    let firstSignal;
    fetchMyLeads
      .mockImplementationOnce((input) => {
        firstSignal = input.signal;
        return new Promise(() => {});
      })
      .mockResolvedValueOnce({ leads: [followUpLead], totalCount: 1, hasMore: false });

    await act(async () => {
      renderer = TestRenderer.create(React.createElement(MyLeadsScreen));
    });
    const filterTabs = renderer.root.findAll((node) => (
      node.props.accessibilityRole === 'tab' && typeof node.props.onPress === 'function'
    ));

    await act(async () => {
      filterTabs[2].props.onPress();
      await Promise.resolve();
    });

    expect(firstSignal.aborted).toBe(true);
    expect(fetchMyLeads).toHaveBeenLastCalledWith(expect.objectContaining({
      salesRepId: 42,
      filter: 'follow_up',
    }));
    expect(textContent(renderer)).toContain('Maria Lopez');
  });

  it('never renders cached leads after the authorization scope changes', async () => {
    fetchMyLeads
      .mockResolvedValueOnce({ leads: [followUpLead], totalCount: 1, hasMore: false })
      .mockRejectedValueOnce(new Error('new scope unavailable'));

    await act(async () => {
      renderer = TestRenderer.create(React.createElement(MyLeadsScreen));
      await Promise.resolve();
    });
    expect(textContent(renderer)).toContain('Maria Lopez');

    const searchInput = renderer.root.find((node) => node.props.accessibilityLabel === 'Search my leads');
    await act(async () => searchInput.props.onChangeText('maria@example.com'));

    mockSession = {
      ...mockSession,
      token: 'token-b',
      user: { ...mockSession.user, salesOrgId: 9, officeId: 12 },
    };
    await act(async () => {
      renderer.update(React.createElement(MyLeadsScreen));
      await Promise.resolve();
    });

    expect(renderer.root.find((node) => node.props.accessibilityLabel === 'Search my leads').props.value)
      .toBe('');
    expect(textContent(renderer)).not.toContain('Maria Lopez');
  });

  it('changes a lead status from the row pill and saves it to the server', async () => {
    fetchMyLeads.mockResolvedValueOnce({
      leads: [followUpLead],
      totalCount: 1,
      hasMore: false,
    });
    updateFieldLeadStatus.mockResolvedValueOnce(undefined);

    await act(async () => {
      renderer = TestRenderer.create(React.createElement(MyLeadsScreen));
      await Promise.resolve();
    });
    const statusPill = renderer.root.find((node) => (
      node.props.accessibilityLabel === 'Change status for Maria Lopez'
      && typeof node.props.onPress === 'function'
    ));
    await act(async () => {
      statusPill.props.onPress();
      await Promise.resolve();
    });

    const [, , buttons] = alertSpy.mock.calls[alertSpy.mock.calls.length - 1];
    const soldOption = buttons.find((button) => button.text === 'Sold');
    await act(async () => {
      soldOption.onPress();
      await Promise.resolve();
    });

    expect(updateFieldLeadStatus).toHaveBeenCalledWith({ leadId: 7, status: 'sold' });
    expect(textContent(renderer)).toContain('Sold');
  });

  it('reverts the optimistic status when the server rejects the change', async () => {
    fetchMyLeads.mockResolvedValueOnce({
      leads: [followUpLead],
      totalCount: 1,
      hasMore: false,
    });
    updateFieldLeadStatus.mockRejectedValueOnce(new Error('nope'));

    await act(async () => {
      renderer = TestRenderer.create(React.createElement(MyLeadsScreen));
      await Promise.resolve();
    });
    const statusPill = renderer.root.find((node) => (
      node.props.accessibilityLabel === 'Change status for Maria Lopez'
      && typeof node.props.onPress === 'function'
    ));
    await act(async () => {
      statusPill.props.onPress();
      await Promise.resolve();
    });
    const [, , buttons] = alertSpy.mock.calls[alertSpy.mock.calls.length - 1];
    const soldOption = buttons.find((button) => button.text === 'Sold');
    await act(async () => {
      soldOption.onPress();
      await Promise.resolve();
    });

    expect(textContent(renderer)).toContain('Follow Up');
    expect(textContent(renderer)).not.toContain('Sold');
  });
});
