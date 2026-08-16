# Radiabase_mobile — App (Expo)

This folder is the **Expo / React Native mobile app**. It is its own GitHub repo.

The backend lives in the sibling folder `sunnected_jose` (separate git repo). They share one Cursor window, not one git repo.

- Edit screens, components, navigation, and mobile API clients here.
- This is **not** Next.js, not a web app, and not the NestJS API.
- Do not put NestJS modules, DTOs, or database code in this repo.
- Do not merge these repos, add git submodules, or treat `Development/` as a monorepo.
- Git, branches, and PRs stay independent from the API.
- Use Local Agent in this multi-root workspace. Cloud Agents and git worktrees do not work well with two roots.

When the user only wants app changes, stay in this folder. When they want both sides, change the app here and the API in `sunnected_jose`.

## Tester handover (no backend repo)

Testers do **not** need `sunnected_jose` or a local database. They need:

1. An Expo/EAS **preview or internal** build of this app (or Expo Go with env set).
2. `EXPO_PUBLIC_API_URL` pointing at **staging**, not production. Example: `https://YOUR-STAGING-HOST/api`.
3. A **staging login** (email + password). Local default password is only for local DB, not staging.

Native apps send no CORS origin, so staging already accepts them. Do not share `.env.staging`, database URLs, or AWS keys. After pulling this branch they must **log out and log in again** so session includes sales org / office / vertical.

