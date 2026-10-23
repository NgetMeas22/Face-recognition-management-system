"""User account creation and lookup."""

import re

from sqlalchemy import func, select
from sqlalchemy.orm import Session, selectinload

from app.core.errors import AppError, ConflictError, NotFoundError
from app.core.security import hash_password, password_problems
from app.models import Role, User

USERNAME_RE = re.compile(r"^[a-z0-9._-]{3,50}$")
EMAIL_RE = re.compile(r"^[^@\s]+@[^@\s]+\.[^@\s]+$")


def normalize_username(username: str) -> str:
    return username.strip().lower()


def get_user_with_role(db: Session, user_id: int) -> User | None:
    stmt = select(User).where(User.id == user_id).options(selectinload(User.role).selectinload(Role.permissions))
    return db.scalar(stmt)


def find_by_login(db: Session, login: str) -> User | None:
    login = login.strip().lower()
    column = User.email if "@" in login else User.username
    stmt = select(User).where(func.lower(column) == login).options(
        selectinload(User.role).selectinload(Role.permissions)
    )
    return db.scalar(stmt)


def create_user(db: Session, *, username: str, email: str, full_name: str, password: str, role_name: str) -> User:
    username = normalize_username(username)
    email = email.strip().lower()
    full_name = full_name.strip()

    errors: list[dict[str, str]] = []
    if not USERNAME_RE.match(username):
        errors.append({"field": "username", "message": "3–50 characters: a-z, 0-9, dot, dash, underscore."})
    if not EMAIL_RE.match(email) or len(email) > 255:
        errors.append({"field": "email", "message": "Enter a valid email address."})
    if not full_name or len(full_name) > 150:
        errors.append({"field": "full_name", "message": "Full name is required (max 150 characters)."})
    errors += [{"field": "password", "message": p} for p in password_problems(password, username)]
    if errors:
        raise AppError("Some fields are invalid.", code="VALIDATION_ERROR", status_code=422, details=errors)

    role = db.scalar(select(Role).where(Role.name == role_name))
    if role is None:
        raise NotFoundError(f"Role '{role_name}' does not exist. Run the seed command first.")
    if db.scalar(select(User.id).where(User.username == username)):
        raise ConflictError("That username is already taken.", code="USERNAME_TAKEN")
    if db.scalar(select(User.id).where(User.email == email)):
        raise ConflictError("That email is already in use.", code="EMAIL_TAKEN")

    user = User(
        username=username,
        email=email,
        full_name=full_name,
        password_hash=hash_password(password),
        role=role,
    )
    db.add(user)
    db.flush()
    return user
