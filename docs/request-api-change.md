# Request an API change

Testers do **not** get the Nest repo. GitHub cannot hide folders: anyone who can clone the API can see all of it (pay, Airtable, deals). You request API work here; an agent implements it on a **separate API branch**.

## What you do

1. Read [backend-routes.md](./backend-routes.md) so you are not asking for something that exists.
2. Try it on staging: `https://sunnected-jose-1.onrender.com/api`.
3. Open **API change** on this repo ([new issue](https://github.com/Jcuevas509/Radiabase_mobile/issues/new?template=api-change.yml)).
4. Keep app work on a **feature branch** of this repo. Do not invent Nest files.

The issue is labeled `needs-api`. A GitHub Action then calls the Cursor automation (GitHub webhooks cannot send Cursor’s Bearer token, so they will 401).

## What happens next

1. An agent (or Jose) implements it in `sunnected_jose` on branch `feat/expo-canvassing` only — never API `main`.
2. Scope is field-map / canvassing: `area-management` map routes, `POST /leads`, `PATCH /leads/:id/info`, `GET /offices/user-offices`, `GET /users`.
3. Staging is deployed from that branch. You log out, log in, and retest.
4. The issue gets a comment with the PR / what shipped.

## What you cannot do

- Edit “only some folders” of the real backend. That still requires clone access to the whole repo.
- Point a second Nest app at the staging database.
