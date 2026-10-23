# 1. Architecture & Folder Structure

## 1.1 System overview

```mermaid
flowchart LR
    subgraph Browser["Browser"]
        UI[Next.js pages & components]
        CAM[Webcam via getUserMedia]
    end

    subgraph Next["Next.js server :3000"]
        P[Rewrite proxy /api/v1/* → :8000]
    end

    subgraph API["FastAPI backend (single process)"]
        R[Routers /api/v1/*]
        D[Auth & permission dependencies]
        S[Services: people, attendance, reports, audit, retention]
        F[Face engine: detect → quality → align → embed → match]
        G[(In-memory gallery\nN × 128 float32)]
        C[Crypto: AES-256-GCM]
    end

    DB[(MySQL 8.4\nfacetrack)]
    FS[(storage/\nencrypted photos)]
    M[(ml_models/\nYuNet + SFace ONNX)]

    UI -- same-origin JSON + Bearer JWT --> P
    CAM -- JPEG frames --> P
    P --> R
    R --> D --> S
    R --> F
    F --> G
    F --> M
    S --> DB
    S --> C --> FS
    G -. loaded & decrypted at startup / on change .- DB
```

**Request path:** browser → Next.js `/api/v1/...` (same-origin rewrite proxy) → FastAPI → JWT + permission check → router → service → SQLAlchemy → MySQL.
Face endpoints additionally pass the image through the face engine, which compares the embedding
against an in-memory gallery of decrypted templates.

### Why these choices

| Decision | Reason |
|----------|--------|
| **OpenCV YuNet + SFace** | Pure pip install on Windows (no dlib/CMake/MSVC), small CPU-friendly ONNX models, permissive licences (YuNet MIT, SFace Apache-2.0). `dlib`/`face_recognition` needs a C++ build on Windows; InsightFace's pretrained weights are licensed for non-commercial research only. |
| **OpenCV pinned `>=4.10,<5`** | Verified on this machine: OpenCV 4.14 + YuNet + SFace on Python 3.14 produce 128‑d float32 embeddings. OpenCV 5.0 also works but prints DNN-engine warnings and is a fresh major release. |
| **Sync SQLAlchemy 2.x + PyMySQL** | Face processing is CPU-bound anyway; sync code in FastAPI's thread pool is simpler to read and debug. PyMySQL is pure Python (no MySQL client libraries). |
| **Embeddings compared in memory** | 10 000 people × 5 templates × 128 floats ≈ 25 MB; a matrix dot product takes milliseconds. No vector DB needed at this scale. |
| **Single backend process** | The gallery cache lives in process memory. Multi-worker deployment would need a cache-invalidation signal (documented in Phase 7). |
| **REST, not WebSockets, for live scanning** | The browser sends ~2 frames/second to a scan *session*; easy to rate-limit, test and log. |
| **Next.js App Router frontend behind a same-origin proxy** | The browser only talks to `:3000`; Next.js rewrites `/api/v1/*` to FastAPI. The refresh cookie stays first-party (`SameSite=Strict` works), no CORS is needed in normal use, and the backend URL is a server-only setting. Auth stays entirely in FastAPI; Next.js holds no secrets and no session of its own. |
| **Argon2 via `pwdlib`, JWT via `PyJWT`** | The libraries FastAPI's current docs recommend; `passlib` is unmaintained. |

## 1.2 Folder structure

```text
FaceTrack AI — Face Recognition & People Management System/
├── README.md
├── .gitignore
├── docs/                              # Phase 1 design docs (this folder)
│
├── backend/
│   ├── requirements.txt               # pinned runtime deps
│   ├── requirements-dev.txt           # pytest, httpx, ruff
│   ├── .env.example                   # every setting, documented
│   ├── alembic.ini
│   ├── alembic/
│   │   ├── env.py
│   │   └── versions/                  # migration scripts
│   ├── ml_models/                     # *.onnx (git-ignored, downloaded by script)
│   ├── storage/                       # git-ignored, outside any web root
│   │   └── photos/                    # AES-GCM encrypted profile photos
│   ├── scripts/
│   │   ├── download_models.py         # fetch + SHA-256 verify ONNX weights
│   │   └── calibrate_threshold.py     # genuine/impostor score analysis (Phase 7)
│   ├── app/
│   │   ├── main.py                    # app factory, middleware, router mounting
│   │   ├── cli.py                     # seed, create-admin, run-retention
│   │   ├── core/
│   │   │   ├── config.py              # pydantic-settings, reads .env
│   │   │   ├── security.py            # hashing, JWT encode/decode
│   │   │   ├── crypto.py              # AES-GCM encrypt/decrypt with key IDs
│   │   │   ├── permissions.py         # permission code constants
│   │   │   ├── rate_limit.py          # in-memory sliding-window limiter
│   │   │   └── errors.py              # error types → JSON responses
│   │   ├── db/
│   │   │   ├── base.py                # DeclarativeBase, naming conventions
│   │   │   └── session.py             # engine, SessionLocal, get_db
│   │   ├── models/                    # SQLAlchemy ORM (one file per aggregate)
│   │   │   ├── user.py  role.py  session.py
│   │   │   ├── department.py  person.py  sequence.py
│   │   │   ├── face_template.py  consent.py
│   │   │   ├── attendance.py  scan_event.py
│   │   │   ├── audit_log.py  setting.py
│   │   ├── schemas/                   # Pydantic request/response models
│   │   ├── api/
│   │   │   ├── deps.py                # get_current_user, require_permission(...)
│   │   │   └── v1/
│   │   │       ├── auth.py  users.py  roles.py
│   │   │       ├── departments.py  people.py  consent.py
│   │   │       ├── faces.py  scan.py
│   │   │       ├── attendance.py  dashboard.py  reports.py
│   │   │       ├── audit.py  settings.py
│   │   ├── services/                  # business logic, no HTTP types
│   │   │   ├── auth_service.py  user_service.py
│   │   │   ├── person_service.py  id_generator.py
│   │   │   ├── enrollment_service.py  scan_service.py
│   │   │   ├── attendance_service.py  report_service.py
│   │   │   ├── audit_service.py  retention_service.py
│   │   │   └── storage_service.py     # encrypted photo read/write
│   │   └── face/                      # recognition engine, no DB access
│   │       ├── detector.py            # YuNet wrapper
│   │       ├── embedder.py            # SFace align + feature
│   │       ├── quality.py             # size, blur, brightness, pose checks
│   │       ├── liveness.py            # head-turn challenge (optional)
│   │       ├── gallery.py             # in-memory template matrix
│   │       ├── matcher.py             # scoring + decision rules
│   │       └── image_io.py            # safe decode, EXIF orientation, limits
│   └── tests/
│       ├── conftest.py                # test DB, client, factories
│       ├── unit/                      # face/quality/matcher/crypto
│       └── api/                       # endpoint + permission tests
│
└── frontend/                          # Next.js 16 App Router — see frontend/README.md
    ├── package.json  next.config.ts   # rewrite proxy + security headers
    ├── .env.example                   # BACKEND_URL (server-only), E2E_* test accounts
    ├── e2e/                           # Playwright tests (Edge, fake webcam)
    └── src/
        ├── app/                       # (auth)/login, (app)/<page>/page.tsx, error.tsx
        ├── components/
        │   ├── auth/                  # AuthProvider, RequireAuth, RequirePermission
        │   ├── layout/                # AppShell, AppSidebar, Topbar, ThemeToggle, UserMenu
        │   ├── camera/                # CameraPanel, ImageDropzone, OutcomeLegend
        │   ├── common/                # DataTable (TanStack Table), StatCard, PlannedFeature
        │   └── ui/                    # shadcn/ui (Radix) components
        ├── features/<page>/           # one view per page
        ├── hooks/                     # useCamera, useImageList, useApiQuery
        └── lib/api/                   # schema.d.ts (generated from /openapi.json), client, endpoints
```

**Layering rules**

- `api/` translates HTTP ↔ service calls and enforces permissions. It contains no business logic.
- `services/` holds business rules and transactions. It never imports FastAPI.
- `face/` is pure image → numbers code. It has no database access, so it can be unit-tested with plain images.
- Only `crypto.py` touches encryption keys, and only `storage_service.py` touches files on disk.

## 1.3 Roles & permissions

Permissions are stored as rows, so an Admin can adjust them. These are the defaults seeded by Phase 2:

| Permission code | Admin | HR / Teacher | Viewer |
|-----------------|:-----:|:------------:|:------:|
| `people.read` (basic profile fields) | ✓ | ✓ | ✓ |
| `people.contact.read` (email, phone) | ✓ | ✓ | |
| `people.write` (create / edit / deactivate) | ✓ | ✓ | |
| `people.archive` / `people.erase` | ✓ | | |
| `consent.manage` | ✓ | ✓ | |
| `faces.enroll` / `faces.approve` | ✓ | ✓ | |
| `faces.delete` | ✓ | ✓ | |
| `scan.run` | ✓ | ✓ | |
| `scan.review` (confirm uncertain matches) | ✓ | ✓ | |
| `attendance.read` | ✓ | ✓ | ✓ |
| `attendance.write` (manual check-in/out) | ✓ | ✓ | |
| `attendance.correct` (void/fix with reason) | ✓ | ✓ | |
| `reports.read` | ✓ | ✓ | ✓ |
| `reports.export` | ✓ | ✓ | |
| `users.manage` / `roles.manage` | ✓ | | |
| `audit.read` | ✓ | | |
| `settings.manage` (thresholds, retention) | ✓ | | |

The API checks permissions on every endpoint. The frontend hides controls the user lacks, but it is
**not** the security boundary.

## 1.4 API surface (planned)

All routes are prefixed with `/api/v1`. "→ audit" means the action writes an `audit_logs` row.

| Area | Endpoints |
|------|-----------|
| Auth | `POST /auth/login`, `POST /auth/refresh`, `POST /auth/logout`, `GET /auth/me`, `POST /auth/change-password` |
| Users & roles | `GET/POST /users`, `GET/PATCH /users/{id}`, `POST /users/{id}/reset-password`, `GET /roles`, `PUT /roles/{id}/permissions` → audit |
| Departments | `GET/POST /departments`, `PATCH/DELETE /departments/{id}` → audit |
| People | `GET /people?search=&department_id=&status=&type=&sort=&page=&size=`, `POST /people`, `GET/PATCH /people/{id}`, `POST /people/{id}/deactivate`, `POST /people/{id}/archive`, `POST /people/{id}/erase`, `PUT /people/{id}/photo`, `GET /people/{id}/photo` → audit |
| Consent | `GET /people/{id}/consents`, `POST /people/{id}/consents` (grant), `POST /people/{id}/consents/withdraw` → audit |
| Faces | `POST /people/{id}/faces` (upload → quality report → pending template), `POST /faces/{id}/approve`, `DELETE /faces/{id}`, `GET /people/{id}/faces` (metadata only) → audit |
| Scan | `POST /scan/image` (upload mode), `POST /scan/live/sessions`, `POST /scan/live/sessions/{sid}/frames`, `POST /scan/events/{id}/review` (confirm/reject) |
| Attendance | `GET /attendance`, `POST /attendance/manual`, `POST /attendance/{id}/void`, `POST /attendance/{id}/correct` → audit |
| Dashboard | `GET /dashboard/summary?date=`, `GET /dashboard/trend?range=daily\|weekly\|monthly` |
| Reports | `GET /reports/attendance?from=&to=&department_id=&format=json\|csv\|xlsx`, `GET /reports/scans?...` |
| Scan history | `GET /scan/events?outcome=&from=&to=&page=` |
| Audit | `GET /audit-logs?actor=&entity_type=&from=&to=&page=` |
| Settings | `GET/PATCH /settings` → audit, `POST /settings/retention/run` (dry-run supported) |

## 1.5 Frontend page map

Implemented in the Next.js frontend (status per page: [frontend/README.md](../frontend/README.md#pages-and-what-works-today)):

| # | Page | Route | Required permission |
|---|------|-------|---------------------|
| 1 | Login | `/login` | — |
| 2 | Dashboard | `/dashboard` (`/` redirects) | `reports.read` |
| 3 | Employees & students | `/people` | `people.read` |
| 4 | Departments & classes | `/departments` | `people.read` |
| 5 | Face registration | `/faces` | `faces.enroll` |
| 6 | Face scanner (live + upload tabs) | `/scanner` | `scan.run` |
| 7 | Scan history | `/scans` | `scan.run` or `audit.read` |
| 8 | Attendance | `/attendance` | `attendance.read` |
| 9 | Reports | `/reports` | `reports.read` |
| 10 | Settings (account, theme, roles, system; consent & retention for `settings.manage`) | `/settings` | signed in |

Still to come, once their backend endpoints exist: create/edit person (`/people/new`, `/people/[id]/edit`),
person details (`/people/[id]`), and user management (`users.manage`).

**UI conventions:** Light and dark themes come from CSS variables, with a Tailwind `dark` variant
toggled by a class. Result colours are green = match, amber = needs review, red = no match/error.
Every colour also has an icon and a text label, so colour is never the only signal. The Khmer UI
uses *Noto Sans Khmer* with a larger line-height. The scanning animation respects
`prefers-reduced-motion`.

## 1.6 Configuration (environment variables)

These are defined in `backend/.env.example` in Phase 2 and read by `app/core/config.py`:

| Variable | Example / default | Purpose |
|----------|-------------------|---------|
| `DATABASE_URL` | `mysql+pymysql://facetrack:***@127.0.0.1:3306/facetrack?charset=utf8mb4` | DB connection |
| `JWT_SECRET` | 64 random bytes, base64 | Signs access tokens |
| `ACCESS_TOKEN_MINUTES` | `15` | Access token lifetime |
| `REFRESH_TOKEN_DAYS` | `7` | Refresh cookie lifetime |
| `TEMPLATE_KEY_ID` / `TEMPLATE_KEYS` | `k1` / `k1:<base64 32 bytes>` | Face-template encryption keys (supports rotation) |
| `FILE_KEY_ID` / `FILE_KEYS` | `f1` / `f1:<base64 32 bytes>` | Photo encryption keys |
| `CORS_ORIGINS` | `http://localhost:3000,http://127.0.0.1:3000` | Origins allowed to call the API directly (the Next.js proxy is same-origin and doesn't need it) |
| `MODEL_DIR` | `ml_models` | ONNX model location |
| `MAX_UPLOAD_MB` | `5` | Upload size cap |
| `TIMEZONE` | `Asia/Phnom_Penh` | Local timezone for attendance dates |
| `COOKIE_SECURE` | `false` in dev, `true` in prod | Refresh cookie over HTTPS only |

Values an Admin may tune at runtime (thresholds, duplicate window, work start time, retention days)
live in the `system_settings` table rather than in `.env`. Changing them is audited.
