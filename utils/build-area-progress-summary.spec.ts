import { buildAreaProgressSummary } from './build-area-progress-summary';

describe('buildAreaProgressSummary', () => {
  it('summarizes worked, unworked, leads, completion, and status counts', () => {
    const summary = buildAreaProgressSummary([
      { id: 1, latitude: 40, longitude: -74, statusId: 2, subtitle: 'not_home' },
      { id: 2, latitude: 40, longitude: -74, statusId: 2, subtitle: 'not_home', additionalDetails: { leadId: 90 } },
      { id: 3, latitude: 40, longitude: -74, statusId: 4, subtitle: 'custom' },
      { id: 4, latitude: 40, longitude: -74 },
    ]);

    expect(summary).toEqual({
      savedDoors: 4,
      workedDoors: 3,
      unworkedDoors: 1,
      leads: 1,
      completionPercent: 75,
      statusCounts: [
        { status: 'custom', count: 1 },
        { status: 'not_home', count: 2 },
      ],
    });
  });

  it('returns a zero-safe empty summary', () => {
    expect(buildAreaProgressSummary([])).toEqual({
      savedDoors: 0,
      workedDoors: 0,
      unworkedDoors: 0,
      leads: 0,
      completionPercent: 0,
      statusCounts: [],
    });
  });
});
