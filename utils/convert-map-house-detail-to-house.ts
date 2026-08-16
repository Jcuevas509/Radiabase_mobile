import { MapHouseDetailResponse, MapHouseResponse } from 'services/area-api';

/**
 * Turns a house sheet payload into a field-map marker row.
 */
export function convertMapHouseDetailToHouse(
  detail: MapHouseDetailResponse,
  externalId: string | null = null,
): MapHouseResponse {
  return {
    id: detail.id,
    areaId: detail.areaId,
    latitude: detail.latitude,
    longitude: detail.longitude,
    address: detail.address,
    city: detail.city,
    state: detail.state,
    zip: detail.zip,
    currentStatus: detail.currentStatus,
    notes: detail.notes,
    leadId: detail.leadId,
    externalId,
    source: 'overture',
  };
}
