# Starter guide

This is the Expo field app. Testers do **not** need the NestJS repo or a local database.

## Docs in this folder

| File | What it is |
| --- | --- |
| [starter-guide.md](./starter-guide.md) | Run the app and walk the field flow |
| [backend-routes.md](./backend-routes.md) | Every API route this app uses |
| [plans/field-map-roofs.md](./plans/field-map-roofs.md) | Product plan: satellite → turf → roofs → tap → lead |
| [request-api-change.md](./request-api-change.md) | Ask for a new route or filter without the Nest repo |

## What you need

1. Node 20+ and npm (or Yarn).
2. [Expo Go](https://expo.dev/go) on a phone, or Xcode / Android Studio for a simulator.
3. A **sales-org** login (not a system / Numix platform account).
4. `EXPO_PUBLIC_API_URL` pointing at staging or your laptop API. It **must end in `/api`**.

Do not use production. Do not ask anyone for `.env.staging`, database URLs, AWS keys, or the Regrid token.

## Point the app at an API

Copy `.env.example` to `.env` in this repo.

**Staging (testers)**

```bash
EXPO_PUBLIC_API_URL=https://sunnected-jose-1.onrender.com/api
```

That host is the staging Nest API. The `/api` suffix is required.

**Local API on this machine**

| Client | URL |
| --- | --- |
| iOS simulator | `http://localhost:3010/api` (default if env is unset) |
| Android emulator | `http://10.0.2.2:3010/api` |
| Physical phone on the same Wi‑Fi | `http://YOUR-LAN-IP:3010/api` |

Restart Expo after changing env. After a new build or API deploy, **log out and log in again** so office and vertical refresh.

## Run it

```bash
npm install
npm start
```

Scan the QR code with Expo Go, or press `i` / `a` for a simulator.

`npm run start:go` starts Expo Go on the LAN if the default Metro port is busy.

## Log in

Use a **sales-org** user that has a current office and a vertical (Solar).

| Environment | Password |
| --- | --- |
| Local API | `password` for every user |
| Staging | Whatever the tester account was given. Do not assume `password`. |

Account used in development: `jose@suntappedenergy.com` (Suntrappers / Solar).  
`jose@numix.dev` is a system user and will get empty maps or `403`.

Forgot password emails a **web** reset link. The phone does not finish the reset.

## Walk the field flow

1. **Home** — today / week / month leads, knocks, and customers.
2. **Field map** — zoom to a real street. Roof outlines load from Overture. Panning does not save anything.
3. **Tap a roof** — creates a door (`houses`) and opens the house sheet. Same roof twice returns the same door.
4. **Address** — Regrid runs once on first tap if the API has a token. Sandbox only covers a few sample counties. **Dallas works** (try near `32.834967, -96.563861` → `5818 DIANA DR`). Fort Lauderdale and most other cities stay `Unknown Address` until Regrid is upgraded off sandbox.
5. **Knock** — New, Not Interested, Not Home, Go Back, Call Back. Notes edit the latest knock; they do not add a knock.
6. **Convert to Lead** — full Submit Lead form (same as web): name, phone, email, address, office vs internal, appointment, office questionnaire. Back returns to the house. **Update Lead** patches contact only.
7. **Draw turf / assign / delete** — managers can create polygons, assign a rep, and delete turf. Creating turf does **not** import OSM houses. Setters only see areas assigned to them.

## If something looks broken

| What you see | Likely cause |
| --- | --- |
| Cannot reach the API | Wrong `EXPO_PUBLIC_API_URL`, or it is missing `/api` |
| Login works, map is empty / 403 | System user, or session missing sales org / office / vertical. Log out and in. |
| Roofs never appear | Zoom in further. Viewport must be street level. |
| Tap returns all-null / 500 | Staging is missing `leads.house_id` (migration `0018`). |
| Every door is `Unknown Address` | No Regrid token on the **API**, or you are outside sandbox counties, or the Regrid parser fix is not deployed yet. |
| Lead submits but house stays unlinked | Same missing `house_id` column. |

Full route list and curl examples: [backend-routes.md](./backend-routes.md).
