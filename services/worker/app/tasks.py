from __future__ import annotations

import json
import os
import subprocess
import time
import zipfile
from datetime import datetime
from pathlib import Path
from typing import Any

from celery.utils.log import get_task_logger
from sqlalchemy import text

from .celery_app import celery_app
from .db import SessionLocal
from .settings import settings

logger = get_task_logger(__name__)


def _job_dir(job_id: int) -> Path:
    p = Path(settings.data_dir) / "jobs" / str(job_id)
    p.mkdir(parents=True, exist_ok=True)
    return p


def _write_log_line(log_path: Path, line: str) -> None:
    log_path.parent.mkdir(parents=True, exist_ok=True)
    with log_path.open("a", encoding="utf-8") as f:
        f.write(line)
        if not line.endswith("\n"):
            f.write("\n")


def _zip_dir(src_dir: Path, zip_path: Path) -> None:
    if zip_path.exists():
        zip_path.unlink()
    with zipfile.ZipFile(zip_path, "w", compression=zipfile.ZIP_DEFLATED) as zf:
        for p in src_dir.rglob("*"):
            if p.is_dir():
                continue
            zf.write(p, p.relative_to(src_dir).as_posix())


def _update_job(db, job_id: int, **fields: Any) -> None:
    sets = []
    params = {"job_id": job_id}
    for k, v in fields.items():
        sets.append(f"{k} = :{k}")
        params[k] = v
    sets.append("updated_at = :updated_at")
    params["updated_at"] = datetime.utcnow()
    q = f"UPDATE jobs SET {', '.join(sets)} WHERE id = :job_id"
    db.execute(text(q), params)
    db.commit()


@celery_app.task(name="worker.tasks.process_job")
def process_job(job_id: int) -> None:
    started = time.time()
    jd = _job_dir(job_id)
    input_pdf = jd / "input.pdf"
    params_path = jd / "params.json"
    log_path = jd / "job.log"

    with SessionLocal() as db:
        _update_job(db, job_id, status="running", error="")

    if not input_pdf.exists():
        with SessionLocal() as db:
            _update_job(db, job_id, status="failed", error="input.pdf missing")
        return

    params: dict[str, Any] = {}
    if params_path.exists():
        try:
            params = json.loads(params_path.read_text(encoding="utf-8"))
        except Exception:
            params = {}

    # Read job_type from DB
    with SessionLocal() as db:
        row = db.execute(text("SELECT job_type FROM jobs WHERE id = :id"), {"id": job_id}).fetchone()
        if not row:
            return
        job_type = row[0]

    # Build command
    out_root = jd / "outputs"
    out_root.mkdir(parents=True, exist_ok=True)

    cmd: list[str]
    output_dir: Path

    if job_type == "export_all":
        output_dir = out_root / "export_all"
        formats = params.get("formats", "md,pdf")
        mode = params.get("mode", "auto")
        topic_regex = params.get("topic_regex", r"^(tema|unidad|cap[ií]tulo)\s*\d+\b")
        heading_scale = str(params.get("heading_scale", 1.6))
        start_page = str(params.get("start_page", 1))
        toc_max_pages = str(params.get("toc_max_pages", 40))
        cmd = [
            "python",
            "/app/core/export_topics.py",
            str(input_pdf),
            "--outdir",
            str(output_dir),
            "--formats",
            str(formats),
            "--mode",
            str(mode),
            "--topic-regex",
            str(topic_regex),
            "--heading-scale",
            heading_scale,
            "--start-page",
            start_page,
            "--toc-max-pages",
            toc_max_pages,
        ]
        if "end_page" in params:
            cmd += ["--end-page", str(params["end_page"])]

    elif job_type == "markdown":
        output_dir = out_root / "md"
        topic_regex = params.get("topic_regex", r"^(tema|unidad|cap[ií]tulo)\s*\d+\b")
        heading_scale = str(params.get("heading_scale", 1.6))
        start_page = str(params.get("start_page", 1))
        toc_max_pages = str(params.get("toc_max_pages", 40))
        use_toc = params.get("use_toc", True)
        cmd = [
            "python",
            "/app/core/extract_topics_md.py",
            str(input_pdf),
            "--outdir",
            str(output_dir),
            "--topic-regex",
            str(topic_regex),
            "--heading-scale",
            heading_scale,
            "--start-page",
            start_page,
            "--toc-max-pages",
            toc_max_pages,
        ]
        if "end_page" in params:
            cmd += ["--end-page", str(params["end_page"])]
        if use_toc:
            cmd += ["--use-toc"]

    elif job_type == "clustering":
        output_dir = out_root / "clusters"
        model = params.get("model", "all-MiniLM-L6-v2")
        min_chars = str(params.get("min_chars", 400))
        cmd = [
            "python",
            "/app/core/extract_themes.py",
            str(input_pdf),
            "--outdir",
            str(output_dir),
            "--model",
            str(model),
            "--min-chars",
            min_chars,
        ]
        if "n_clusters" in params:
            cmd += ["--n-clusters", str(params["n_clusters"])]

    else:
        with SessionLocal() as db:
            _update_job(db, job_id, status="failed", error=f"unknown job_type: {job_type}")
        return

    _write_log_line(log_path, f"[{datetime.utcnow().isoformat()}] Running: {' '.join(cmd)}")

    env = os.environ.copy()
    env["PYTHONUNBUFFERED"] = "1"

    try:
        proc = subprocess.Popen(
            cmd,
            cwd="/app",
            stdout=subprocess.PIPE,
            stderr=subprocess.STDOUT,
            text=True,
            env=env,
        )
        assert proc.stdout is not None
        for line in proc.stdout:
            _write_log_line(log_path, line.rstrip("\n"))
        rc = proc.wait()
    except Exception as e:
        with SessionLocal() as db:
            _update_job(db, job_id, status="failed", error=str(e), log_path=str(log_path))
        return

    if rc != 0:
        with SessionLocal() as db:
            _update_job(db, job_id, status="failed", error=f"command failed: exit {rc}", log_path=str(log_path))
        return

    # Zip outputs
    zip_path = jd / "artifacts.zip"
    _zip_dir(out_root, zip_path)

    elapsed = time.time() - started
    _write_log_line(log_path, f"[{datetime.utcnow().isoformat()}] Done in {elapsed:.1f}s")

    with SessionLocal() as db:
        _update_job(
            db,
            job_id,
            status="succeeded",
            output_dir=str(out_root),
            zip_path=str(zip_path),
            log_path=str(log_path),
            error="",
        )
