FROM python:3.12-slim

WORKDIR /app

RUN useradd -m -u 10001 appuser

RUN mkdir -p /data && chown -R appuser:appuser /data

COPY services/worker/requirements-ml.txt /app/requirements.txt
RUN pip install --no-cache-dir -r /app/requirements.txt

# Core scripts (existing engine)
COPY --chown=appuser:appuser export_topics.py /app/core/export_topics.py
COPY --chown=appuser:appuser extract_topics_md.py /app/core/extract_topics_md.py
COPY --chown=appuser:appuser extract_themes.py /app/core/extract_themes.py

COPY --chown=appuser:appuser services/worker/app /app/worker

ENV PYTHONUNBUFFERED=1

USER appuser

CMD ["celery", "-A", "worker.celery_app:celery_app", "worker", "--loglevel=INFO", "-Q", "ml"]
