from __future__ import annotations

import json
from pathlib import Path
from typing import Any

from .settings import settings


def data_root() -> Path:
    return Path(settings.data_dir)


def job_dir(job_id: int) -> Path:
    p = data_root() / "jobs" / str(job_id)
    p.mkdir(parents=True, exist_ok=True)
    return p


def write_job_params(job_id: int, params: dict[str, Any]) -> Path:
    p = job_dir(job_id) / "params.json"
    p.write_text(json.dumps(params, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    return p
