import {
  countMapHousesByOutcome,
  filterMapHousesByOutcome,
} from './filter-map-houses-by-outcome';

const houses = [
  { id: 1, latitude: 40, longitude: -74 },
  { id: 2, latitude: 40, longitude: -74, subtitle: 'not_home' },
  { id: 3, latitude: 40, longitude: -74, subtitle: 'interested' },
  { id: 4, latitude: 40, longitude: -74, subtitle: 'custom' },
  { id: 5, latitude: 40, longitude: -74, subtitle: 'unknown_future_status' },
];

describe('map house outcome filters', () => {
  it('filters using the backend status string without conflating labels', () => {
    expect(filterMapHousesByOutcome(houses, 'not_home').map((house) => house.id)).toEqual([2]);
    expect(filterMapHousesByOutcome(houses, 'interested').map((house) => house.id)).toEqual([3]);
    expect(filterMapHousesByOutcome(houses, 'unworked').map((house) => house.id)).toEqual([1]);
  });

  it('counts known outcomes while retaining every house in All', () => {
    expect(countMapHousesByOutcome(houses)).toEqual({
      all: 5,
      unworked: 1,
      interested: 1,
      not_interested: 0,
      not_home: 1,
      custom: 1,
    });
  });
});
