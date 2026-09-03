# Terros tech stack (competitor research)

Researched 3 September 2026 from public docs, help center, store listings, and the live `app.terros.com` Area Management SPA (HTML, network asset list, and JS bundles). The logged-in Cursor browser tab could not be attached, so live authenticated XHR payloads (`/area/list`, account-map fetches) were not captured.

Inspected URL (heatmap, zoom 21, Santa Fe / Albuquerque area):

`https://app.terros.com/areaManagement?viewCenter=…&mapZoom=21&pinRenderMode=heatmap`

## Maps — the main difference vs Radiabase

Terros Area Management is a **Google Maps** web app. Radiabase field map is **Apple Maps** via `react-native-maps` (`mapType="hybrid"`).

| Layer | Terros | Radiabase (`dev`) |
| --- | --- | --- |
| Base map | Google Maps JavaScript API via `@vis.gl/react-google-maps` (`APIProvider`, `GoogleMap`, `useMap`) | Apple Maps hybrid via `react-native-maps` 1.27.2 |
| Imagery owner | Google (help center: typically 1–3 year satellite refresh) | Apple |
| Map types | Native Google control: `roadmap`, `satellite`, `hybrid`, `terrain`. Street view off, fullscreen off, `minZoom: 5` | Hybrid only in Field Map |
| Pins / heatmap | URL `pinRenderMode`. **Detailed** = icon pins + clustering. **Heatmap** = faster circle pins | Custom house decals at street zoom; no heatmap |
| GPU overlay | **deck.gl** on Google (`deck-gl-google-maps-container`, Scatterplot, GeoJSON, SolidPolygon, Text) | React Native overlays / decals, not deck.gl |
| Clustering | **supercluster** (`useAccountClusterIndex`, cluster icons, company-logo markers) | None at web scale |
| Draw turf | **terra-draw** Google adapter (`terra-draw-google-maps`) — Draw Area, undo/redo, polygon cleanup | Custom stroke / polygon on MapKit |
| Pin color | Account Stage, Assigned Team, Assigned User, Last Action/Contact Age, Last Action/Disposition. Stage can show company logo | House status badges / area colors |
| Every-door data | Preloaded accounts on the map | Overture roof footprints on tap; Regrid address; Apple reverse-geocode fallback |
| Directions out of app | Apple Maps or Google Maps | Apple Maps walking URL on iOS; Google elsewhere |
| Web area management | Full SPA at `app.terros.com/areaManagement` | In-app Field Map + manager screens |

Help center confirms mobile satellite/standard views are Google. Canvass Pro / Max (permits, pools, bankrupt installers) is **mobile-only**.

URL state persisted on Area Management: `viewCenter`, `mapZoom`, `pinRenderMode`, `pinColorMode`.

## Web app

Live assets at `app.terros.com` show a Vite React SPA.

| Piece | Evidence |
| --- | --- |
| Bundler | Vite hashed chunks (`/assets/index-*.js`) |
| Router | TanStack Router file routes: `/areaManagement`, `/manageAccounts`, `/calendar`, `/stats/map`, settings, integrations |
| UI | Mantine (`@mantine/core`, dates, charts, form, color scheme) plus `tailwind-merge` |
| Fonts | Sora + Material Symbols Rounded (Google Fonts) |
| Tables | Custom `TDataTable` |
| Charts | Recharts (AreaChart, LineChart, Donut) |
| Feature flags | ManagerDashboard, Workflows, Calendar stack, Team hierarchy, Connect, Sunrun launcher fields |
| Training | Quiz / Program pages |
| Sunrun extras | `sunrun_.oktaUsers`, `Feature:WorkflowLauncherSunrunFields` |

Auth, observability, support:

- **Auth0** (`auth0-react`)
- **Sentry** (release id baked into every chunk)
- **Intercom** widget

## Public API and integrations

- Host: `https://api.terros.com`
- JSON, almost all **POST** (`/area/add`, `/account/upsert`, `/user/get`, …)
- Auth header: `Authorization: ApiKey YOUR_API_KEY`
- Docs: Docusaurus at [docs.terros.com](https://docs.terros.com/docs/openapi/terros-api)
- Status: [status.terros.com](https://status.terros.com) (mobile, web, API, docs, help)

Resources:

- Account (add, batch, bulk modify, get, list, match, upsert, webhooks)
- Area (get, list, add, update, remove, async assign)
- Calendar (events, closer timeslots, upsert, webhooks)
- Team (CRUD, members, downline, webhooks)
- User, Task, Workflow, Custom Field, Permission, Report

Area assignment is async: `preparing` → `queued` → `running` → `completed`. Polygon geometries are cleaned on save.

Integrations:

- Outbound webhooks: account, user, team, calendar, task
- First-party integration marketplace + developer scripts + import/export
- Zapier
- HubSpot: custom webhook configured by Terros, not self-serve
- Salesforce / JobNimbus mentioned as queued CRM sync

## Mobile apps

- iOS rewritten in **Swift** after they hit a ceiling on a cross-platform codebase (Grandon Brimley, July 2026)
- Android package still `com.tantalim.mobile` (legacy Tantalim shell)
- Store: [App Store](https://apps.apple.com/us/app/terros/id6444381162), [Play](https://play.google.com/store/apps/details?id=com.tantalim.mobile) (`com.tantalim.mobile`, ~v0.78.0)
- Canvass / Pro / Max is mobile-only
- Play reviews mention a solar / Project Sunroof-style layer on Android
- Company: Terros, Inc., Irvine CA (not Terros Health, not terros.io)

Property data: unnamed third-party feed. Incorrect pin locations are filed back to the vendor. Permit data comes from municipalities / public records.

## Product surfaces (from web route chunks)

Settings: workflow, webhook, tile, status, scorecard, role, ratios, permissions, outcome, links, disposition, custom field, configuration, company, API key.

Also: hustle, calendar / closer availability, stats map, account bulk actions, team hierarchy, user trash, beta users, short reports, companies (multi-company admin).

## What we did not capture

- Authenticated `/area/list` and account-map XHR bodies at zoom 21
- The named property-data vendor behind Canvass pins
- Whether Android still embeds a Tantalim WebView or is a separate native shell
- Exact Google Map ID / vector-map styling beyond `mapId` being present

Reconnect the Cursor browser on the logged-in Area Management tab to inspect those live API calls.
