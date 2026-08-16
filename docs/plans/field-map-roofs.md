# Field map roofs (Overture)

Do not rebuild the map stack. Do not buy property intel first.

**Existing satellite + turf → Overture footprints → tap roof → create/cache `houses` → enrich later.**

Repos stay separate: this file is the app plan. API work lives in `sunnected_jose` at `docs/plans/field-map-roofs.md`.

## Why

The field map already draws turf and markers. Markers only exist when OSM discovery wrote rows into `houses` via `house_area`. That path skips `building=yes`, so turf looks empty. Roam has no roofs at all.

Overture is a buildings layer (roofs), not a houses table. Regrid is on-demand parcels/address, not every roof on screen.

## Product model

| Layer | What it is | When it costs |
| --- | --- | --- |
| Satellite | `react-native-maps` | Already there |
| Turf | Assigned/unassigned `areas` | Already there |
| Roofs | Overture footprints | Display only, ~$0 |
| `houses` | Doors we tapped, knocked, or imported | Write on tap |
| Address / owner | Regrid (later) | Only when needed |

Turf = who owns the block. Overture = every roof. `houses` = doors we touched.

## Sequence

### V1A — roofs on screen (start here)

Pan a neighborhood, see building outlines. Nothing is saved.

**API:** extract Overture buildings for tester bboxes; `GET /area-management/map-buildings?west&south&east&north`.

**App:**

- Debounce `onRegionChangeComplete` in `components/DrawingMap/PolygonCreator.tsx`.
- Fetch only at street zoom (current `latitudeDelta` 0.003 is already street-level; skip if zoomed out past a cap, e.g. `latitudeDelta > 0.02`).
- Draw footprints as `Polygon` (thin stroke, light fill). Not tappable yet.
- OSM/Overture attribution on the map.
- Turf `onPress` must not steal taps once footprints are shown (`zIndex`; ignore turf press at street zoom).
- Cap ~400–800 polygons so the native map stays usable.

Leave OSM `auto_discover_houses`, Regrid, Mapbox, and tap-to-save alone.

### V1B — tap roof → house

Tap a footprint → find or create `houses` (`source = 'overture'`, `external_id = GERS`) → open `DetailedHouseOverviewModal`.

Requires API `POST /area-management/map-houses/from-building` (address and `area_id` optional). App must load houses by **viewport bbox**, not only area ids. Markers cannot stay nested only inside turf in `convertMapAreasToPolygons`.

Lookup is `(source, external_id)`, not `external_id` alone.

### V1C — statuses on those roofs

Paint existing `house_statuses` on the footprint or marker. Keep appending history. Drop tiny footprints (~40–80 m²) so sheds are not doors.

### V1D — address (done)

If address is still unknown after tap: one Regrid point lookup, save address + `ll_uuid` on `houses.location`. Never on pan. Create-area sends `auto_discover_houses: false`.

## Out of scope until V1A works on a phone

Mapbox/MapLibre, Regrid parcel tiles, Smarty roam, owner intel, offline packs, solar score, new CRM tables, dumping Overture into Postgres as `houses`.

## App files (V1A)

| File | Change |
| --- | --- |
| `services/area-api.ts` | `fetchMapBuildings(bbox)` |
| `components/DrawingMap/PolygonCreator.tsx` | Viewport fetch + footprint polygons |
| Small util + spec | Region → bbox, zoom gate, debounce |

## Done when

A tester opens Field map, zooms to a real street, and sees roof outlines without drawing turf and without waiting on OSM.
