from __future__ import annotations

from celery import Celery

from .settings import settings


celery_app = Celery(
    "chatpdf",
    broker=settings.celery_broker_url,
    backend=settings.celery_result_backend,
)

# NOTE: tasks live in worker service. API only publishes tasks.
celery_app.conf.update(
    task_default_queue="default",
    task_serializer="json",
    accept_content=["json"],
    result_serializer="json",
    timezone="UTC",
    enable_utc=True,
)
