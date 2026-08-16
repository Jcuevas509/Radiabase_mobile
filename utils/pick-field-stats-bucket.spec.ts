import { pickFieldStatsBucket } from './pick-field-stats-bucket';
import { FieldStatsResponse } from 'services/area-api';

describe('pickFieldStatsBucket', () => {
  const inputStats: FieldStatsResponse = {
    today: { leads: 1, knocks: 2, customers: 0 },
    week: { leads: 4, knocks: 8, customers: 1 },
    month: { leads: 10, knocks: 20, customers: 3 },
  };

  it('returns today for the Today tab', () => {
    expect(pickFieldStatsBucket(inputStats, 'Today')).toEqual(inputStats.today);
  });

  it('returns week for This Week', () => {
    expect(pickFieldStatsBucket(inputStats, 'This Week')).toEqual(inputStats.week);
  });
});
