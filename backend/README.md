# FaceTrack AI — Backend

FastAPI + SQLAlchemy 2 + Alembic + **PostgreSQL** (psycopg 3). This stage provides the database
schema, migrations, JWT authentication with role-based permissions, health checks, error handling
and tests. Face recognition is **not** implemented yet (Phase 4).

## Requirements

| Tool | Version used | Notes |
|------|--------------|-------|
| Windows CPython | 3.14 (3.12+ works) | Use the `py` launcher. **Not** `C:\msys64\ucrt64\bin\python.exe`: it is first on `PATH` on this machine and cannot install Windows wheels. |
| PostgreSQL | 18 (15+ works) | Windows installer from EDB, which includes **pgAdmin 4**. Default port 5432. |

The Python driver `psycopg[binary]` bundles its own libpq, so the app needs no PostgreSQL client
libraries. `psql.exe` is used below only for the one-time setup script.

All commands below are for **PowerShell**, run from the `backend` folder:

```powershell
cd "D:\Code All\Python_All\FaceTrack AI — Face Recognition & People Management System\backend"
$psql = "C:\Program Files\PostgreSQL\18\bin\psql.exe"   # adjust 18 to your version
```

## First-time setup

### 1. Install PostgreSQL and pgAdmin 4

1. Download the Windows installer from https://www.postgresql.org/download/windows/ (EDB).
2. Keep the components **PostgreSQL Server**, **pgAdmin 4** and **Command Line Tools**.
3. Set a password for the `postgres` superuser and keep it safe. The app never uses this
   account; it's only for step 4.
4. Port **5432**, default locale. The installer registers a Windows service that starts automatically.

Check that the server is running:

```powershell
Get-Service postgresql*            # Status should be Running
& $psql --version
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
.\.venv\Scripts\python.exe -c "import secrets; print('POSTGRES_PASSWORD:', secrets.token_urlsafe(24)); print('JWT_SECRET:', secrets.token_urlsafe(48))"
```

Edit `.env` and set `POSTGRES_PASSWORD` and `JWT_SECRET`. The connection settings are read from
environment variables, with these defaults:

| Variable | Default | Meaning |
|----------|---------|---------|
| `POSTGRES_HOST` | `localhost` | Server host |
| `POSTGRES_PORT` | `5432` | Server port |
| `POSTGRES_DB` | `facetrack` | Application database |
| `POSTGRES_USER` | `facetrack` | Application role (not a superuser) |
| `POSTGRES_PASSWORD` | — | That role's password |
| `POSTGRES_TEST_DB` | `facetrack_test` | pytest database. Its schema is **wiped** on every test run. |
| `DATABASE_URL` / `TEST_DATABASE_URL` | unset | Optional full URLs (`postgresql+psycopg://…`) that override the parts above |

Real environment variables override `.env`. Special characters in `POSTGRES_PASSWORD` are fine;
the URL is built and escaped for you. `.env` is git-ignored. Never commit it.

### 4. Create the role and databases

This creates the login role `facetrack` (no superuser, no `CREATEDB`) and three databases it owns:
`facetrack`, `facetrack_test` and `facetrack_test_mig`. They use UTF-8 encoding and ICU collation,
so Khmer text is stored and sorted correctly. The script is idempotent and never drops anything.

**Option A: psql** (prompts for the `postgres` password):

```powershell
$appPw = (Select-String -Path .env -Pattern '^POSTGRES_PASSWORD=(.*)$').Matches[0].Groups[1].Value
& $psql -h localhost -U postgres -d postgres -v app_password="$appPw" -f scripts\create_database.sql
```

**Option B: pgAdmin 4.**

1. Open **pgAdmin 4** → *Servers* → *PostgreSQL 18* → enter the `postgres` password.
2. Right-click **Login/Group Roles** → *Create* → *Login/Group Role…*:
   - *General* → Name: `facetrack`
   - *Definition* → Password: the `POSTGRES_PASSWORD` from `.env`
   - *Privileges* → **Can login? = Yes**; leave *Superuser*, *Create roles* and *Create databases* **off**
   - Save
3. Right-click **Databases** → *Create* → *Database…*:
   - *General* → Database: `facetrack`, Owner: `facetrack`
   - *Definition* → Encoding `UTF8`, Template `template0`, Locale provider `icu`, ICU locale `und`
   - Save. Repeat for **`facetrack_test`** and **`facetrack_test_mig`**.
4. Or open *Tools → Query Tool* on the `postgres` database and run the same thing as SQL. Replace
   the password first:
   ```sql
   CREATE ROLE facetrack LOGIN PASSWORD 'CHANGE_ME' NOSUPERUSER NOCREATEDB NOCREATEROLE;
   CREATE DATABASE facetrack          OWNER facetrack ENCODING 'UTF8' TEMPLATE template0 LOCALE_PROVIDER icu ICU_LOCALE 'und';
   CREATE DATABASE facetrack_test     OWNER facetrack ENCODING 'UTF8' TEMPLATE template0 LOCALE_PROVIDER icu ICU_LOCALE 'und';
   CREATE DATABASE facetrack_test_mig OWNER facetrack ENCODING 'UTF8' TEMPLATE template0 LOCALE_PROVIDER icu ICU_LOCALE 'und';
   REVOKE CONNECT, TEMPORARY ON DATABASE facetrack, facetrack_test, facetrack_test_mig FROM PUBLIC;
   ```
   (`CREATE DATABASE` can't run inside a transaction. In pgAdmin, run the statements one at a time
   if it complains.)

To browse the data later, register a connection in pgAdmin as `facetrack` (not `postgres`):
*Object → Register → Server…* → Host `localhost`, Port `5432`, Maintenance DB `facetrack`, Username `facetrack`.

### 5. Run migrations and seed

```powershell
.\.venv\Scripts\python.exe -m alembic upgrade head
.\.venv\Scripts\python.exe -m alembic current       # should print: 0001 (head)
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

### 7. Verify the PostgreSQL connection

```powershell
# a) The app's own check: database reachable + migrations at head
.\.venv\Scripts\python.exe -c "from sqlalchemy import text; from app.db.session import get_engine; c=get_engine().connect(); print(c.execute(text('select current_user, current_database(), version()')).one()); c.close()"

# b) Through the API (start it first, see below)
Invoke-RestMethod http://127.0.0.1:8000/api/v1/health/ready
#   status: ok   database: ok   migrations: up_to_date   current_revision: 0001

# c) With psql, as the app role
& $psql -h localhost -U facetrack -d facetrack -c "\dt"     # 15 tables: 14 app tables + alembic_version
```

In pgAdmin: *facetrack → Schemas → public → Tables* shows the same 15 tables.

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

The tests use the real PostgreSQL server. At startup they **drop and recreate the `public` schema**
of `facetrack_test` (`POSTGRES_TEST_DB`) and `facetrack_test_mig`, then build it with Alembic. They
refuse any database whose name lacks `test`, and they never touch `facetrack`. The test databases
must exist (step 4 creates them); the app role owns them, so it needs no `CREATEDB` privilege. Each
test runs in a transaction that is rolled back. There are 74 tests covering:

- Login, lockout, rate limits, token expiry/tampering, refresh rotation and reuse detection, logout,
  password change, RBAC per role, and audit rows
- Error envelope (404 / 422 / 500 without leaking details), request IDs and security headers
- Health and readiness, including detection of pending migrations
- Models: Khmer text round-trip, unique codes, cascade deletes of biometric data, refusal of naive datetimes
- Migrations: `upgrade head`, `alembic check` (models and migration in sync), `downgrade base`, upgrade again
- PostgreSQL specifics: CHECK constraints (enum values, lowercase usernames/emails, attendance and
  archive rules), `timestamptz` round-trips as UTC under another session time zone, JSONB queries,
  identity primary keys, an index on every foreign key that can cascade, UTF-8 server encoding
- Config: URL built from `POSTGRES_*` with special-character passwords, `DATABASE_URL` override,
  rejection of non-psycopg-3 URLs (`mysql+pymysql://`, `postgresql+psycopg2://`)

## Database migrations

```powershell
.\.venv\Scripts\python.exe -m alembic current                      # applied revision
.\.venv\Scripts\python.exe -m alembic revision --autogenerate -m "describe change"
.\.venv\Scripts\python.exe -m alembic upgrade head
.\.venv\Scripts\python.exe -m alembic check                        # fails if models and migrations differ
```

Always read an autogenerated migration before applying it. Things to watch for on PostgreSQL:

- **Enums** are `VARCHAR` + a `CHECK` constraint named `ck_<table>_<enum name>`, not native `ENUM`
  types. Adding a value means changing the model; Alembic does **not** autogenerate CHECK changes,
  so add `op.drop_constraint(...)` / `op.create_check_constraint(...)` by hand.
- **Foreign keys are not indexed automatically** (MySQL did that). Add `index=True` to new FK
  columns that are filtered on or that cascade.
- **Text comparison is case-sensitive.** Normalise values (as usernames and emails are) or use
  `func.lower()` with a matching expression index.
- Avoid `ALTER TABLE … ADD COLUMN … NOT NULL` without a `server_default` on tables that already have rows.

## Project layout

```text
backend/
├── alembic/                 env.py, versions/20261023_0001_initial_schema_postgresql.py
│                            (legacy_mysql/ keeps the old MySQL migration for reference; not loaded)
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
├── scripts/create_database.sql   PostgreSQL role + databases (legacy/ has the old MySQL script)
└── tests/                   unit/, api/, test_migrations.py
```

## Troubleshooting

| Symptom | Fix |
|---------|-----|
| `connection refused` / `Is the server running on that host and accepting TCP/IP connections?` | Start the service: `Start-Service postgresql-x64-18` (or *Services* → postgresql-x64-18). |
| `password authentication failed for user "facetrack"` | `POSTGRES_PASSWORD` in `.env` differs from the role's password. Reset it in pgAdmin (*Login/Group Roles → facetrack → Definition*) or with `ALTER ROLE facetrack PASSWORD '...'` as postgres. |
| `database "facetrack" does not exist` | Run step 4. |
| `Database URLs must use 'postgresql+psycopg://'` | A `DATABASE_URL` in `.env` or the environment uses another driver (e.g. `psycopg2` or MySQL). Remove it, or change the scheme. |
| `permission denied for schema public` | The database isn't owned by `facetrack`. Run `ALTER DATABASE facetrack OWNER TO facetrack;` as postgres. |
| `/health/ready` says `"migrations": "pending"` | Run `python -m alembic upgrade head`. |
| `pip` tries to compile packages / `No module named numpy` later | You are using the MSYS2 Python. Recreate `.venv` with `py -3.14 -m venv .venv`. |
| Khmer shows as `???` in `psql` | Only the Windows console code page. Run `chcp 65001` first, or view the data in pgAdmin. It is stored as UTF-8. |

## Moving from the earlier MySQL setup

Earlier versions used MySQL 8 (Laragon). The MySQL database was left untouched; nothing was
converted because it held only demo data (3 demo accounts, 5 seeded departments, test-login audit
rows). On PostgreSQL the same data is recreated with `seed --demo` and `create-user`. If you ever
need to copy real data across, export each table to CSV from MySQL and use `\copy` in psql in
foreign-key order (roles → permissions → role_permissions → users → departments → people → …).
