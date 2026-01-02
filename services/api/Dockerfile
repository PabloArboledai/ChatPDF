FROM python:3.12-slim

WORKDIR /app

RUN useradd -m -u 10001 appuser

RUN mkdir -p /data && chown -R appuser:appuser /data

COPY services/api/requirements.txt /app/requirements.txt
RUN pip install --no-cache-dir -r /app/requirements.txt

COPY --chown=appuser:appuser services/api/app /app/app

ENV PYTHONUNBUFFERED=1

EXPOSE 8000

USER appuser

CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000", "--proxy-headers", "--forwarded-allow-ips", "*"]
