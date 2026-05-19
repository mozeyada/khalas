# Khalas Backend

FastAPI backend for Khalas.

## Current Scope

Implemented:

- health check
- MongoDB Atlas connection and indexes
- OTP mock authentication
- JWT access and refresh tokens
- provider venue, staff, service, and availability APIs
- public venue, staff, service, and slot APIs
- patient appointment booking and cancellation
- provider appointment review and status update APIs

## Run Locally

```bash
cd backend
cp .env.example .env
python3.11 -m venv .venv
source .venv/bin/activate
pip install -e .
uvicorn app.main:app --reload
```

## Required Env Values

- `MONGODB_URI`
- `MONGODB_DB_NAME`
- `JWT_SECRET_KEY`
- `JWT_REFRESH_SECRET_KEY`

Use 32+ character JWT secrets.
