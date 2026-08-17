# Radiabase mobile — backend routes

This is the Sunnected / Radiabase API surface the Expo app uses. You do not need the NestJS repo to understand what is available.

Base URL is whatever `EXPO_PUBLIC_API_URL` is set to, and it **must include `/api`**.

| Environment | Example |
| --- | --- |
| Local API | `http://localhost:3010/api` |
| Android emulator → your Mac | `http://10.0.2.2:3010/api` |
| Phone on the same Wi‑Fi | `http://YOUR-LAN-IP:3010/api` |
| Staging | `https://sunnected-jose-1.onrender.com/api` |

Every path below is relative to that base. `POST /auth/login` means `POST {EXPO_PUBLIC_API_URL}/auth/login`.

The API is the same one the web app uses. This file only covers routes the **mobile field product** calls, plus a short list of nearby field routes that exist but the app does not use yet.

---

## How the app talks to the API

All authenticated calls go through `services/api-client.ts`.

| Header | Required | What it is |
| --- | --- | --- |
| `Authorization: Bearer {access_token}` | Yes, except login and forgot-password | JWT from `POST /auth/login` |
| `Content-Type: application/json` | Default | JSON body |
| `Content-Type: multipart/form-data` | Submit Lead only | `POST /leads` |
| `x-device-id` | Always sent | Stable id created on the phone |
| `x-platform` | Always sent | `ios` or `android` |

`x-device-id` and `x-platform` are stamped onto a new lead so web can see which device submitted it. They are not used for login.

The app does **not** use cookie refresh tokens. Native clients keep the access token in session storage. If it expires, the user logs in again.

Typical errors:

| Status | Meaning |
| --- | --- |
| `401` | Bad password or expired token. Log in again. |
| `403` | Authenticated, but this user cannot do that (system tenant, not a manager, wrong org). |
| `404` | House, area, or lead is missing or not visible to this org. |
| `400` | Validation (viewport too large, bad phone, missing fields). |
| `500` | Server bug or missing migration. Field map detail 500s if `leads.house_id` is not on that database. |

---

## Who can use the field product

The field map is for **sales-org** users only (`tenet_type = sales_org`).

| Login | What happens |
| --- | --- |
| Sales-org admin / manager / office director / setter | Works. Session must include sales org, current office, and a vertical. |
| System user (for example a Numix / platform account) | Login may succeed, then map/lead routes return empty lists or `403`. |
| Service-provider user | Not a field user. Map routes return empty. |

After a tester pulls a new build they must **log out and log in again** so `/auth/me` refreshes office and vertical.

Working local / staging tester used during development:

- Email: `jose@suntappedenergy.com`
- Local password: `password` (local DB only; staging uses whatever was set there)
- Office: Suntrappers
- Vertical: Solar

Management roles (can see every area in the org, delete turf, see org-wide dashboard counts):

| `role_id` | Name |
| --- | --- |
| 3 | Sales Org Admin |
| 4 | Sales Org Manager |
| 5 | Structure Director |
| 6 | Structure Manager |
| 12 | Office Director |
| 13 | Office Manager |

A setter without those roles only sees **areas assigned to them**. They can still tap roofs, knock, and submit leads.

---

## Product model (read this before the routes)

The map is four layers. They are not the same thing.

| Layer | What it is | Stored in Postgres? | When it costs |
| --- | --- | --- | --- |
| Satellite | `react-native-maps` | No | Already in the app |
| Turf | Drawn / assigned `areas` | Yes | Create / assign / delete |
| Roofs | Overture building footprints | No | Display only. Loaded per street viewport |
| Doors (`houses`) | A roof someone tapped, knocked, or imported | Yes | Write on first tap |
| Address | Regrid parcel on first tap, if the token is set | Cached on that `houses` row | One lookup per new unknown door |
| Lead | Homeowner submitted from that door | Yes, `leads` + optional `house_id` | Submit Lead |

Rules that matter in the field:

1. Loading pins or panning the map does **not** create houses and does **not** call Regrid.
2. A roof is not a house until someone taps it (`POST .../from-building`).
3. House lookup is `(source, external_id)`, currently `overture` + the Overture building id. Not `external_id` alone.
4. If Regrid is unset or the county is outside the sandbox, the house is still created as `Unknown Address`.
5. Knock / status does **not** look up the address again.
6. Phone GPS reverse-geocode in the Submit Lead form is **client-only**. It is not the source of truth and is not an API route.

---

## App screens → routes

| Screen | Routes |
| --- | --- |
| Login | `POST /auth/login`, then `GET /auth/me` |
| Forgot password | `POST /auth/forgot-password` |
| Home / dashboard | `GET /area-management/field-stats`, `GET /area-management/map-areas` |
| Field map | `map-areas`, `map-buildings`, `map-houses`, `from-building`, house detail / status / notes, `create-area`, `assign-area-rep`, `DELETE /areas/:id`, `GET /users` or `/users/all` |
| Convert to Lead | `GET /offices/user-offices`, `POST /leads` |
| Update Lead on the house sheet | `PATCH /leads/:id/info` |

`My location` does not call this API.

---

## Auth

### `POST /auth/login`

Public. Email + password.

```json
{ "email": "jose@suntappedenergy.com", "password": "password" }
```

```json
{ "access_token": "eyJ..." }
```

The web app also gets a `refresh_token` cookie. The mobile app ignores cookies and stores `access_token`.

### `GET /auth/me`

Bearer required. This is the session the app actually uses (name, roles, office, vertical).

Important fields:

| Field | Why the app needs it |
| --- | --- |
| `id` | Setter id on Submit Lead |
| `email`, `first_name`, `last_name` | Profile / menu |
| `tenet_type`, `tenet_id` | Must be `sales_org` |
| `roles[].role_id` | Manager vs setter (assign, delete turf, dashboard scope) |
| `sales_org_user_details.sales_org_id` | Required to create a lead |
| `sales_org_user_details.current_office` | Default office on the map and Submit Lead |
| `sales_org_user_details.offices` | Offices on the user record |
| `primary_vertical.id` | Required to create a lead |
| `allowed_verticals` | Vertical picker if more than one |

If office or vertical is missing, Submit Lead fails with a clear app error: set those in Radiabase first.

### `POST /auth/forgot-password`

Public.

```json
{ "email": "person@example.com" }
```

The API emails a **web** reset link. The phone does not complete the reset.

### Nearby auth routes the app does not use

`POST /auth/refresh-token` (cookie), `POST /auth/logout`, `POST /auth/logout-all-sessions`, `PUT /auth/change-password`, `POST /auth/reset-password`, `POST /auth/activate-account`. Those are web / invite flows.

---

## Field map — turf, roofs, doors

All of these sit under `/area-management` and need a sales-org Bearer token.

### `GET /area-management/map-areas`

Turf polygons for the current org. No house markers.

- Managers: every active area in the org.
- Setters: only areas assigned to them.
- System / non-sales-org: `[]`.

Each item:

| Field | Meaning |
| --- | --- |
| `id`, `name` | Area |
| `officeId`, `salesOrgId` | Owner |
| `coordinates` | Ring of `{ latitude, longitude }` |
| `houseCount` | Doors already linked to that turf |
| `assignee` | Active rep, or `null` if unassigned |

### `GET /area-management/map-buildings`

Overture roofs for the **visible street viewport**. Nothing is saved.

Query: `west`, `south`, `east`, `north` (numbers).

```
GET /area-management/map-buildings?west=-96.57&south=32.83&east=-96.56&north=32.84
```

The app only calls this when zoomed in (`latitudeDelta <= 0.012`). The API also rejects a bbox larger than about `0.04` degrees (`400` “zoom in to street level”).

Each item:

| Field | Meaning |
| --- | --- |
| `id` | Overture building id (GERS). This becomes `houses.external_id` on tap |
| `coordinates` | Footprint ring |
| `roofLat`, `roofLng` | Pin / tap point |
| `buildingClass` | Overture class. Garages, sheds, carports are dropped |

Caps: zoom 14 tiles, max 16 tiles, max 600 buildings, footprints under ~50 m² dropped. If Overture tiles fail: `503` “Building footprints are temporarily unavailable”.

### `GET /area-management/map-houses`

Doors that already exist (tapped, knocked, or imported). Optional filters:

| Query | Meaning |
| --- | --- |
| `areaIds` | Comma-separated turf ids |
| `west`, `south`, `east`, `north` | Viewport. Needed so roam-outside-turf still shows tapped doors |
| `updatedSince` | ISO timestamp delta. App does not send this yet |

Each item: `id`, `areaId`, lat/lng, address fields, `currentStatus`, `notes`, `leadId`, `externalId`, `source`.

Without area ids **and** without a bbox, the API returns `[]`.

### `POST /area-management/map-houses/from-building`

Tap a roof. Find or create the `houses` row, attach it to the org (and turf if the roof sits in one), then return the house sheet.

```json
{
  "overtureBuildingId": "08b2a8...",
  "roofLat": 32.834967,
  "roofLng": -96.563861,
  "areaId": 12
}
```

`areaId` is optional. If omitted, the API still links the house to the sales org / current office and will attach turf when the point falls inside one.

Then, **only if address is still unknown**, the API calls Regrid once and writes street / city / state / ZIP onto that house.

Response is the same house-sheet object as `GET /map-houses/:id`:

| Field | Meaning |
| --- | --- |
| `id` | `houses.id` |
| `address`, `city`, `state`, `zip` | Regrid if it hit; otherwise `Unknown Address` |
| `currentStatus`, `notes` | Latest knock |
| `leadId` | Linked lead, or `null` |
| `lead` | `{ id, firstName, lastName, phone, email, status }` or `null` |
| `knockHistory` | Oldest → newest knocks |

Same roof tapped twice returns the **same house**. It does not create a duplicate and does not call Regrid again if the address is already known.

`403` if the user is not a sales-org user.

### `GET /area-management/map-houses/:id`

House sheet only. No Regrid. `404` if the house is not in this org.

### `POST /area-management/map-houses/:id/status`

Append a knock. Does not change the address.

```json
{ "status": "interested", "notes": "Came to the door" }
```

Allowed `status` values:

| API value | App button |
| --- | --- |
| `interested` | New / Go Back |
| `not_interested` | Not Interested |
| `not_home` | Not Home |
| `custom` | Call Back |
| `knocked` | Allowed by API; app maps New onto `interested` |

Returns the updated house sheet.

### `PATCH /area-management/map-houses/:id/notes`

```json
{ "notes": "Dog in yard" }
```

Updates the **latest** knock note. Does not add a knock. Returns the house sheet.

### `GET /area-management/field-stats`

Dashboard tiles: today / week / month.

```json
{
  "today": { "leads": 2, "knocks": 11, "customers": 0 },
  "week": { "leads": 8, "knocks": 40, "customers": 1 },
  "month": { "leads": 20, "knocks": 90, "customers": 3 }
}
```

| Count | What it is |
| --- | --- |
| `leads` | Leads created in the period |
| `knocks` | Rows in `house_statuses` |
| `customers` | Leads with `lead_status = sold` or converted to a deal |

Setters see **their** counts (`setter_id` / `rep_id`). Managers see the **org**.

### `POST /area-management/create-area`

Draw turf. The app always sends `auto_discover_houses: false` so creating a polygon does **not** dump OSM buildings into `houses`.

```json
{
  "name": "North block",
  "office_id": 3,
  "sales_org_id": 1,
  "boundary": {
    "type": "Polygon",
    "coordinates": [[[-96.57, 32.83], [-96.56, 32.83], [-96.56, 32.84], [-96.57, 32.84], [-96.57, 32.83]]]
  },
  "auto_discover_houses": false
}
```

GeoJSON rings are `[lng, lat]`. Roofs still come from Overture after save.

### `POST /area-management/assign-area-rep`

```json
{ "area_id": 12, "rep_id": 79 }
```

Rep list comes from `GET /users` or `GET /users/all`.

### `DELETE /area-management/areas/:id`

Soft-delete turf and end active assignments. **Managers only** (`403` for setters). Houses are not deleted.

---

## Leads

Same create path as web Submit Lead. The app adds `house_id` so the door and the lead stay linked.

### `POST /leads`

`multipart/form-data` with one field named `data` (JSON string). Optional `files` are supported by the API; the app does not send files yet.

The JSON inside `data`:

| Field | Required | Notes |
| --- | --- | --- |
| `first_name`, `last_name` | Yes | 2–50 characters |
| `phone_number` | No | 10 US digits after formatting |
| `email` | No | |
| `address_line1`, `city`, `state`, `zip_code` | Yes | Prefills from the house / Regrid |
| `address_line2` | No | |
| `sales_org_id` | Yes | From `/auth/me` |
| `vertical_id` | Yes | From `/auth/me` |
| `setter_id` | Yes | Logged-in user |
| `office_id` | If assigned to an office | Omit when internal |
| `is_internal` | Yes | `true` = keep in-house, no office |
| `creation_method` | App sends `sales_rep_submit` | Same as web |
| `location` | App sends roof `{ lat, lng }` | |
| `house_id` | App sends the tapped house | Needs `leads.house_id` on that database |
| `appt_date` | No | ISO string, or omit for immediate |
| `notes` | No | “About” |
| `office_questionnaire` | No | Office questions + answers |

`201` body includes `{ "id": 4270, ... }`. The app only needs `id`. After success the house sheet shows `Lead #id`.

Device headers are stored on create (`x-device-id`, `x-platform`, user agent, IP).

### `PATCH /leads/:id/info`

House sheet “Update Lead”. Contact fields only. JSON.

```json
{
  "first_name": "Maria",
  "last_name": "Lopez",
  "phone_number": "2145550100",
  "email": "maria@example.com"
}
```

Also accepts address fields (`address_line1`, `city`, `state`, `zip_code`). The app currently sends name / phone / email. At least one field is required. Phone must be 10 digits.

### Nearby lead routes the app does not use

`GET /leads`, `GET /leads/:id`, `GET /leads/:id/extras`, notes, files, `PATCH /leads/:id/status`, `PATCH /leads/:id/closer`, `PATCH /leads/:id/office`. Those are the web lead inbox.

---

## Offices and people

### `GET /offices/user-offices`

Offices the signed-in user can submit a lead to, plus each office questionnaire.

```json
{
  "offices": [
    {
      "id": 3,
      "name": "Suntrappers",
      "is_questionnaire_enabled": true,
      "questionnaire": {
        "questions": [
          {
            "id": 1,
            "type": "select",
            "label": "Utility",
            "required": true,
            "options": [{ "label": "Oncor", "value": "oncor" }]
          }
        ]
      }
    }
  ]
}
```

Used only by Convert to Lead. Assign-to-office vs Internal is an app toggle (`is_internal` / `office_id` on `POST /leads`).

### `GET /users/all`

Office roster for **Assign area**. App sends `office_id`, `view_type=sales_org`, optional `search`. Returns an array. App keeps `status === active`.

### `GET /users`

Org-wide assignee search when the picker is set to all offices. App sends `page=1`, `limit=100`, `view_type=sales_org`, optional `search`. Body may be a paginated `{ data, total_count }` or an array.

User rows the app reads: `id`, `full_name` / `first_name` / `last_name`, `email`, `phone`, `office_name`, `sales_role`, `structure_name`, `status`, `avatar_url`.

---

## Addresses (Regrid) — not a public route

There is no `GET /regrid` for the app. Regrid runs **inside** `POST /area-management/map-houses/from-building` on the API.

| API env var | Where | What |
| --- | --- | --- |
| `REGRID_API_TOKEN` | Nest API only, never the Expo app | Sandbox or Self-Serve JWT |
| `REGRID_API_URL` | Optional | Defaults to Regrid’s point API |

If the token is missing, tap still works; address stays `Unknown Address`.

Sandbox (current tester token):

- About 30 days and 2,000 records.
- Only a handful of sample counties, **not nationwide**.
- Dallas County works. Example roof `32.834967, -96.563861` → `5818 DIANA DR`, Garland, TX.
- Fort Lauderdale, Miami, Cincinnati, Chicago, and most other cities return 0 parcels (HTTP 200, empty). The house is still created.

Nationwide addresses need a paid Regrid Self-Serve plan, not a code change.

Confirmed locally with the token on the **local** API: Dallas tap created house `29` with that street; a Florida tap created house `30` as `Unknown Address`.

---

## Routes that exist but this app does not call

These are on the same API. Useful so testers know they are **not** missing a mobile screen.

### Field / houses (legacy web + OSM)

| Method | Path | Why it is unused |
| --- | --- | --- |
| `GET /area-management` | Old house list | Field map uses `map-houses` |
| `GET /area-management/:id` | Old house by id | Field map uses `map-houses/:id` |
| `POST /area-management` | Manual house create | Roofs come from Overture |
| `PATCH /area-management/:id` | Edit house | Address is Regrid-on-tap |
| `DELETE /area-management/:id` | Remove house | Not in the app |
| `POST /area-management/search/nearby` | Radius search | Not in the app |
| `POST /area-management/search/boundary` | Houses in a polygon | Not in the app |
| `POST /area-management/preview-osm-houses` | OSM preview | Replaced by Overture roofs |
| `POST /area-management/areas/:id/houses` | Attach existing houses to turf | Tap-to-create does this |
| `POST /area-management/fix-*` | Admin address cleanup | Web / admin only |

The app still has leftover Overpass (`overpass-api.de`) helpers. The field map does **not** use them for roofs.

### Rest of Sunnected (web)

Deals, pay, Airtable, reporting, campaigns, compliance, onboarding, structures CRUD, office settings, impersonation, and similar modules are live on the API and **out of scope** for this app. Building a deals or pay screen would be new mobile work, not a hidden field-map route.

---

## Staging checklist (API, not this repo)

Testers do not need `sunnected_jose`. Staging must already have:

1. API deployed from branch `feat/expo-canvassing` (field-map routes live there, not necessarily on API `main`). Host: `https://sunnected-jose-1.onrender.com`.
2. `EXPO_PUBLIC_API_URL=https://sunnected-jose-1.onrender.com/api`.
3. A sales-org login (not a system user).
4. Migration `drizzle/0018_leads_house_id.sql` applied (`leads.house_id`). Without it, tapping a roof 500s when the API loads the house sheet, and Submit Lead cannot link the door.
5. `REGRID_API_TOKEN` set on the **Nest service** (Render env), then a restart / redeploy. Setting it only in a local `.env` does nothing for testers.
6. After any API deploy: log out and log in on the phone.

Do not share `.env.staging`, database URLs, or cloud keys. Native apps send no CORS origin; staging already accepts them.

---

## Quick curl (local)

Local API: `http://localhost:3010/api`. Local DB passwords are `password`.

```bash
TOKEN=$(curl -s -X POST http://localhost:3010/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"jose@suntappedenergy.com","password":"password"}' \
  | jq -r '.access_token')

curl -s http://localhost:3010/api/auth/me \
  -H "Authorization: Bearer $TOKEN" | jq '{id, email, tenet_type, office: .sales_org_user_details.current_office, vertical: .primary_vertical}'

curl -s "http://localhost:3010/api/area-management/map-buildings?west=-96.57&south=32.83&east=-96.56&north=32.84" \
  -H "Authorization: Bearer $TOKEN" | jq 'length'

curl -s -X POST http://localhost:3010/api/area-management/map-houses/from-building \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"overtureBuildingId":"docs-dallas-example","roofLat":32.834967,"roofLng":-96.563861}' \
  | jq '{id, address, city, state, zip, leadId}'
```

A healthy Dallas tap looks like `{ "id": 29, "address": "5818 DIANA DR", "city": "GARLAND", "state": "TX", "zip": "75043-6627", "leadId": null }`.
`{ "id": null, "address": null }` is a failed JSON body (usually `401` / `403` / `500`), not a missing address.
