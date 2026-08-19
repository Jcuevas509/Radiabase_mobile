import {
  buildWalkingDirectionsUrl,
  formatWalkingDistance,
} from './build-walking-directions-url';

describe('buildWalkingDirectionsUrl', () => {
  const destination = { latitude: 40.1, longitude: -74.2 };

  it('builds Apple Maps walking directions on iOS', () => {
    expect(buildWalkingDirectionsUrl(destination, 'ios')).toBe(
      'http://maps.apple.com/?daddr=40.1%2C-74.2&dirflg=w',
    );
  });

  it('builds a universal Google Maps walking URL elsewhere', () => {
    expect(buildWalkingDirectionsUrl(destination, 'android')).toBe(
      'https://www.google.com/maps/dir/?api=1&destination=40.1%2C-74.2&travelmode=walking&dir_action=navigate',
    );
  });

  it('formats field-friendly distances', () => {
    expect(formatWalkingDistance(30)).toBe('98 ft');
    expect(formatWalkingDistance(1_609.344)).toBe('1.0 mi');
  });
});
