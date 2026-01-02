FROM python:3.12-slim

WORKDIR /app

COPY services/worker/requirements-ml.txt /app/requirements.txt
RUN pip install --no-cache-dir -r /app/requirements.txt

# Core scripts (existing engine)
COPY export_topics.py /app/core/export_topics.py
COPY extract_topics_md.py /app/core/extract_topics_md.py
COPY extract_themes.py /app/core/extract_themes.py

COPY services/worker/app /app/worker

ENV PYTHONUNBUFFERED=1

CMD ["celery", "-A", "worker.celery_app:celery_app", "worker", "--loglevel=INFO", "-Q", "ml"]
