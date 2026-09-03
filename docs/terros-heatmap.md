# Terros heatmap — what the browser proves

**Web heatmap: yes, 100% from this browser.**
**iOS heatmap: no. This browser is the web app, not the iPhone binary.**

Inspected 3 September 2026 from the live Area Management SPA at `app.terros.com` (your URL already had `pinRenderMode=heatmap` at zoom 21). Evidence is the shipped JS chunk `assets/areaManagement-QrVglTgS.js` plus `GoogleMapProvider-4E3GSJW7.js` and `useDeckGlOverlay-BkZuRKBy.js`. Authenticated map XHR bodies were not captured.

## Proven on web

Their “heatmap” is **not** Google’s density `HeatmapLayer`. It is a **fast circle-pin mode** drawn with **deck.gl on Google Maps**.

### 1. They name the tradeoff in the UI

Toggle options are exactly `detailed` and `heatmap`. Tooltip copy in the bundle:

> Detailed shows icon pins with clustering. Heatmap shows the faster circle pins.

`pinRenderMode` is stored in the URL and in `AccountsManagement|pinRenderMode` (default `detailed`).

### 2. Heatmap = GPU circles, not markers

When map data is in account/`pin` mode, they build a deck.gl scatterplot:

- layer id: `account-markers`
- position: `[lng, lat]` from `account.latlng`
- `getRadius` from zoom
- `radiusUnits: "pixels"`
- `stroked: true`, `filled: true`
- `pickable: true` (tap opens the account)

Circle size in pixels:

```text
zoom >= 18 → 14px
zoom >= 16 → 8px
else       → 5px
```

Company-logo stages get a second layer, `heatmap-company-logo-markers` (deck.gl IconLayer, shared atlas, size = 2× the circle radius).

Detailed mode (`pinRenderMode === "detailed"`) is the other path: icon pins + **supercluster**. Heatmap skips that.

### 3. The API already aggregates when you zoom out

Client normalizer in the same chunk:

```text
server mode "pin"  → { mode: "account", data }
anything else      → { mode: "grid", data }
```

Grid cells carry `count` plus rolled-up `statuses` / `workflowStages`. They do not send every door at city zoom. Viewport bbox (`viewBbox`) is what the map asks for.

### 4. Base map is Google, overlay is deck.gl

- `@vis.gl/react-google-maps` `APIProvider` + `GoogleMap`
- deck.gl Google overlay (`deck-gl-google-maps-container`)
- Native Google map-type control: `roadmap` / `satellite` / `hybrid` / `terrain`
- `mapTypeControl: true`, street view off, `minZoom: 5`

## Not proven from this browser

| Claim | Status |
| --- | --- |
| Web heatmap = deck.gl pixel circles | **Proven** (this SPA) |
| Web detailed = clustered icon pins | **Proven** |
| Server `pin` vs `grid` | **Proven** in client code; request/response bodies not captured |
| iOS uses the same circle/grid bargain | **Inferred**, not from this browser |
| iOS uses `GMUHeatmapTileLayer` | **Unknown** — not in this SPA |
| iOS is Swift + Google Maps | **Not from this browser** (LinkedIn + help center) |

The iPhone app is a separate native binary. This tab cannot show how they draw dots in Swift. The web implementation is the thing we can state as fact.

## What that means for Radiabase

Copy the **web bargain**, not a library name:

1. A “heatmap” mode that draws **one reused circle**, not a unique icon per house.
2. An API that returns **viewport pins or grid cells** by zoom, not every door in the city.
3. Keep icon/clustering for a separate “detailed” mode.

On our Expo iOS map that is **not** deck.gl. We are on Apple MapKit via `react-native-maps`. Matching Terros on iPhone would mean a cheap native overlay (shared circle glyph, or Google Maps on iOS), not shipping deck.gl inside Expo.
