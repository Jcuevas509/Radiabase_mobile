import { apiClient } from 'services/api-client';
import { MapBbox } from 'utils/get-region-bbox';

export type MapAreaResponse = {
  readonly id: number;
  readonly name: string | null;
  readonly officeId: number | null;
  readonly salesOrgId: number | null;
  readonly houseCount?: number;
  readonly coordinates: Array<{ latitude: number; longitude: number }>;
  readonly assignee: {
    readonly id: number;
    readonly firstName: string;
    readonly lastName: string;
    readonly email?: string | null;
    readonly phone?: string | null;
    readonly officeName?: string | null;
    readonly salesRole?: string | null;
    readonly structureName?: string | null;
    readonly avatarUrl?: string | null;
  } | null;
  readonly houses?: Array<MapHouseResponse>;
};

export type MapHouseResponse = {
  readonly id: number;
  readonly areaId: number | null;
  readonly latitude: number;
  readonly longitude: number;
  readonly address: string | null;
  readonly city: string | null;
  readonly state: string | null;
  readonly zip: string | null;
  readonly currentStatus: string | null;
  readonly notes: string | null;
  readonly leadId: number | null;
  readonly externalId?: string | null;
  readonly source?: string | null;
};

export type MapBuildingResponse = {
  readonly id: string;
  readonly coordinates: Array<{ latitude: number; longitude: number }>;
  readonly roofLat: number;
  readonly roofLng: number;
  readonly buildingClass: string | null;
};

export type MapHouseDetailResponse = {
  readonly id: number;
  readonly areaId: number | null;
  readonly latitude: number;
  readonly longitude: number;
  readonly address: string | null;
  readonly city: string | null;
  readonly state: string | null;
  readonly zip: string | null;
  readonly currentStatus: string | null;
  readonly notes: string | null;
  readonly leadId: number | null;
  readonly lead: {
    readonly id: number;
    readonly firstName: string | null;
    readonly lastName: string | null;
    readonly phone: string | null;
    readonly email: string | null;
    readonly status: string | null;
  } | null;
  readonly knockHistory: Array<{
    readonly status: string | null;
    readonly notes: string | null;
    readonly createdAt: string | null;
    readonly repId: number | null;
  }>;
};

export type FieldStatsResponse = {
  readonly today: { readonly leads: number; readonly knocks: number; readonly customers: number };
  readonly week: { readonly leads: number; readonly knocks: number; readonly customers: number };
  readonly month: { readonly leads: number; readonly knocks: number; readonly customers: number };
};

type CreateMapAreaInput = {
  readonly name?: string;
  readonly officeId: number;
  readonly salesOrgId: number;
  readonly boundary: { type: 'Polygon'; coordinates: number[][][] };
};

/**
 * Loads persisted turf (no house markers) for the logged-in org.
 */
export async function fetchMapAreas(): Promise<MapAreaResponse[]> {
  const response = await apiClient.get<MapAreaResponse[]>('/area-management/map-areas');
  return response.data;
}

/**
 * Loads Overture building footprints for the visible street-level viewport.
 */
export async function fetchMapBuildings(bbox: {
  readonly west: number;
  readonly south: number;
  readonly east: number;
  readonly north: number;
}): Promise<MapBuildingResponse[]> {
  const response = await apiClient.get<MapBuildingResponse[]>('/area-management/map-buildings', {
    params: bbox,
    timeout: 20000,
  });
  return response.data;
}

/**
 * Loads houses for the field map, optionally limited to area ids and a viewport.
 */
export async function fetchMapHouses(
  areaIds: number[] = [],
  bbox?: MapBbox,
): Promise<MapHouseResponse[]> {
  const response = await apiClient.get<MapHouseResponse[]>('/area-management/map-houses', {
    params: {
      ...(areaIds.length > 0 ? { areaIds: areaIds.join(',') } : {}),
      ...(bbox ?? {}),
    },
  });
  return response.data;
}

/**
 * Finds or creates a canvassing house from a tapped Overture roof.
 */
export async function createMapHouseFromBuilding(input: {
  readonly overtureBuildingId: string;
  readonly roofLat: number;
  readonly roofLng: number;
  readonly areaId?: number;
}): Promise<MapHouseDetailResponse> {
  const response = await apiClient.post<MapHouseDetailResponse>(
    '/area-management/map-houses/from-building',
    {
      overtureBuildingId: input.overtureBuildingId,
      roofLat: input.roofLat,
      roofLng: input.roofLng,
      areaId: input.areaId,
    },
  );
  return response.data;
}

/**
 * Loads knock history and the linked lead for a house.
 */
export async function fetchMapHouseDetail(houseId: number): Promise<MapHouseDetailResponse> {
  const response = await apiClient.get<MapHouseDetailResponse>(
    `/area-management/map-houses/${houseId}`,
  );
  return response.data;
}

/**
 * Loads dashboard lead, knock, and customer counts.
 */
export async function fetchFieldStats(): Promise<FieldStatsResponse> {
  const response = await apiClient.get<FieldStatsResponse>('/area-management/field-stats');
  return response.data;
}

/**
 * Creates turf only. Roofs come from Overture; doors are created when a roof is tapped.
 */
export async function createMapArea(input: CreateMapAreaInput): Promise<unknown> {
  const response = await apiClient.post('/area-management/create-area', {
    name: input.name,
    office_id: input.officeId,
    sales_org_id: input.salesOrgId,
    boundary: input.boundary,
    auto_discover_houses: false,
  });
  return response.data;
}

/**
 * Assigns a rep to an area.
 */
export async function assignMapAreaRep(input: {
  readonly areaId: number;
  readonly repId: number;
}): Promise<unknown> {
  const response = await apiClient.post('/area-management/assign-area-rep', {
    area_id: input.areaId,
    rep_id: input.repId,
  });
  return response.data;
}

/**
 * Appends a knock to a canvassing house and returns the updated sheet.
 */
export async function createMapHouseStatus(input: {
  readonly houseId: number;
  readonly status: string;
  readonly notes?: string;
}): Promise<MapHouseDetailResponse> {
  const response = await apiClient.post<MapHouseDetailResponse>(
    `/area-management/map-houses/${input.houseId}/status`,
    {
      status: input.status,
      notes: input.notes,
    },
  );
  return response.data;
}

/**
 * Saves an internal note on the latest knock without adding a new knock.
 */
export async function updateMapHouseNotes(input: {
  readonly houseId: number;
  readonly notes: string;
}): Promise<MapHouseDetailResponse> {
  const response = await apiClient.patch<MapHouseDetailResponse>(
    `/area-management/map-houses/${input.houseId}/notes`,
    { notes: input.notes },
  );
  return response.data;
}

/**
 * Soft-deletes a canvassing area on the API.
 */
export async function deleteMapArea(areaId: number): Promise<void> {
  await apiClient.delete(`/area-management/areas/${areaId}`);
}
