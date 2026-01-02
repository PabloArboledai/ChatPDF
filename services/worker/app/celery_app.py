from __future__ import annotations

from celery import Celery

from .settings import settings

# Ensure tasks are registered when the worker starts.
from . import tasks  # noqa: F401

celery_app = Celery(
    "chatpdf",
    broker=settings.celery_broker_url,
)

celery_app.conf.update(
    task_serializer="json",
    accept_content=["json"],
    result_serializer="json",
    timezone="UTC",
    enable_utc=True,
)
