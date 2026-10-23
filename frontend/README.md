# FaceTrack AI — Frontend

Next.js 16 (App Router) + TypeScript + Tailwind CSS 4 + shadcn/ui (Radix) + React Hook Form + Zod +
TanStack Table 9 + Recharts 3 + Lucide icons. It talks only to the existing FastAPI backend, so
there is no second database and no second auth system.

## Requirements

- Node.js 22 (`node --version`)
- The backend running on `http://127.0.0.1:8000`. See [../backend/README.md](../backend/README.md).
- For e2e tests: Microsoft Edge, which is preinstalled on Windows

> **This folder's path contains `&`** ("Face Recognition **&** People Management System"). npm's
> Windows `.cmd` shims break on `&`, so every script in `package.json` runs the tool through
> `node node_modules/...` instead. Use `npm run <script>`. Bare `npx next` / `npx shadcn` fail in
> this folder; run `node node_modules/shadcn/dist/index.js add <component>` to add shadcn components.

## Setup (PowerShell)

```powershell
cd "D:\Code All\Python_All\FaceTrack AI — Face Recognition & People Management System\frontend"
npm install
Copy-Item .env.example .env.local
```

`.env.local` holds **no secrets**:

| Variable | Used by | Meaning |
|----------|---------|---------|
| `BACKEND_URL` | Next.js server only | Where FastAPI listens (default `http://127.0.0.1:8000`). Read at **build** time by the rewrite, so rebuild after changing it. |
| `E2E_BASE_URL`, `E2E_ADMIN_*`, `E2E_VIEWER_*` | Playwright only | Test accounts for `npm run test:e2e` |

There are no `NEXT_PUBLIC_*` variables. The JWT secret and DB credentials exist only in `backend/.env`.

## Run both applications

**Terminal 1: backend** (MySQL must be running in Laragon):

```powershell
cd "D:\Code All\Python_All\FaceTrack AI — Face Recognition & People Management System\backend"
.\.venv\Scripts\python.exe -m uvicorn app.main:app --reload --host 127.0.0.1 --port 8000
```

**Terminal 2: frontend:**

```powershell
cd "D:\Code All\Python_All\FaceTrack AI — Face Recognition & People Management System\frontend"
npm run dev
```

Open **http://localhost:3000** and sign in with an account created by
`python -m app.cli create-user` (see the backend README). Use `localhost` rather than the LAN
address: browsers allow the camera only on HTTPS or `localhost`.

Production build: `npm run build` then `npm run start` (port 3000).

## Scripts

| Command | What it does |
|---------|--------------|
| `npm run dev` | Dev server with Turbopack on :3000 |
| `npm run build` / `npm run start` | Production build / serve |
| `npm run lint` | ESLint (Next.js core-web-vitals + TypeScript + React Compiler rules) |
| `npm run typecheck` | `next typegen` + `tsc --noEmit` |
| `npm run test` | Vitest unit tests (API client, error parsing, redirects, file sniffing, permissions) |
| `npm run check` | lint + typecheck + unit tests |
| `npm run test:e2e` | Playwright in Edge against the **running** apps (fake webcam included) |
| `npm run gen:api` | Regenerate `src/lib/api/schema.d.ts` from the running backend's `/openapi.json` |

## How it connects to the backend

```
Browser ──► http://localhost:3000/api/v1/*  ──(Next.js rewrite)──►  http://127.0.0.1:8000/api/v1/*
```

- **Same origin.** The browser only talks to Next.js, which proxies `/api/v1/*` to FastAPI. The
  backend's `HttpOnly; SameSite=Strict; Path=/api/v1/auth` refresh cookie is first-party, and normal
  use needs no CORS. The backend's `CORS_ORIGINS` is still set to `http://localhost:3000` in case
  you call the API directly.
- **Access token in memory only**, never in localStorage. A reload restores the session by calling
  `POST /api/v1/auth/refresh`, and the token is refreshed 60 s before it expires.
- **Refresh is single-flight**, and serialised across tabs with the Web Locks API. The backend
  treats a second use of a rotated refresh token as theft and ends the sign-in, so two tabs must
  never refresh with the same cookie. The e2e suite covers this.
- **Typed endpoints only.** `apiRequest()` accepts only paths that exist in the generated OpenAPI
  types, so the compiler rejects a URL the backend doesn't serve.
- **Errors.** The backend's `{"error": {code, message, details, request_id}}` envelope becomes an
  `ApiError`. 422 details are mapped onto form fields, 429 shows `Retry-After`, and an unreachable
  backend shows "API not reachable".
- **Logout / password change** do a full page load to `/login`. Next.js keeps visited pages mounted
  in memory, and a full load is what discards the previous user's data.

## Role-based UI

The sidebar and pages use the `permissions` list from `GET /api/v1/auth/me` (matrix:
[docs/01-architecture.md §1.3](../docs/01-architecture.md#13-roles--permissions)). Links a role
can't use are hidden, pages show "You don't have access", and actions such as *Add person* or
*Export* are not rendered. **This is UX only.** The backend authorises every request.

## Pages and what works today

| Page | Route | Permission | Status |
|------|-------|-----------|--------|
| Login | `/login` | — | **Works**: `POST /auth/login`, safe `?next=` redirect, rate-limit messages |
| Dashboard | `/dashboard` | `reports.read` | **Partly works**: API/DB/migration status, role and permission cards, Recharts *permissions per role* (admin). Attendance metrics wait for the backend. |
| Employees & Students | `/people` | `people.read` | Table UI ready; **no backend endpoint yet** (Phase 3) |
| Departments | `/departments` | `people.read` | Table UI ready; **no backend endpoint yet** (Phase 3) |
| Face Registration | `/faces` | `faces.enroll` | **Camera capture and uploads (up to 5) work locally**; submitting waits for Phase 3–4 |
| Face Scanner | `/scanner` | `scan.run` | **Live webcam, frame capture and upload validation work**; *Identify* waits for Phase 4 |
| Scan History | `/scans` | `scan.run` or `audit.read` | Table UI ready; no endpoint yet (Phase 4) |
| Attendance | `/attendance` | `attendance.read` | Table UI ready; no endpoint yet (Phase 6) |
| Reports | `/reports` | `reports.read` | Layout ready; no endpoint yet (Phase 6) |
| Settings | `/settings` | signed in | **Works**: profile, change password, theme, roles and permissions table (admin), system status. Thresholds and retention wait for Phase 6. |

Pages waiting for the backend show a **"Waiting for the backend"** panel listing the *planned*
endpoints from the architecture doc. They never call them, show no fake data, and keep their
submit buttons disabled.

### Camera and uploads

- The camera starts only after you click **Start camera**, so the browser's permission prompt follows
  a clear action. Denied, missing and in-use cameras, and non-HTTPS origins, each get their own
  message. You can switch between multiple cameras.
- The stream stops on *Stop*, on switching tabs, and on navigating away.
- Captured frames and chosen files stay in the tab as `blob:` URLs, are never uploaded yet, and
  are discarded when you leave the page.
- Uploads are checked for size (≤ 5 MB), real type from magic bytes (JPEG/PNG only, whatever the
  extension says), and dimensions (≤ 4096 px). The backend must re-check all of this when the scan
  API arrives.

## Project layout

```text
src/
├── app/
│   ├── layout.tsx              theme, tooltip, auth providers; Geist + Noto Sans Khmer fonts
│   ├── (auth)/login/           login page + form
│   ├── (app)/                  protected area: layout = sidebar + top bar + auth guard
│   │   ├── dashboard/ people/ departments/ faces/ scanner/
│   │   ├── scans/ attendance/ reports/ settings/
│   │   └── error.tsx           error boundary (shows the request ID)
│   └── not-found.tsx
├── components/
│   ├── auth/                   AuthProvider, RequireAuth, RequirePermission
│   ├── layout/                 AppShell, AppSidebar, Topbar, ThemeToggle, UserMenu, ApiStatus
│   ├── camera/                 CameraPanel, ImageDropzone, ImageThumb, OutcomeLegend
│   ├── common/                 DataTable (TanStack v9), StatCard, PageHeader, PlannedFeature, QueryError
│   └── ui/                     shadcn/ui components
├── features/<page>/            one view per page
├── hooks/                      useCamera, useImageList, useApiQuery, useIsMobile
└── lib/
    ├── api/                    schema.d.ts (generated), client.ts, endpoints.ts, errors.ts, types.ts
    ├── permissions.ts          permission codes (mirror of backend/app/core/permissions.py)
    ├── navigation.ts           sidebar items, required permissions, availability
    ├── image-validation.ts     size / magic-byte / dimension checks
    └── safe-redirect.ts        open-redirect guard for ?next=
e2e/app.spec.ts                 Playwright end-to-end tests
```

## Security headers

`next.config.ts` sets a CSP (`default-src 'self'`, `connect-src 'self'`, `frame-ancestors 'none'`,
`object-src 'none'`; dev mode adds `'unsafe-eval'` for fast refresh), `X-Frame-Options: DENY`,
`nosniff`, `Referrer-Policy`, and `Permissions-Policy: camera=(self)`. Script CSP still allows
`'unsafe-inline'` for Next.js bootstrap scripts. A nonce-based CSP is a possible later hardening step.

## Troubleshooting

| Symptom | Fix |
|---------|-----|
| "Cannot reach FaceTrack API" after sign-in | Start the backend on :8000, then click *Try again*. |
| `'People' is not recognized as an internal or external command` | You ran a bare `npx`/`.bin` command in this folder. Use `npm run …` (see the note at the top). |
| Camera says HTTPS/localhost required | Open `http://localhost:3000`, not the network IP. |
| Logged out when opening many tabs at once | Should not happen. Refresh is locked across tabs. If it does, check `auth.refresh_reuse` rows in `audit_logs`. |
| Changed `BACKEND_URL` but requests still go to the old address | Rewrites are compiled at build time: re-run `npm run build`, or restart `npm run dev`. |
