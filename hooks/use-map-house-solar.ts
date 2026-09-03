import { useEffect, useState } from 'react';
import { fetchMapHouseSolar, SolarInsightsResponse } from 'services/area-api';

type MapHouseSolarState = {
  readonly isLoading: boolean;
  readonly insights: SolarInsightsResponse | null;
};

/**
 * Loads Solar insights when the house sheet opens for a persisted house.
 */
export function useMapHouseSolar(houseId: number | null, isVisible: boolean): MapHouseSolarState {
  const [isLoading, setIsLoading] = useState(false);
  const [insights, setInsights] = useState<SolarInsightsResponse | null>(null);

  useEffect(() => {
    if (!isVisible || houseId == null) {
      setInsights(null);
      setIsLoading(false);
      return;
    }
    let isActive = true;
    setIsLoading(true);
    setInsights(null);
    fetchMapHouseSolar(houseId)
      .then((actual) => {
        if (isActive) {
          setInsights(actual);
        }
      })
      .catch(() => {
        if (isActive) {
          setInsights({
            available: false,
            reason: 'upstream_error',
            imageryQuality: null,
            imageryDate: null,
            maxSunshineHoursPerYear: null,
            maxArrayPanelsCount: null,
            maxArrayAreaMeters2: null,
            wholeRoofAreaMeters2: null,
            yearlyEnergyKwh: null,
            buildingCenter: null,
          });
        }
      })
      .finally(() => {
        if (isActive) {
          setIsLoading(false);
        }
      });
    return () => {
      isActive = false;
    };
  }, [houseId, isVisible]);

  return { isLoading, insights };
}
