# FaceTrack AI — Backend

FastAPI + SQLAlchemy 2 + Alembic + MySQL 8. This stage provides the database schema, migrations,
JWT authentication with role-based permissions, health checks, error handling and tests.
Face recognition is **not** implemented yet (Phase 4).

## Requirements

| Tool | Version used | Notes |
|------|--------------|-------|
| Windows CPython | 3.14 (3.12+ works) | Use the `py` launcher. **Not** `C:\msys64\ucrt64\bin\python.exe`: it is first on `PATH` on this machine and cannot install Windows wheels. |
| MySQL | 8.4.3 (Laragon) | `C:\laragon\bin\mysql\mysql-8.4.3-winx64` |

All commands below are for **PowerShell**, run from the `backend` folder:

```powershell
cd "D:\Code All\Python_All\FaceTrack AI — Face Recognition & People Management System\backend"
```

## First-time setup

### 1. Start MySQL

Open Laragon and click **Start All**. Or start only MySQL with Laragon's config:

```powershell
Start-Process "C:\laragon\bin\mysql\mysql-8.4.3-winx64\bin\mysqld.exe" -ArgumentList '--defaults-file="C:\laragon\bin\mysql\mysql-8.4.3-winx64\my.ini"' -WindowStyle Hidden
```

### 2. Create the virtual environment and install packages

```powershell
py -3.14 -m venv .venv
.\.venv\Scripts\python.exe -m pip install -r requirements-dev.txt
```

(`requirements.txt` holds only the runtime packages. `requirements-dev.txt` adds pytest.)

In VS Code, pick the interpreter `backend\.venv\Scripts\python.exe` (*Python: Select Interpreter*).

### 3. Create `.env`

```powershell
Copy-Item .env.example .env
.\.venv\Scripts\python.exe -c "import secrets; print('DB password:', secrets.token_urlsafe(18)); print('JWT_SECRET:', secrets.token_urlsafe(48))"
```

Edit `.env`:

- Put the DB password into **both** `DATABASE_URL` and `TEST_DATABASE_URL`, replacing `CHANGE_ME`.
- Set `JWT_SECRET` (at least 32 characters).

`.env` is git-ignored. Never commit it.

### 4. Create the database and MySQL user

Edit `scripts\create_database.sql` locally, replacing `CHANGE_ME` with the same DB password, or pipe
it through a replace as shown below. Then run it as root. Laragon's root has no password by default.

```powershell
$pw = "<the DB password from step 3>"
(Get-Content scripts\create_database.sql -Raw) -replace 'CHANGE_ME', $pw | & "C:\laragon\bin\mysql\mysql-8.4.3-winx64\bin\mysql.exe" -u root
```

This creates the `facetrack` database (utf8mb4, for Khmer text) and a `facetrack` user. The user
has only the privileges the app needs on `facetrack`, plus full rights on the two test databases.

### 5. Run migrations and seed

```powershell
.\.venv\Scripts\python.exe -m alembic upgrade head
.\.venv\Scripts\python.exe -m app.cli seed --demo
```

`seed` creates the 20 permissions, the `admin` / `hr` / `viewer` roles, the default system
settings, and (with `--demo`) five sample departments/classes. It is safe to run again, and it
resets the three system roles to the default permissions.

### 6. Create your first admin

```powershell
.\.venv\Scripts\python.exe -m app.cli create-user --username admin --email admin@example.com --full-name "System Administrator" --role admin
```

You are prompted for the password twice. Policy: at least 10 characters, not repetitive, not a
common password, and it must not contain the username.

## Run the API

```powershell
.\.venv\Scripts\python.exe -m uvicorn app.main:app --reload --host 127.0.0.1 --port 8000
```

| URL | What |
|-----|------|
| http://127.0.0.1:8000/docs | Swagger UI (interactive) |
| http://127.0.0.1:8000/redoc | ReDoc |
| http://127.0.0.1:8000/api/v1/health | Liveness |
| http://127.0.0.1:8000/api/v1/health/ready | Database + migration status |

`/docs`, `/redoc` and `/openapi.json` are disabled when `APP_ENV=production`.

## Testing the API in /docs

1. Open **http://127.0.0.1:8000/docs**.
2. `GET /api/v1/health/ready` → **Try it out** → **Execute**. Expect `"database": "ok", "migrations": "up_to_date"`.
3. Click **Authorize** (top right). Enter the admin username and password, leave *client_id/secret* empty, then click **Authorize** and **Close**.
   This calls `POST /api/v1/auth/token`.
4. `GET /api/v1/auth/me` → you see your role and the permission list.
5. `GET /api/v1/roles` → the three roles with their permissions. A `viewer` or `hr` user gets
   `403 PERMISSION_DENIED`. Create one with `create-user --role viewer` to compare.
6. `POST /api/v1/auth/refresh`: enter `XMLHttpRequest` in the **X-Requested-With** field. The
   browser already holds the refresh cookie from step 3, so you get a new access token.
7. `POST /api/v1/auth/logout` → `204`. Calling `/auth/me` again returns `401 SESSION_REVOKED`.
   Click **Authorize → Logout** to clear Swagger's stored token.

Other things worth trying: a wrong password (generic `401 INVALID_CREDENTIALS`), six quick wrong
attempts (`429 RATE_LIMITED` with `Retry-After`), and an empty body (`422 VALIDATION_ERROR` with
per-field details).

## API endpoints (this stage)

| Method & path | Auth | Purpose |
|---------------|------|---------|
| `GET /api/v1/health` | — | Process is up |
| `GET /api/v1/health/ready` | — | DB reachable and migrations at head (503 otherwise) |
| `POST /api/v1/auth/login` | — | JSON `{username, password}`. Username or email. Returns access token + user, sets `ft_refresh` cookie. |
| `POST /api/v1/auth/token` | — | Same, as an OAuth2 password form (used by Swagger's Authorize) |
| `POST /api/v1/auth/refresh` | refresh cookie + `X-Requested-With: XMLHttpRequest` | Rotates the refresh token, returns a new access token |
| `POST /api/v1/auth/logout` | Bearer | Ends this sign-in (all its tokens) |
| `GET /api/v1/auth/me` | Bearer | Current user, role, permissions |
| `POST /api/v1/auth/change-password` | Bearer | Changes password and signs out every session |
| `GET /api/v1/roles` | Bearer + `roles.manage` | Roles and their permissions |

Every error has the same shape:

```json
{"error": {"code": "PERMISSION_DENIED", "message": "...", "details": null, "request_id": "..."}}
```

The `request_id` is also returned in the `X-Request-ID` header and stored in audit rows.

## How authentication works

- **Access token:** JWT (HS256), 15 minutes. It carries the user id and session id. On every request
  the server also checks that the sign-in session has not been revoked, so logout works immediately.
- **Refresh token:** a random 256-bit value in an `HttpOnly; SameSite=Strict; Path=/api/v1/auth`
  cookie (`Secure` when `COOKIE_SECURE=true`). The database stores only its SHA-256 hash. Each
  refresh rotates it. Replaying an old refresh token revokes the whole sign-in and is audited as
  `auth.refresh_reuse`.
- **Passwords:** Argon2id (`pwdlib`). Unknown usernames still run a hash check, so response timing
  does not reveal which accounts exist.
- **Brute force:** 5 attempts/min per IP+username and 30/min per IP. The account is locked for 15
  minutes after 10 consecutive failures. All limits are configurable in `.env`. The limiter is
  in-memory, so it assumes a single server process.
- **Audit:** `auth.login`, `auth.login_failed` (with reason), `auth.lockout`, `auth.logout`,
  `auth.refresh_reuse` and `auth.password_changed` are written to `audit_logs`.

## Run the tests

```powershell
.\.venv\Scripts\python.exe -m pytest
```

The tests use the real MySQL server. At startup they **drop and recreate** `facetrack_test` (from
`TEST_DATABASE_URL`) and `facetrack_test_mig`, and they refuse any database whose name lacks
`test`. Each test runs in a transaction that is rolled back. There are 60 tests covering:

- Login, lockout, rate limits, token expiry/tampering, refresh rotation and reuse detection, logout,
  password change, RBAC per role, and audit rows
- Error envelope (404 / 422 / 500 without leaking details), request IDs and security headers
- Health and readiness, including detection of pending migrations
- Models: Khmer text round-trip, unique codes, cascade deletes of biometric data, refusal of naive datetimes
- Migrations: `upgrade head`, `alembic check` (models and migration in sync), `downgrade base`, upgrade again

## Database migrations

```powershell
.\.venv\Scripts\python.exe -m alembic current                      # applied revision
.\.venv\Scripts\python.exe -m alembic revision --autogenerate -m "describe change"
.\.venv\Scripts\python.exe -m alembic upgrade head
.\.venv\Scripts\python.exe -m alembic check                        # fails if models and migrations differ
```

Always read an autogenerated migration before applying it. On MySQL, don't drop an index that backs
a foreign key; drop the table or the foreign key first.

## Project layout

```text
backend/
├── alembic/                 env.py, versions/20261023_0001_initial_schema.py
├── app/
│   ├── main.py              app factory: middleware, CORS, error handlers, routers
│   ├── cli.py               seed, create-user
│   ├── core/                config, security (hash/JWT), permissions, errors, rate_limit, middleware
│   ├── db/                  Base + naming conventions, UTCDateTime type, engine/session
│   ├── models/              users, roles, people, departments, consent, face_templates,
│   │                        attendance, scan_events, audit_logs, system_settings
│   ├── schemas/             Pydantic request/response models
│   ├── services/            auth, users, audit, seed (no FastAPI imports)
│   └── api/                 deps (current user, require_permission) and v1 routers
├── scripts/create_database.sql
└── tests/                   unit/, api/, test_migrations.py
```

## Troubleshooting

| Symptom | Fix |
|---------|-----|
| `Can't connect to MySQL server on '127.0.0.1'` | Start MySQL (Laragon → Start All). |
| `Access denied for user 'facetrack'` | The password in `.env` differs from the one used in `create_database.sql`. |
| `/health/ready` says `"migrations": "pending"` | Run `python -m alembic upgrade head`. |
| `pip` tries to compile packages / `No module named numpy` later | You are using the MSYS2 Python. Recreate `.venv` with `py -3.14 -m venv .venv`. |
| Khmer shows as `???` in the `mysql` console | It is only the console encoding. The data is stored as utf8mb4. |
