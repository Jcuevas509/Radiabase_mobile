import { MapAreaResponse, MapHouseResponse } from 'services/area-api';
import { pickAssigneeColor } from 'utils/pick-assignee-color';
import { mapHouseStatusToLeadStatusId } from 'utils/map-house-status';
import { BuildingProps } from 'types/componentsTypes';

type MapPolygon = {
  id: number;
  assignee: {
    id: number;
    name: string;
    lastname: string;
    description: string;
    color: string;
    email?: string;
    phone?: string | null;
    officeName?: string | null;
    salesRole?: string | null;
    structureName?: string | null;
    status?: string | null;
    avatarUrl?: string | null;
  } | null;
  coordinates: Array<{ latitude: number; longitude: number }>;
  buildingMarkers: BuildingProps[];
};

/**
 * Converts API map areas and houses into the polygon state the map UI already uses.
 */
export function convertMapAreasToPolygons(
  areas: MapAreaResponse[],
  houses: MapHouseResponse[] = [],
): MapPolygon[] {
  const housesByAreaId = new Map<number, MapHouseResponse[]>();
  houses.forEach((house) => {
    if (house.areaId == null) {
      return;
    }
    const list = housesByAreaId.get(house.areaId) ?? [];
    list.push(house);
    housesByAreaId.set(house.areaId, list);
  });
  return areas.map((area) => {
    const assignee = area.assignee
      ? {
          id: area.assignee.id,
          name: area.assignee.firstName,
          lastname: area.assignee.lastName,
          email: area.assignee.email ?? '',
          phone: area.assignee.phone ?? null,
          description: area.assignee.email ?? 'Assigned rep',
          color: pickAssigneeColor(area.assignee.id),
          officeName: area.assignee.officeName ?? null,
          salesRole: area.assignee.salesRole ?? null,
          structureName: area.assignee.structureName ?? null,
          avatarUrl: area.assignee.avatarUrl ?? null,
          status: null,
        }
      : null;
    const areaHouses = area.houses && area.houses.length > 0
      ? area.houses
      : (housesByAreaId.get(area.id) ?? []);
    return {
      id: area.id,
      assignee,
      coordinates: area.coordinates,
      buildingMarkers: areaHouses.map((house) => ({
        id: house.id,
        latitude: house.latitude,
        longitude: house.longitude,
        address: house.address ?? 'Unknown Address',
        title: house.address ?? 'House',
        subtitle: house.currentStatus ?? '',
        statusId: mapHouseStatusToLeadStatusId(house.currentStatus),
        assignee,
        additionalDetails: {
          city: house.city,
          state: house.state,
          zip: house.zip,
          note: house.notes,
          leadId: house.leadId,
          externalId: house.externalId,
          source: house.source,
        },
      })),
    };
  });
}
