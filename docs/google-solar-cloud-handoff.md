# Google Solar API cloud handoff for Radiabase

Owner: Jose

Purpose: Enable real Google Solar API data for the Radiabase mobile map without exposing Google credentials in the iPhone app.

## Outcome needed

Radiabase needs a Google Cloud project with billing enabled and the **Google Maps Platform Solar API** enabled. The mobile app must call the Radiabase backend, and the backend must call Google with a server-side secret.

The Google credential must never be committed to GitHub, written into this document, pasted into chat, or added to an `EXPO_PUBLIC_*` variable. Expo public variables are included in the installed application and can be extracted.

## Jose's Google Cloud steps

1. Open Google Cloud Console and select or create the business-owned project that will pay for Radiabase Solar API usage.
2. Record the Google Cloud **project ID**.
3. Link an active billing account to the project.
4. Open **APIs & Services → Library**.
5. Find and enable **Solar API** under Google Maps Platform.
6. Open **APIs & Services → Credentials**.
7. Create a dedicated API key named `radiabase-solar-backend`.
8. Apply an **API restriction** allowing only **Solar API**.
9. Do not reuse an unrestricted Maps key or a key belonging to Terros or another company.
10. Configure conservative Solar API quotas and Google Cloud billing alerts for development.

## Put the actual key in the backend

The backend environment must contain:

```text
GOOGLE_SOLAR_API_KEY=<actual Google key>
```

Preferred staging location: the Render environment variables for the Radiabase staging backend.

Do not use this in the Expo app:

```text
EXPO_PUBLIC_GOOGLE_SOLAR_API_KEY=...
```

Google classifies Solar API as a web-service API. The safe mobile design is:

```text
Radiabase iPhone app
        ↓ authenticated Radiabase request
Radiabase backend
        ↓ request containing GOOGLE_SOLAR_API_KEY
Google Solar API
```

The backend route must accept only the specific coordinates and Solar operations the app needs. It must not act as an unrestricted pass-through proxy to arbitrary Google URLs.

## Credential restrictions

- Restrict the key to **Solar API only**.
- Keep the key exclusively in backend secret storage.
- If the backend has stable outbound IP addresses, add those as the key's application restriction.
- If staging uses dynamic outbound IP addresses, retain the API-only restriction, strict quotas and authenticated backend route until stable egress can be configured.
- Use separate staging and production keys before production launch.
- Never send the key in email, Slack, screenshots, Markdown, GitHub issues or pull requests.

## Access alternative

If Adam needs to configure the Google Cloud project, invite his Google account to the project instead of sharing a Google password. The relevant least-privilege roles are:

- Service Usage Admin
- API Keys Admin
- Viewer

Billing Account User is needed only if Adam must link the billing account himself. Jose can avoid granting billing access by linking billing before handoff.

## What to send back

Send Adam only this non-secret confirmation:

```text
Google Cloud project ID:
Billing linked: yes/no
Solar API enabled: yes/no
Credential name: radiabase-solar-backend
Credential stored in staging backend as GOOGLE_SOLAR_API_KEY: yes/no
API restricted to Solar API: yes/no
Development quota configured: yes/no
```

Do not include the actual API-key value in that confirmation.

## Acceptance test

After the backend route is implemented, it should:

1. Reject unauthenticated requests.
2. Request Google Solar `buildingInsights` for a supported test coordinate.
3. Request the required `dataLayers` data for a small test area.
4. Return only the fields or raster references needed by the mobile app.
5. Avoid logging the Google key or authorization headers.
6. Return a controlled unavailable state when Google has no coverage for a location.
7. Record request counts and failures without storing unnecessary homeowner or session data.

## Official references

- Solar API setup: https://developers.google.com/maps/documentation/solar/get-api-key
- Solar API usage and billing: https://developers.google.com/maps/documentation/solar/usage-and-billing
- Google Maps Platform API-key security: https://developers.google.com/maps/api-security-best-practices
