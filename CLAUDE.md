# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
# Local dev server (http://localhost:5173)
npm run dev

# Build for production (outputs to dist/)
npm run build

# Preview production build locally
npm run preview
```

No test runner is configured. No linter is configured.

## Architecture

Vue 3 + Vite SPA, deployed to Firebase Hosting. UI is built entirely with **PrimeVue 4** (`primevue`) using the Aura/Emerald preset. Icons use **PrimeIcons** (`primeicons`). State is managed with **Pinia**. `@` is aliased to `src/`.

All PrimeVue components are registered globally in `src/main.js` — no per-file imports needed. Use `useToast()` from `primevue/usetoast` for notifications (replaces Naive UI's `useMessage`).

### Auth Flow

Auth is a two-layer system:

1. **Firebase Auth** — Google Sign-In via popup (`signInWithPopup`). The resulting Firebase ID token is exchanged with the backend (`POST /auth/login`) which verifies it and returns our own JWT.
2. **App JWT** — stored in `localStorage` as `petitgo_access_token`. All backend API calls attach it as `Authorization: Bearer <token>` via an axios interceptor in `src/services/api.js`. A 401 response clears the token and redirects to `/login`.

`src/firebase.js` exports a `secondaryApp` / `secondaryAuth` instance specifically for creating new users without logging out the current admin — used in `userService.js`.

`authReady` (exported from `src/firebase.js`) is a Promise that resolves once Firebase Auth has emitted its first state change. `src/main.js` awaits it before mounting the app so the router guard never sees an uninitialised loading state.

### Router Guards

`src/router/index.js` enforces two meta flags:
- `requiresAuth: true` — redirects to `/login` if not logged in
- `requiresAdmin: true` — redirects to `/dashboard` if `role` is not `ADMIN`/`admin`

If `authStore.loading` is still true when navigation fires, the guard waits via a `watch` before proceeding.

### Stores

- **`auth`** (`src/stores/auth.js`) — holds `user`, `userProfile` (from Firestore `users/{uid}`), `isLoggedIn`, `isAdmin`, `loading`. Falls back to a `localStorage` cache keyed by UID if Firestore is unavailable.
- **`sheets`** (`src/stores/sheets.js`) — fetches and parses data from Google Sheets for Dashboard, Order Summary, and Box Management pages. The `apiKey` and `spreadsheetId` are persisted to `localStorage` and configured by the user in the Settings page.

### Services

- **`src/services/api.js`** — axios instance pointed at `VITE_API_BASE_URL` with JWT interceptor
- **`src/services/googleSheets.js`** — calls Google Sheets API v4 directly from the browser using a user-supplied API key; also exports Thai currency/number formatters
- **`src/services/userService.js`** — Firebase Auth + Firestore helpers for user CRUD; uses `usernameToEmail()` convention (`username@petitgo-erp.local`) to map usernames to Firebase email accounts

### Pages

All pages under `src/pages/` are lazy-loaded by the router. `UserManagementPage` is admin-only (`requiresAdmin: true`).

## Environment Variables

All must be prefixed with `VITE_` to be exposed to the browser:

| Variable | Purpose |
|---|---|
| `VITE_API_BASE_URL` | Backend base URL (petitgo-be) |
| `VITE_FIREBASE_*` | Firebase client SDK config |
| `VITE_GOOGLE_SHEETS_API_KEY` | Default Google Sheets API key (can be overridden in Settings) |
| `VITE_SPREADSHEET_ID` | Default spreadsheet ID (can be overridden in Settings) |

## Deployment

Push to `main` triggers the GitHub Actions workflow at `.github/workflows/firebase-deploy.yml` which runs `build` → `test` → deploys to Firebase Hosting project `pet-it-go`.
