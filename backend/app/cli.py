"""Management commands.

    python -m app.cli seed [--demo]
    python -m app.cli create-user --username admin --email admin@example.com --full-name "System Admin" --role admin
"""

import argparse
import getpass
import os
import sys

from app.core.errors import AppError
from app.db.session import get_sessionmaker
from app.services import seed_service, user_service


def _seed(args: argparse.Namespace) -> int:
    with get_sessionmaker()() as db:
        report = seed_service.seed_core(db)
        if args.demo:
            seed_service.seed_demo_departments(db, report)
        db.commit()
    if report.created:
        print("Created:\n  " + "\n  ".join(report.created))
    else:
        print("Nothing to create; database already seeded.")
    print("System role permissions are in sync with the defaults.")
    return 0


def _read_password(env_var: str | None) -> str:
    if env_var:
        value = os.environ.get(env_var)
        if not value:
            raise SystemExit(f"Environment variable {env_var} is empty or not set.")
        return value
    first = getpass.getpass("Password (min 10 characters): ")
    second = getpass.getpass("Repeat password: ")
    if first != second:
        raise SystemExit("Passwords do not match.")
    return first


def _create_user(args: argparse.Namespace) -> int:
    password = _read_password(args.password_env)
    with get_sessionmaker()() as db:
        try:
            user = user_service.create_user(
                db,
                username=args.username,
                email=args.email,
                full_name=args.full_name,
                password=password,
                role_name=args.role,
            )
            db.commit()
        except AppError as exc:
            print(f"Error: {exc.message}", file=sys.stderr)
            for detail in exc.details or []:
                print(f"  - {detail['field']}: {detail['message']}", file=sys.stderr)
            return 1
    print(f"Created user '{user.username}' (id={user.id}, role={args.role}).")
    return 0


def main(argv: list[str] | None = None) -> int:
    # Windows consoles default to cp1252 when output is redirected; Khmer text would crash print().
    for stream in (sys.stdout, sys.stderr):
        if hasattr(stream, "reconfigure"):
            stream.reconfigure(encoding="utf-8", errors="replace")

    parser = argparse.ArgumentParser(prog="python -m app.cli", description="FaceTrack AI management commands")
    sub = parser.add_subparsers(dest="command", required=True)

    seed = sub.add_parser("seed", help="Create roles, permissions and default settings")
    seed.add_argument("--demo", action="store_true", help="Also create sample departments/classes")
    seed.set_defaults(func=_seed)

    create = sub.add_parser("create-user", help="Create an operator account")
    create.add_argument("--username", required=True)
    create.add_argument("--email", required=True)
    create.add_argument("--full-name", required=True)
    create.add_argument("--role", choices=["admin", "hr", "viewer"], required=True)
    create.add_argument("--password-env", metavar="VAR", help="Read the password from this environment variable")
    create.set_defaults(func=_create_user)

    args = parser.parse_args(argv)
    return args.func(args)


if __name__ == "__main__":
    raise SystemExit(main())
