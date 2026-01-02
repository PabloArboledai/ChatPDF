from __future__ import annotations

from datetime import datetime
from typing import Any, Optional

from pydantic import BaseModel


class JobCreateResponse(BaseModel):
    id: int


class JobOut(BaseModel):
    id: int
    created_at: datetime
    updated_at: datetime
    job_type: str
    status: str
    filename: str
    params: dict[str, Any]
    output_dir: str
    zip_path: str
    log_path: str
    error: str


class JobList(BaseModel):
    items: list[JobOut]


class HealthOut(BaseModel):
    ok: bool
    environment: str
