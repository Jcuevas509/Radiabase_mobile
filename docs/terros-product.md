# Terros — product deep dive

What the Terros field app actually is, what it does well, and where Radiabase already matches or lags. Written 3 September 2026 from [terros.com](https://www.terros.com/), [help.terros.com](https://help.terros.com/), [docs.terros.com](https://docs.terros.com/), App Store / Play listings, Play reviews, the live `app.terros.com` Area Management SPA, and our earlier notes in [terros-tech-stack.md](./terros-tech-stack.md) and [terros-heatmap.md](./terros-heatmap.md).

This is a **product** read. iOS sunroof rendering is **not** proven from the browser; see [What we have not seen](#what-we-have-not-seen).

## In one sentence

Terros is a **field-ops OS for door-to-door** (solar, fiber, roofing, windows, insurance, pest): every door on a live map, turf assignment, knock → workflow action → closer appointment, plus leaderboards, AI pitch grading, and a CRM API. Marketing line: *you don’t need 100 more reps, you need 5 great managers.*

Company: Terros, Inc., Irvine CA. App: iOS ([id6444381162](https://apps.apple.com/us/app/terros/id6444381162), Swift rewrite) and Android (`com.tantalim.mobile`). Web: `app.terros.com` for managers. Canvass / Pro / Max is **mobile-only**.

## Who it is for

| Buyer | Job Terros sells |
| --- | --- |
| Field rep | Knock the right doors, log the knock in one tap, book a closer, stay offline |
| Manager | See who is working, fill turf pin by pin, coach from tape the same day |
| Company admin | Workflows, permissions, CRM sync, Sunrun-style calendar / Okta extras |

Verticals they name on the homepage: fiber, solar, roofing, windows, insurance, pest. Solar-specific pitch: *3D map to check trees, pitch and shading*; permits / energy / owners on the pin; bankrupt-installer re-pitch lists.

## What the app is (surfaces)

### Mobile (the product)

Typical day lives here. Help-center tabs:

| Surface | What it does |
| --- | --- |
| **Home** | Tasks, dashboard, Toolbox |
| **Canvass** | The map. Every property pin, filters, Pro/Max markers, knock / action, appointments |
| **Calendar** | Personal comebacks vs closer calendar; Google Calendar sync; Sunrun variant |
| **Stats** | Live KPIs, categories explained in help |
| **Menu** | Profile, Skill (pitch record / AI grade) |
| **Toolbox** | Role-aware: my accounts, 1:1s, shadows, quarterly plans, meeting attendance, skill insights, team view-as |

Canvass settings include **Map Options** (satellite vs standard), **Stored locations** (offline sectors: “X / Y sectors”), and add-missing-property (markers cannot be removed once added).

### Web (the manager console)

Not a canvass clone. Area Management is List / Map / Areas. Also: account management, workflows, competitions, reports, settings (dispositions or workflows, custom fields, scorecards, API keys, webhooks, integration marketplace). Canvass Pro filters **do not** appear on web.

## The field loop (what “good” feels like)

1. Manager draws a polygon, assigns user or team, optional filters and scheduled assign/unassign. Server cleans self-intersecting geometry. Assignment is **async** (`preparing` → `queued` → `running` → `completed`). New accounts in the polygon auto-assign.
2. Rep opens Canvass. Pins for the turf are already there (downloaded in **sectors** for offline).
3. Tap a pin → property sheet. Either a **disposition** (legacy) or a **workflow action** (current). Only legal next actions show. Checkpoints (“Is this a Qualified Lead?”), required fields, optional device-location / geofence.
4. Action **creates** the account if the pin had none, moves stage, writes history with who / when / where.
5. If the action says “schedule,” pick **Personal Comeback** (auto event) or **Closer Calendar** (available slots, green/red). Event title/location/account filled from the pin.
6. Pin color/icon updates immediately. CRM (Salesforce, JobNimbus, HubSpot via custom webhook) is **queued**.
7. Tags log activity **without** changing stage.
8. Multi-door / multi-contact: pie-chart cluster, count = filtered accounts, business dropdown in the sheet.

That loop is the product. Everything else (Pro data, competitions, AI pitch) hangs off it.

## What they do well

### 1. Every door is already a pin

This is the gap reps feel vs Radiabase. Terros treats the neighborhood as a **preloaded property graph**. You do not tap a roof to invent a house. You tap a pin that was already there, including blanks you have never knocked.

Offline: download **sectors**, work without signal, clear cache later; dispositions stay on the server. Marketing: *offline included*.

Radiabase today: Apple hybrid + Overture footprints at street zoom + house row on tap. Unworked roofs stay clean satellite. We look emptier; they look “full.”

### 2. Map performance (web proven; iOS inferred)

On **web** Area Management we proved (see [terros-heatmap.md](./terros-heatmap.md)):

- **Heatmap** = cheap **circle pins** (deck.gl scatterplot, pixel radius 5 / 8 / 14 by zoom), not a solar tint.
- **Detailed** = icon pins + supercluster.
- API returns **`pin` vs `grid`** so city zoom is aggregates, not 50k points.
- Viewport bbox only.
- Google Maps + deck.gl overlay.

iOS was rewritten in **Swift on Google Maps** after a cross-platform ceiling. Same *bargain* (cheap dots + clustering + viewport + grid) is the likely reason the phone feels fast. Not proven in a binary.

### 3. Solar-specific intel on the pin (product, not the heatmap)

Homepage and Canvass Pro/Max:

| Layer | What it is |
| --- | --- |
| Free filters | Owner/renter, year built, sqft |
| Pro | Pools, upgrade permits, solar permits, last sold, resident age / credit bands, new roof, new move-in, high energy-use permits |
| Max | Canceled solar permits, bankrupt installers, bankrupt financiers, solar financing |
| Map treatment | **C icon** = matched Pro home; **yellow ring** = passed standard filters only. Pro *adds* markers; it does not hide the block |
| Marketing solar | “3D map to check trees, pitch and shading” — this is the **Sunroof-style overlay**, separate from heatmap and from Pro icons |

Pro/Max is an IAP (Play: Pro ~$30/mo, Max ~$50/mo). Needs network. Permit data is municipal and incomplete; they say so.

**Heatmap ≠ Sunroof.** Heatmap = faster status dots. Sunroof-style = per-roof shade/pitch/flux. We have not captured the iOS overlay. Closest public analog is [Google Solar API](https://developers.google.com/maps/documentation/solar/overview) `dataLayers` annual flux on Google Maps.

### 4. Workflows that force clean data

They migrated off “change the status” to **actions**:

- Stage + action + conditions + checkpoints + required fields
- Location on the action (geofence / on-site verification before event outcomes)
- Wait times between actions
- Full history; undo last action
- Tags vs actions
- Reporting columns tied to stages/actions

This is why managers trust the board: the knock cannot skip the form.

### 5. Closer scheduling from the door

Comeback vs closer, availability from calendar + rules, auto-filled event, Google Calendar (Sunrun has a special sync). On-site verification before outcome. That is a real solar setter/closer motion, not a generic “add to calendar.”

### 6. Manager visibility and games

Live activity, day timeline (knocks, hours, gaps), competitions (brackets / ladders / raffles), streaks, leaderboards, 1:1s, shadows, quarterly plans, meeting attendance, startup questions, programs/onboarding, **AI pitch record + scorecard + same-day coaching**. They sell **retention of managers**, not more reps.

### 7. Integration as a product

Public `api.terros.com` (ApiKey, POST RPC), webhooks, Zapier, marketplace, import/export, Salesforce / HubSpot / Enerflo / JobNimbus. Team/company SKU. Sunrun: Okta users + workflow launcher fields.

## What they do poorly (or only “fine”)

- **Android still hurts.** Play reviews: sticky taps, un-dismissable territory popovers, slow address prompts, solar layer broken. Package is still `com.tantalim.mobile` after the iOS Swift rewrite — two-class map.
- **Google imagery is stale** (help: 1–3 years). New builds vanish in satellite; they tell you to switch to standard. They do not own tiles.
- **Pins are wrong sometimes.** They file bulk tickets to an unnamed property vendor. Distance bugs when you are standing on the house.
- **Add-property is one-way.** Missing marker can be added; cannot be removed.
- **Canvass is mobile-only.** Managers draw turf on web; they do not knock on web.
- **HubSpot is not self-serve.** Custom webhook, they configure it.
- **Phone numbers are not provided.** Rep types them.
- **Pro data is incomplete** (permits). Too many Pro markers and the map clogs (their own FAQ).
- **Web heatmap is not the iOS sunroof.** Do not copy the SPA and expect the 3D shade map.

## Maps — keep these three layers distinct

| Name | What it is | Where proven |
| --- | --- | --- |
| **Satellite / standard** | Google basemap | Help + web SPA |
| **Heatmap vs detailed** | Circle pins vs clustered icons | Web SPA 100% |
| **Canvass Pro markers** | C icon / yellow ring on filtered homes | Help (mobile) |
| **Sunroof-style overlay** | Trees, pitch, shading on the roof | Marketing + Android 🔆 reviews; **not** in web JS |

Radiabase today: Apple hybrid, Overture roofs, status badges on worked doors, no Pro filters, no flux overlay, no sector offline pack.

## Where Radiabase already is vs Terros

| Job | Terros | Radiabase `dev` |
| --- | --- | --- |
| Basemap | Google (mobile + web) | Apple hybrid (`react-native-maps`) |
| Every door | Preloaded pins + offline sectors | Roofs on pan; house on tap |
| Knock UX | Action tiles, checkpoints, required fields | Submit Lead / house sheet |
| Turf | Draw, assign, async, filters, schedule | Draw + assign in Field Map / manager |
| Appointments | Comeback vs closer calendar | Lead appointment picker |
| Manager web | Full SPA + API | Manager screens in-app; Nest API |
| Competitions / podium | First-class | In-app competitions |
| Property intel | Pro/Max IAP | Regrid on tap; no permit/credit layer |
| Solar flux overlay | Marketed on iOS | Out of scope until roofs work ([field-map-roofs.md](./plans/field-map-roofs.md)) |
| Offline canvass | Sector downloads | Online-first |
| Public CRM API | Yes | Internal API only |

## What to steal (priority)

1. **Every-door pins in the assigned turf** — even if the “pin” is an Overture centroid. Empty turf is the #1 feel gap.
2. **Two render modes** — cheap circles when zoomed out; icons only at street zoom. Same `pin` / `grid` API idea.
3. **Knock = one legal action**, not a free-form status edit. We already have questionnaires; Terros is stricter about stage gates.
4. **Closer vs comeback** as two explicit paths from the house sheet.
5. **Sunroof overlay later** — Google Solar API flux on the viewport, not a Terros clone. Confirm with iOS screenshots first (off / on / selected house / zoomed out / Map Options label).

Do **not** steal: Android-quality map, unnamed parcel vendor without a license, IAP Pro as the first bet, or deck.gl inside Expo.

## What we have not seen

- iOS sunroof / 🔆 layer on a device (need screenshots from your login).
- Authenticated map XHR at zoom 21.
- The named property-data vendor.
- Whether Android solar layer is the same as iOS 3D shade.

Until those shots exist, treat “their sunroof is good” as **user + marketing**, and treat **heatmap** as the thing we fully reverse-engineered on web.
