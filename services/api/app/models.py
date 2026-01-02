from __future__ import annotations

import enum
from datetime import datetime

from sqlalchemy import DateTime, Enum, Integer, String, Text
from sqlalchemy.orm import Mapped, mapped_column

from .db import Base


class JobType(str, enum.Enum):
    export_all = "export_all"
    markdown = "markdown"
    clustering = "clustering"


class JobStatus(str, enum.Enum):
    queued = "queued"
    running = "running"
    succeeded = "succeeded"
    failed = "failed"


class Job(Base):
    __tablename__ = "jobs"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)

    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=datetime.utcnow)
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=datetime.utcnow)

    job_type: Mapped[JobType] = mapped_column(Enum(JobType, native_enum=False), index=True)
    status: Mapped[JobStatus] = mapped_column(Enum(JobStatus, native_enum=False), index=True, default=JobStatus.queued)

    filename: Mapped[str] = mapped_column(String(512))

    # Params (stringified JSON for MVP)
    params_json: Mapped[str] = mapped_column(Text, default="{}")

    # Artifact paths (within data_dir)
    input_path: Mapped[str] = mapped_column(String(1024))
    output_dir: Mapped[str] = mapped_column(String(1024), default="")
    zip_path: Mapped[str] = mapped_column(String(1024), default="")
    log_path: Mapped[str] = mapped_column(String(1024), default="")

    error: Mapped[str] = mapped_column(Text, default="")
