# petitgo-fe

Petitgo's internal management web app: sales dashboard, order summary, box management, timesheets and payment slips. It runs on the web at <https://pet-it-go.web.app> and inside LINE as a LIFF app.

Built with Vue 3, Vite, PrimeVue 4 and Pinia. It is deployed to Firebase Hosting in the `pet-it-go` project. The backend is [petitgo-be](../petitgo-be).

## Pages

| Route | Page | Access |
| --- | --- | --- |
| `/login` | Login: Google sign-in on the web, LINE (LIFF) inside LINE | public |
| `/dashboard` | Sales dashboard (Google Sheets) | signed in |
| `/orders` | Order summary (Google Sheets) | signed in |
| `/boxes` | Box management (Google Sheets) | signed in |
| `/timesheet` | Submit timesheet entries | signed in |
| `/slip` | Upload payment slips | signed in |
| `/settings` | Google Sheets API key and spreadsheet ID (saved in the browser) | signed in |
| `/users` | User management | admin |
| `/timesheet-approval` | Approve or reject timesheets | admin |

## Getting started

Requirements: Node.js 20+ and npm.

```bash
npm install
cp .env.example .env     # then fill in the values below
npm run dev              # http://localhost:5173
```

| Command | Description |
| --- | --- |
| `npm run dev` | Dev server with hot reload |
| `npm run build` | Production build to `dist/` |
| `npm run preview` | Serve the production build locally |

There is no test runner or linter configured.

### Calling the API in development

With `VITE_API_BASE_URL=/api`, the Vite dev server forwards `/api/*` to `API_PROXY_TARGET`. This avoids CORS problems and lets you choose which backend to use:

```bash
# local petitgo-be (npm run start:dev in petitgo-be) — the default
API_PROXY_TARGET=http://localhost:3000

# or the deployed backend
API_PROXY_TARGET=https://api-w5rhc5q6zq-as.a.run.app
```

Leave out the `/api` suffix: the proxy keeps the `/api` path when it forwards.

## Environment variables

| Variable | Used for |
| --- | --- |
| `VITE_API_BASE_URL` | petitgo-be base URL, including `/api`. `/api` in development (Vite proxy). In production, the asia-southeast1 function: `https://api-w5rhc5q6zq-as.a.run.app/api` |
| `API_PROXY_TARGET` | Dev only: where the Vite proxy sends `/api` (default `http://localhost:3000`). Not exposed to the browser |
| `VITE_FIREBASE_*` | Firebase client SDK config (Auth, Firestore) for project `pet-it-go` |
| `VITE_LIFF_ID` | LINE LIFF app ID for login inside LINE |
| `VITE_ENABLE_VCONSOLE` | `true` shows an on-screen console. Useful for debugging inside LINE, where there are no devtools |

`VITE_GOOGLE_SHEETS_API_KEY` and `VITE_SPREADSHEET_ID` are listed in `.env.example` and the deploy workflow, but nothing in the code reads them. The Google Sheets key and spreadsheet ID are entered on the **Settings** page and stored in the browser.

Every `VITE_*` value is compiled into the public JavaScript bundle. Never put real secrets in them.

## Authentication

1. **Sign in:** Google sign-in through Firebase Auth on the web, or LINE login through LIFF inside the LINE app.
2. **Token exchange:** the Firebase ID token or LIFF access token is sent to petitgo-be (`POST /auth/login` or `/auth/liff-login`), which returns the app's own JWT.
3. **API calls:** the JWT is stored in `localStorage` (`petitgo_access_token`) and sent as `Authorization: Bearer <token>` on every request (`src/services/api.js`). A `401` clears it and redirects to `/login`.

## Project structure

```
src/
  main.js          app bootstrap, PrimeVue theme + global components, vConsole toggle
  firebase.js      Firebase app/auth; `authReady` promise awaited before mount
  router/          routes and requiresAuth / requiresAdmin guards
  stores/          Pinia: auth (user, role), sheets (Google Sheets data + config)
  services/        api (axios + JWT), liff, googleSheets, user/slip/timesheet services
  layouts/         MainLayout (navigation shell)
  pages/           one lazy-loaded component per route
  components/      shared UI (StatCard)
```

## Deployment

Pushing to `main` runs `.github/workflows/firebase-deploy.yml`, which does:

1. **build** with the `VITE_*` values from GitHub Actions secrets
2. **test**, currently a placeholder
3. **deploy** `dist/` to Firebase Hosting (`pet-it-go`, live channel)

`VITE_*` values are baked in at build time. After changing a secret (GitHub → Settings → Secrets and variables → Actions), redeploy by re-running the workflow or pushing to `main`. The new value only takes effect after that rebuild.

The Content Security Policy in `index.html` allows the API host through a `__API_ORIGIN__` placeholder. `vite.config.js` fills it in at build time with the origin of `VITE_API_BASE_URL`, so moving the API only needs that one secret changed. Don't edit `dist/` by hand: it's rebuilt on every deploy.

Hosting rewrites every path to `index.html` (SPA routing) and sets `Cross-Origin-Opener-Policy: same-origin-allow-popups` so Google sign-in popups work.
