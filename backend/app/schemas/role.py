from pydantic import BaseModel, ConfigDict


class RoleDetailOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    name: str
    display_name: str
    description: str | None
    is_system: bool
    permissions: list[str]
