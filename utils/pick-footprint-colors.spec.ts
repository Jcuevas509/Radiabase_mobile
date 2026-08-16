import { pickFootprintColors } from './pick-footprint-colors';

describe('pickFootprintColors', () => {
  it('uses the default outline when the house has not been knocked', () => {
    const actualColors = pickFootprintColors(null);
    expect(actualColors.strokeColor).toBe('#F5F0E6');
  });

  it('uses the not-home color when the house was knocked', () => {
    const actualColors = pickFootprintColors('not_home');
    expect(actualColors.strokeColor).toBe('#F9B20F');
  });
});
