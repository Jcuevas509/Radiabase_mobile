import { apiClient } from 'services/api-client';
import { pickAssigneeColor } from 'utils/pick-assignee-color';

export type AssigneeOption = {
  readonly id: number;
  readonly name: string;
  readonly lastname: string;
  readonly email: string;
  readonly phone: string | null;
  readonly description: string;
  readonly color: string;
  readonly officeName: string | null;
  readonly salesRole: string | null;
  readonly structureName: string | null;
  readonly status: string | null;
  readonly avatarUrl: string | null;
};

export type FetchAssigneeOptionsInput = {
  readonly officeId?: number | null;
  readonly search?: string;
  readonly scope?: 'office' | 'all';
};

type ApiUserListItem = {
  readonly id: number;
  readonly full_name?: string;
  readonly first_name?: string;
  readonly last_name?: string;
  readonly email?: string;
  readonly phone?: string | null;
  readonly office_name?: string | null;
  readonly sales_role?: string | null;
  readonly structure_name?: string | null;
  readonly status?: string | null;
  readonly avatar_url?: string | null;
};

type PaginatedUsers = {
  readonly data?: ApiUserListItem[];
  readonly total_count?: number;
};

const ALL_OFFICES_PAGE_SIZE = 100;
const SALES_ORG_VIEW = 'sales_org';

function mapApiUserToAssignee(user: ApiUserListItem): AssigneeOption {
  const [firstName, ...rest] = (user.full_name ?? '').split(' ');
  const email = user.email ?? '';
  return {
    id: user.id,
    name: user.first_name ?? firstName ?? '',
    lastname: user.last_name ?? rest.join(' '),
    email,
    phone: user.phone ?? null,
    description: email || 'Team member',
    color: pickAssigneeColor(user.id),
    officeName: user.office_name ?? null,
    salesRole: user.sales_role ?? null,
    structureName: user.structure_name ?? null,
    status: user.status ?? null,
    avatarUrl: user.avatar_url ?? null,
  };
}

function isActiveRep(user: ApiUserListItem): boolean {
  return (user.status ?? 'active') === 'active';
}

/**
 * Matches assign-list search against name, office, role, and structure.
 */
export function matchesAssigneeSearch(person: AssigneeOption, query: string): boolean {
  const needle = query.trim().toLowerCase();
  if (!needle) {
    return true;
  }
  const haystack = [
    person.name,
    person.lastname,
    person.officeName,
    person.salesRole,
    person.structureName,
  ]
    .filter(Boolean)
    .join(' ')
    .toLowerCase();
  return haystack.includes(needle);
}

function extractUserRows(payload: PaginatedUsers | ApiUserListItem[]): ApiUserListItem[] {
  if (Array.isArray(payload)) {
    return payload;
  }
  return payload.data ?? [];
}

/**
 * Loads users for area assignment. Defaults to the current office roster.
 */
export async function fetchAssigneeOptions(
  input: FetchAssigneeOptionsInput = {},
): Promise<{ people: AssigneeOption[]; totalCount: number; isTruncated: boolean }> {
  const search = input.search?.trim() || undefined;
  const shouldLoadOfficeRoster = input.scope !== 'all' && Boolean(input.officeId);
  if (shouldLoadOfficeRoster) {
    const response = await apiClient.get<ApiUserListItem[]>('/users/all', {
      params: {
        office_id: input.officeId,
        view_type: SALES_ORG_VIEW,
        search,
      },
    });
    const rows = extractUserRows(response.data).filter(isActiveRep);
    return {
      people: rows.map(mapApiUserToAssignee),
      totalCount: rows.length,
      isTruncated: false,
    };
  }
  const response = await apiClient.get<PaginatedUsers | ApiUserListItem[]>('/users', {
    params: {
      page: 1,
      limit: ALL_OFFICES_PAGE_SIZE,
      view_type: SALES_ORG_VIEW,
      search,
    },
  });
  const fetchedRows = extractUserRows(response.data);
  const rows = fetchedRows.filter(isActiveRep);
  const apiTotal = Array.isArray(response.data)
    ? fetchedRows.length
    : response.data.total_count ?? fetchedRows.length;
  return {
    people: rows.map(mapApiUserToAssignee),
    totalCount: rows.length,
    isTruncated: apiTotal > fetchedRows.length,
  };
}
