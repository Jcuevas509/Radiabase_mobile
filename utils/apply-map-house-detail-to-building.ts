import { MapHouseDetailResponse } from 'services/area-api';
import { BuildingProps } from 'types/componentsTypes';
import { mapHouseStatusToLeadStatusId } from 'utils/map-house-status';

/**
 * Overlays field-house detail (lead + knock history) onto the map marker model.
 */
export function applyMapHouseDetailToBuilding(
  building: BuildingProps,
  detail: MapHouseDetailResponse,
): BuildingProps {
  const statusIds = detail.knockHistory
    .map((knock) => mapHouseStatusToLeadStatusId(knock.status))
    .filter((statusId): statusId is number => statusId !== undefined);
  return {
    ...building,
    address: detail.address ?? building.address,
    latitude: detail.latitude || building.latitude,
    longitude: detail.longitude || building.longitude,
    subtitle: detail.currentStatus ?? building.subtitle,
    statusId: mapHouseStatusToLeadStatusId(detail.currentStatus) ?? building.statusId,
    statuses: statusIds.length > 0 ? statusIds : building.statuses,
    assignee: {
      ...building.assignee,
      name: detail.lead?.firstName || building.assignee?.name,
      lastname: detail.lead?.lastName || building.assignee?.lastname,
      phone: detail.lead?.phone ?? building.assignee?.phone,
      email: detail.lead?.email ?? building.assignee?.email,
    },
    additionalDetails: {
      ...building.additionalDetails,
      city: detail.city ?? building.additionalDetails?.city,
      state: detail.state ?? building.additionalDetails?.state,
      zip: detail.zip ?? building.additionalDetails?.zip,
      note: detail.notes ?? building.additionalDetails?.note,
      leadId: detail.leadId,
    },
  };
}
