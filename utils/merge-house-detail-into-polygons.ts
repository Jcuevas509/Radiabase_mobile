import type { MapHouseDetailResponse } from 'services/area-api';
import type { BuildingProps } from 'types/componentsTypes';
import { applyMapHouseDetailToBuilding } from 'utils/apply-map-house-detail-to-building';

export type PolygonWithHouses = {
  readonly id: number;
  readonly assignee?: any;
  readonly buildingMarkers: BuildingProps[];
};

/** Keeps territory summaries and saved pins fresh after confirmed house writes. */
export function mergeHouseDetailIntoPolygons<TPolygon extends PolygonWithHouses>(
  polygons: TPolygon[],
  detail: MapHouseDetailResponse,
  externalId: string | null = null,
): TPolygon[] {
  if (detail.areaId == null) {
    return polygons;
  }
  return polygons.map((polygon) => {
    if (polygon.id !== detail.areaId) {
      return polygon;
    }
    const existing = polygon.buildingMarkers.find((house) => house.id === detail.id);
    const base: BuildingProps = existing ?? {
      id: detail.id,
      latitude: detail.latitude,
      longitude: detail.longitude,
      address: detail.address ?? 'Unknown Address',
      assignee: polygon.assignee,
      additionalDetails: { externalId },
    };
    const updated = applyMapHouseDetailToBuilding(base, detail);
    return {
      ...polygon,
      buildingMarkers: [
        ...polygon.buildingMarkers.filter((house) => house.id !== detail.id),
        updated,
      ],
    };
  });
}
