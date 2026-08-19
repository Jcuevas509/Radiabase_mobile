type MapRouteReadinessInput = {
  readonly housesReady: boolean;
  readonly buildingsReady: boolean;
  readonly buildingsFailed: boolean;
  readonly locationReady: boolean;
};

/** Waits for current roofs, but permits saved-door fallback after a settled roof failure. */
export function isMapRouteReady(input: MapRouteReadinessInput): boolean {
  return input.housesReady &&
    input.locationReady &&
    (input.buildingsReady || input.buildingsFailed);
}
