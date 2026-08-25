# Staging wiring notes

State of the app ↔ staging API connection (see `backend-routes.md` for the
route catalog). The manager suite now calls live staging endpoints and
falls back to sample data per-fetcher when a call fails or returns empty.

## Live-wired

| Screen | Endpoints |
| --- | --- |
| Analytics (pulse + roster) | `GET /area-management/field-stats`, `GET /users/all` |
| Offices | `GET /offices/all`, `GET /users/all` |
| Competitions | `GET /competition/rounds`, `GET /competition/round-leaderboard` |
| Onboarding (list + invite) | `GET /onboarding/invited-users`, `GET /onboarding/direct-recruits`, `POST /onboarding/invite` |
| Home leaderboard | `GET /leaderboard/sales-dashboard` (sample fallback while staging has no deals) |

Still sample-only: Teams (points/incentives), Messages — no server
counterpart yet (`needs-api`).

## Test accounts (staging only)

| Login | Role |
| --- | --- |
| `jose@suntappedenergy.com` / documented staging password | Sales Org Admin (god mode) |
| `staging.user.445@example.test` / same | Setter, Kaos Cartel (low-privilege QA) |

## Known staging gaps

1. **No deals can be created**: the `service_providers` table is empty and
   `POST /installers` requires a system administrator. Until Jose seeds a
   provider row, `POST /deals/solar` FK-fails and every deals-derived
   number (sales leaderboard, office deal counts) is empty. Ask Jose to
   add one service provider + a few deals on staging.
2. Per-office deal/install/cancel counts and per-rep knock counts have no
   reporting endpoint yet; those figures read 0 on live data.
3. Seeded so far by us: onboarding invites (Cole Bennett, Priya Shah,
   Marcus Lee, Dana Ortiz, Theo Ramsey) and three canvassing leads
   (Rosa Delgado, Hank Porter, Iris Chen).
