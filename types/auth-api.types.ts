export type LoginResponse = {
  readonly access_token: string;
};

export type ApiUserRole = {
  readonly role_id?: number | null;
};

export type ApiMeResponse = {
  readonly id: number;
  readonly email: string;
  readonly first_name?: string | null;
  readonly last_name?: string | null;
  readonly full_name?: string | null;
  readonly tenet_id?: number | null;
  readonly roles?: ApiUserRole[];
  readonly primary_vertical?: { id: number; name?: string } | null;
  readonly allowed_verticals?: Array<{ id: number; name?: string }>;
  readonly sales_org_user_details?: {
    sales_org_id?: number | null;
    sales_role?: string | null;
    structure?: { id: number; name?: string } | null;
    current_structure?: { id: number; name?: string } | null;
    current_office?: { id: number; name?: string } | null;
    offices?: Array<{ id: number; name?: string }>;
  } | null;
};
