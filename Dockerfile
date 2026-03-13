FROM python:3.12-slim

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1

WORKDIR /app

COPY backend/requirements.txt /app/requirements.txt
RUN pip install --no-cache-dir -r /app/requirements.txt

COPY backend/projectback /app/projectback
WORKDIR /app/projectback

EXPOSE 8000

CMD ["gunicorn", "projectback.wsgi:application", "--bind", "0.0.0.0:8000"]
