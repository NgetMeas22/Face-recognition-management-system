from datetime import datetime
from typing import Literal

from pydantic import BaseModel


class HealthOut(BaseModel):
    status: Literal["ok"]
    app: str
    version: str
    environment: str
    time: datetime


class ReadinessOut(BaseModel):
    status: Literal["ok", "degraded", "unavailable"]
    database: Literal["ok", "unavailable"]
    migrations: Literal["up_to_date", "pending", "unknown"]
    current_revision: str | None
    head_revision: str | None
