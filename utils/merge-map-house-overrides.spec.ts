import type { MapHouseResponse } from 'services/area-api';
import { mergeMapHouseOverrides } from './merge-map-house-overrides';

const house = (id: number, currentStatus: string | null): MapHouseResponse => ({
  id,
  areaId: 1,
  latitude: 40,
  longitude: -74,
  address: '1 Main St',
  city: 'Town',
  state: 'NY',
  zip: '10001',
  currentStatus,
  notes: null,
  leadId: null,
});

const bbox = { west: -74.01, south: 39.99, east: -73.99, north: 40.01 };
const override = (value: MapHouseResponse, startedRequestGenerationAtWrite = 4) => ({
  house: value,
  startedRequestGenerationAtWrite,
});

describe('mergeMapHouseOverrides', () => {
  it('keeps a confirmed status write over a stale viewport response', () => {
    const staleResponse = [house(1, 'new')];
    const confirmedWrite = house(1, 'not_home');
    expect(mergeMapHouseOverrides(staleResponse, [override(confirmedWrite)], bbox, 4)[0].currentStatus)
      .toBe('not_home');
  });

  it('keeps a newly created house missing from a stale response', () => {
    expect(mergeMapHouseOverrides([], [override(house(2, null))], bbox, 4).map((item) => item.id))
      .toEqual([2]);
  });

  it('does not carry local houses into an unrelated viewport', () => {
    const distantBbox = { west: -80.01, south: 34.99, east: -79.99, north: 35.01 };
    expect(mergeMapHouseOverrides([], [override(house(2, null))], distantBbox, 4)).toEqual([]);
  });

  it('accepts a newer server value from a request started after the local write', () => {
    const newerServerResponse = [house(1, 'go_back')];
    const oldLocalWrite = override(house(1, 'not_home'), 4);
    expect(mergeMapHouseOverrides(newerServerResponse, [oldLocalWrite], bbox, 5)[0].currentStatus)
      .toBe('go_back');
  });

  it('treats a request started after a debounce-window write as authoritative', () => {
    const localWriteBeforeRequestStarted = override(house(1, 'not_home'), 7);
    const serverResponseFromNextStartedRequest = [house(1, 'call_back')];
    expect(mergeMapHouseOverrides(
      serverResponseFromNextStartedRequest,
      [localWriteBeforeRequestStarted],
      bbox,
      8,
    )[0].currentStatus).toBe('call_back');
  });
});
