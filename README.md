# FaceTrack AI — Face Recognition & People Management System

A portfolio-grade system for managing employees or students, recording attendance, and
identifying **enrolled, consenting** people from a webcam scan or an uploaded photo.

> Face recognition here is an *assistive* tool. Every match carries a similarity score, uncertain
> results go to a human for review, and a non-biometric path (manual / ID-based attendance) is
> always available. The system never makes an access, employment or enrollment decision on its own.

## Status

| Phase | Scope | Status |
|------|-------|--------|
| 1 | Architecture, folder structure, database schema, recognition workflow | **Done (design docs)** |
| 2 | Backend setup, DB connection, Alembic migrations, JWT auth + RBAC | **Done**: see [backend/README.md](backend/README.md) (60 tests passing) |
| 3 | People / department CRUD APIs | Not started |
| 4 | Face enrollment, encrypted templates, recognition API | Not started |
| 5 | Next.js + TypeScript + Tailwind + shadcn/ui frontend | **In progress**: shell, auth, RBAC, dashboard, settings, camera/upload UI done; data pages wait for Phases 3, 4 and 6. See [frontend/README.md](frontend/README.md) |
| 6 | Attendance, reports, audit logs, security hardening | Not started |
| 7 | End-to-end testing, threshold calibration, deployment docs | Not started |

## Quick start (Windows)

1. Start MySQL (Laragon → **Start All**).
2. Backend: first-time setup in **[backend/README.md](backend/README.md)**, then
   ```powershell
   cd backend
   .\.venv\Scripts\python.exe -m uvicorn app.main:app --reload --host 127.0.0.1 --port 8000
   ```
3. Frontend: first-time setup in **[frontend/README.md](frontend/README.md)**, then, in a second terminal,
   ```powershell
   cd frontend
   npm run dev
   ```
4. Open **http://localhost:3000** and sign in. The API docs stay at http://127.0.0.1:8000/docs.

## Design documents (Phase 1)

1. [Architecture & folder structure](docs/01-architecture.md)
2. [Database schema](docs/02-database-schema.md)
3. [Face recognition workflow](docs/03-recognition-workflow.md)
4. [Security, privacy, consent & retention](docs/04-security-privacy.md)

## Technology stack

| Layer | Choice |
|-------|--------|
| Backend | Python 3.12+ (developed on 3.14), FastAPI, Pydantic v2 |
| Database | MySQL 8.4 (Laragon), SQLAlchemy 2.x, Alembic, PyMySQL driver |
| Face processing | OpenCV 4.x DNN: **YuNet** detector + **SFace** 128‑d embeddings (ONNX) |
| Auth | JWT access tokens (PyJWT) + rotating refresh cookie, Argon2 hashing (pwdlib) |
| Crypto | AES‑256‑GCM (`cryptography`) for face templates and stored photos |
| Frontend | Next.js 16 (App Router) + TypeScript, Tailwind CSS 4, shadcn/ui (Radix), React Hook Form + Zod, TanStack Table 9, Recharts 3, Lucide icons; Geist + Noto Sans Khmer |

## Prerequisites (Windows)

| Tool | Notes |
|------|-------|
| **Native Windows CPython 3.12–3.14** | Use the `py` launcher (`py -3.14`). **Do not use the MSYS2 Python** at `C:\msys64\ucrt64\bin\python.exe` — it is first on this machine's `PATH` and cannot install the OpenCV/NumPy Windows wheels. |
| Node.js 22 | Installed. npm scripts call tools through `node` because the folder path contains `&` (see frontend/README.md). |
| MySQL 8.x | Laragon's MySQL 8.4.3 is installed. |
| ~40 MB of model weights | Downloaded by a script in Phase 4 (YuNet ≈ 0.2 MB, SFace ≈ 37 MB). |

No C/C++ compiler is required: every backend dependency installs from pre-built wheels.
