from typing import Annotated

from fastapi import APIRouter, Depends
from sqlalchemy import select
from sqlalchemy.orm import selectinload

from app.api.deps import CurrentUser, DbSession, require_permission
from app.core.permissions import Perm
from app.models import Role
from app.schemas.common import error_responses
from app.schemas.role import RoleDetailOut

router = APIRouter(prefix="/roles", tags=["roles"])


@router.get("", response_model=list[RoleDetailOut], responses=error_responses(401, 403))
def list_roles(
    db: DbSession, _: Annotated[CurrentUser, Depends(require_permission(Perm.ROLES_MANAGE))]
) -> list[RoleDetailOut]:
    """Roles with their permissions (Admin only)."""
    roles = db.scalars(select(Role).options(selectinload(Role.permissions)).order_by(Role.id))
    return [
        RoleDetailOut(
            id=r.id,
            name=r.name,
            display_name=r.display_name,
            description=r.description,
            is_system=r.is_system,
            permissions=sorted(r.permission_codes),
        )
        for r in roles
    ]
