from __future__ import annotations

import json
from datetime import datetime
from pathlib import Path
from typing import Any, Optional

from fastapi import Depends, FastAPI, File, Form, HTTPException, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse
from sqlalchemy import desc
from sqlalchemy.orm import Session

from .celery_client import celery_app
from .db import get_db, init_db
from .models import Job, JobStatus, JobType
from .schemas import HealthOut, JobCreateResponse, JobList, JobOut
from .settings import settings
from .storage import job_dir, write_job_params


app = FastAPI(title="ChatPDF API", version="0.1.0")


app.add_middleware(
    CORSMiddleware,
    allow_origins=[o.strip() for o in settings.cors_origins.split(",") if o.strip()] or ["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.on_event("startup")
def _startup() -> None:
    init_db()


@app.get("/health", response_model=HealthOut)
def health() -> HealthOut:
    return HealthOut(ok=True, environment=settings.environment)


def _job_to_out(job: Job) -> JobOut:
    try:
        params = json.loads(job.params_json or "{}")
    except Exception:
        params = {}

    return JobOut(
        id=job.id,
        created_at=job.created_at,
        updated_at=job.updated_at,
        job_type=str(job.job_type),
        status=str(job.status),
        filename=job.filename,
        params=params,
        output_dir=job.output_dir,
        zip_path=job.zip_path,
        log_path=job.log_path,
        error=job.error,
    )


@app.get("/jobs", response_model=JobList)
def list_jobs(db: Session = Depends(get_db)) -> JobList:
    jobs = db.query(Job).order_by(desc(Job.id)).limit(200).all()
    return JobList(items=[_job_to_out(j) for j in jobs])


@app.get("/jobs/{job_id}", response_model=JobOut)
def get_job(job_id: int, db: Session = Depends(get_db)) -> JobOut:
    job = db.get(Job, job_id)
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")
    return _job_to_out(job)


@app.post("/jobs", response_model=JobCreateResponse)
def create_job(
    file: UploadFile = File(...),
    job_type: JobType = Form(...),
    # Common parameters
    mode: Optional[str] = Form(default=None),
    formats: Optional[str] = Form(default=None),
    topic_regex: Optional[str] = Form(default=None),
    heading_scale: Optional[float] = Form(default=None),
    start_page: Optional[int] = Form(default=None),
    end_page: Optional[int] = Form(default=None),
    toc_max_pages: Optional[int] = Form(default=None),
    # Clustering only
    model: Optional[str] = Form(default=None),
    min_chars: Optional[int] = Form(default=None),
    n_clusters: Optional[int] = Form(default=None),
    db: Session = Depends(get_db),
) -> JobCreateResponse:
    # 1) Create job row first to get ID
    job = Job(
        job_type=job_type,
        status=JobStatus.queued,
        filename=file.filename or "documento.pdf",
        params_json="{}",
        input_path="",
        output_dir="",
        zip_path="",
        log_path="",
        error="",
        created_at=datetime.utcnow(),
        updated_at=datetime.utcnow(),
    )
    db.add(job)
    db.commit()
    db.refresh(job)

    # 2) Save upload
    jd = job_dir(job.id)
    input_path = jd / "input.pdf"
    with input_path.open("wb") as f:
        shutil_copyfileobj(file.file, f)

    # 3) Save params
    params: dict[str, Any] = {
        "mode": mode,
        "formats": formats,
        "topic_regex": topic_regex,
        "heading_scale": heading_scale,
        "start_page": start_page,
        "end_page": end_page,
        "toc_max_pages": toc_max_pages,
        "model": model,
        "min_chars": min_chars,
        "n_clusters": n_clusters,
    }
    # remove None
    params = {k: v for k, v in params.items() if v is not None}

    write_job_params(job.id, params)

    # 4) Update job paths
    job.input_path = str(input_path)
    job.params_json = json.dumps(params, ensure_ascii=False)
    job.log_path = str(jd / "job.log")
    db.add(job)
    db.commit()

    # 5) Enqueue
    queue = "ml" if job_type == JobType.clustering else "default"
    celery_app.send_task("worker.tasks.process_job", args=[job.id], queue=queue)

    return JobCreateResponse(id=job.id)


@app.get("/jobs/{job_id}/logs")
def download_job_logs(job_id: int, db: Session = Depends(get_db)):
    job = db.get(Job, job_id)
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")
    if not job.log_path:
        raise HTTPException(status_code=404, detail="Log not available")
    lp = Path(job.log_path)
    if not lp.exists():
        raise HTTPException(status_code=404, detail="Log missing")
    return FileResponse(path=str(lp), media_type="text/plain", filename=f"job_{job_id}.log")


@app.get("/jobs/{job_id}/download")
def download_job_zip(job_id: int, db: Session = Depends(get_db)):
    job = db.get(Job, job_id)
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")
    if not job.zip_path:
        raise HTTPException(status_code=409, detail="ZIP not available yet")
    zp = Path(job.zip_path)
    if not zp.exists():
        raise HTTPException(status_code=404, detail="ZIP missing")
    return FileResponse(path=str(zp), media_type="application/zip", filename=f"job_{job_id}.zip")


def shutil_copyfileobj(src, dst, length: int = 1024 * 1024) -> None:
    while True:
        buf = src.read(length)
        if not buf:
            break
        dst.write(buf)
