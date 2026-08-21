# Address data strategy (datasearch)

How Radiabase resolves and stores residential addresses, what Apple/Google
can and cannot legally provide, and the paths to RepCard-style "every door
pre-loaded" turf.

## What map providers offer

| What you need                                      | Apple Maps | Google Maps |
| -------------------------------------------------- | ---------: | ----------: |
| Tap a house → receive likely address               |        Yes |         Yes |
| Type an address → receive coordinates              |        Yes |         Yes |
| Validate an already-known address                  |    Limited |         Yes |
| Draw polygon → return every home inside            |         No |          No |
| Build and permanently store a residential database | Restricted |  Restricted |

Neither provider has a `GET /residential-addresses?polygon=...` endpoint.

- **Apple** prohibits bulk extraction, secondary address databases, and
  durable storage of its Map Data
  ([developer agreement, attachment 6](https://developer.apple.com/support/terms/apple-developer-program-license-agreement/#attachment-6)).
- **Google** prohibits bulk downloading/indexing, and its terms generally
  prohibit using Geocoding/Places content with a non-Google map — so Google
  results must never be overlaid on our Apple-rendered map
  ([Geocoding](https://developers.google.com/maps/documentation/geocoding/guides-v3/overview) ·
  [terms](https://cloud.google.com/maps-platform/terms/maps-service-terms)).

Reverse geocoding also returns the *closest addressable location*, not
necessarily the exact house. Known failure cases: closely spaced houses,
apartments/duplexes, new developments, rural properties, long driveways,
interpolated street numbers. Treat provider results as a prefill the rep
confirms — never as truth.

## What Radiabase already implements

The recommended architecture is largely the current one:

1. **Apple Maps for presentation only** — satellite/hybrid rendering; no
   address data depends on the map layer.
2. **Overture building footprints** — served per street viewport by the
   Nest API (`GET /area-management/map-buildings`); powers tap-a-roof.
3. **Regrid as the licensed address/parcel source** — on first roof tap,
   the *server* (`POST /area-management/map-houses/from-building`) runs one
   Regrid point lookup and caches the address on the `houses` row. Regrid's
   license permits persistent storage — the legally clean pattern.
   Current token is **sandbox** (Dallas County only); nationwide coverage
   is a paid Regrid plan, not a code change.
4. **Apple reverse geocoding as fallback** — when a house address is
   incomplete, the Submit Lead form prefills via on-device
   `expo-location` reverse geocoding (CLGeocoder) and the rep corrects it.
   Once confirmed by the rep it is user-provided CRM data, avoiding the
   "storing Apple map data" problem.
5. **No bulk import on turf creation** — `create-area` always sends
   `auto_discover_houses: false`; doors exist only when tapped.

## The missing piece: pre-loaded turf

Two compatible paths to "every door already loaded when turf is drawn":

1. **Overture address points** (cheap MVP) — sibling dataset to the
   buildings layer the backend already ingests, with open licensing that
   permits storage ([docs](https://docs.overturemaps.org/guides/addresses/)).
   A polygon query at area-creation time pre-populates doors free.
   US coverage is good and growing, not universal — best-effort.
2. **Regrid polygon search** (production-grade) — parcel boundaries,
   validated addresses, footprints, polygon searches, persistent IDs
   ([parcel API](https://regrid.com/parcel-api)). The API already has
   dormant boundary-search routes and the Regrid plumbing; this extends an
   existing integration.

When ready, turf pre-loading is a `needs-api` request against the API's
`feat/expo-canvassing` branch.

## Rules of thumb

- Regrid (or another licensed parcel dataset) is the only thing allowed to
  *persist* addresses at scale.
- Apple geocoding output is a rep-confirmed prefill, one house at a time.
- Google address products stay out of the stack entirely while the map is
  Apple.
