import { MapHouseResponse } from 'services/area-api';
import { BuildingProps } from 'types/componentsTypes';
import { mapHouseStatusToLeadStatusId } from 'utils/map-house-status';

/**
 * Converts field-map houses into marker props, including roam houses with no turf.
 */
export function convertMapHousesToBuildings(houses: MapHouseResponse[]): BuildingProps[] {
  return houses.map((house) => ({
    id: house.id,
    latitude: house.latitude,
    longitude: house.longitude,
    address: house.address ?? 'Unknown Address',
    title: house.address ?? 'House',
    subtitle: house.currentStatus ?? '',
    statusId: mapHouseStatusToLeadStatusId(house.currentStatus),
    additionalDetails: {
      city: house.city,
      state: house.state,
      zip: house.zip,
      note: house.notes,
      leadId: house.leadId,
      externalId: house.externalId,
    },
  }));
}
