const React = require('react');
const { Alert } = require('react-native');
const TestRenderer = require('react-test-renderer');
const { act } = TestRenderer;
const { fetchMyLeads } = require('services/leads-api');
const {
  cancelLeadAppointmentRemindersForScope,
  scheduleLeadAppointmentReminder,
} = require('services/lead-appointment-reminders');
const MyLeadsScreen = require('app/(app)/myLeads').default;

let mockSession;

jest.mock('@hugeicons/react-native', () => ({
  HugeiconsIcon: () => null,
}));
jest.mock('@react-navigation/native', () => ({
  useIsFocused: () => true,
}));
jest.mock('context/AuthenticationContext', () => ({
  useSession: () => ({ session: mockSession }),
}));
jest.mock('services/leads-api', () => ({
  fetchMyLeads: jest.fn(),
}));
jest.mock('services/lead-appointment-reminders', () => ({
  buildLeadAppointmentReminderKey: ({ scopeKey, leadId, appointmentAt }) => (
    `${scopeKey}:${leadId}:${appointmentAt}`
  ),
  cancelLeadAppointmentRemindersForScope: jest.fn().mockResolvedValue(undefined),
  listLeadAppointmentReminderKeys: jest.fn().mockResolvedValue(new Set()),
  scheduleLeadAppointmentReminder: jest.fn(),
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
    scheduleLeadAppointmentReminder.mockReset();
    cancelLeadAppointmentRemindersForScope.mockClear();
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

  it('schedules and marks a future appointment reminder for the current scope', async () => {
    const appointmentAt = '2027-08-20T18:00:00.000Z';
    const reminderKey = `42:1:3:5:7:${appointmentAt}`;
    fetchMyLeads.mockResolvedValueOnce({
      leads: [{ ...followUpLead, appointmentAt }],
      totalCount: 1,
      hasMore: false,
    });
    scheduleLeadAppointmentReminder.mockResolvedValueOnce({ status: 'scheduled', reminderKey });

    await act(async () => {
      renderer = TestRenderer.create(React.createElement(MyLeadsScreen));
      await Promise.resolve();
    });
    const reminderButton = renderer.root.find((node) => (
      node.props.accessibilityLabel === 'Set appointment reminder for Maria Lopez'
      && typeof node.props.onPress === 'function'
    ));
    await act(async () => {
      reminderButton.props.onPress();
      await Promise.resolve();
    });

    expect(scheduleLeadAppointmentReminder).toHaveBeenCalledWith({
      scopeKey: '42:1:3:5',
      leadId: 7,
      appointmentAt,
    });
    expect(renderer.root.findAll((node) => (
      node.props.accessibilityLabel === 'Appointment reminder set for Maria Lopez'
    ))).not.toHaveLength(0);
  });

  it('removes a reminder that finishes scheduling after the account scope changed', async () => {
    const appointmentAt = '2027-08-20T18:00:00.000Z';
    let resolveReminder;
    fetchMyLeads
      .mockResolvedValueOnce({
        leads: [{ ...followUpLead, appointmentAt }],
        totalCount: 1,
        hasMore: false,
      })
      .mockResolvedValueOnce({ leads: [], totalCount: 0, hasMore: false });
    scheduleLeadAppointmentReminder.mockImplementationOnce(() => new Promise((resolve) => {
      resolveReminder = resolve;
    }));

    await act(async () => {
      renderer = TestRenderer.create(React.createElement(MyLeadsScreen));
      await Promise.resolve();
    });
    const reminderButton = renderer.root.find((node) => (
      node.props.accessibilityLabel === 'Set appointment reminder for Maria Lopez'
      && typeof node.props.onPress === 'function'
    ));
    await act(async () => {
      reminderButton.props.onPress();
      await Promise.resolve();
    });

    mockSession = {
      ...mockSession,
      token: 'token-b',
      user: { ...mockSession.user, salesOrgId: 9, officeId: 12 },
    };
    await act(async () => {
      renderer.update(React.createElement(MyLeadsScreen));
      await Promise.resolve();
    });
    await act(async () => {
      resolveReminder({
        status: 'scheduled',
        reminderKey: `42:1:3:5:7:${appointmentAt}`,
      });
      await Promise.resolve();
    });

    expect(cancelLeadAppointmentRemindersForScope).toHaveBeenCalledWith('42:1:3:5');
    expect(renderer.root.findAll((node) => (
      node.props.accessibilityLabel === 'Appointment reminder set for Maria Lopez'
    ))).toHaveLength(0);
  });

  it('does not update UI or alert after a same-scope screen unmount', async () => {
    const appointmentAt = '2027-08-20T18:00:00.000Z';
    let resolveReminder;
    fetchMyLeads.mockResolvedValueOnce({
      leads: [{ ...followUpLead, appointmentAt }],
      totalCount: 1,
      hasMore: false,
    });
    scheduleLeadAppointmentReminder.mockImplementationOnce(() => new Promise((resolve) => {
      resolveReminder = resolve;
    }));

    await act(async () => {
      renderer = TestRenderer.create(React.createElement(MyLeadsScreen));
      await Promise.resolve();
    });
    const reminderButton = renderer.root.find((node) => (
      node.props.accessibilityLabel === 'Set appointment reminder for Maria Lopez'
      && typeof node.props.onPress === 'function'
    ));
    await act(async () => {
      reminderButton.props.onPress();
      await Promise.resolve();
    });
    await act(async () => renderer.unmount());
    renderer = null;
    alertSpy.mockClear();

    await act(async () => {
      resolveReminder({
        status: 'scheduled',
        reminderKey: `42:1:3:5:7:${appointmentAt}`,
      });
      await Promise.resolve();
    });

    expect(alertSpy).not.toHaveBeenCalled();
    expect(cancelLeadAppointmentRemindersForScope).not.toHaveBeenCalled();
  });
});
