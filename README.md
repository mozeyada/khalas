# Khalas

Khalas (خلاص) is a web-based appointment booking platform for Egypt. The product starts with medical clinics and is designed to expand to any service vertical without changing the core architecture.

This repository is intentionally documentation-first so the project can be resumed from any conversation or device without relying on chat history.

## Monorepo

- `backend/` FastAPI + Motor + MongoDB Atlas
- `frontend/` Next.js 14 + TypeScript + Tailwind CSS + next-intl

## Current Scope

This initial scaffold includes:

- Monorepo folder structure
- FastAPI app with `GET /api/v1/health`
- MongoDB connection wiring with a startup ping when `MONGODB_URI` is configured
- Next.js home page that calls the health endpoint and renders a responsive status card
- PWA manifest and service worker scaffold
- Project documentation for tasks, decisions, notifications, payments, billing, and the working brief

## Local Setup

### Backend

1. Copy `backend/.env.example` to `backend/.env`
2. Set a valid Atlas connection string in `MONGODB_URI`
3. Create a Python 3.11 virtual environment
4. Install dependencies
5. Run the API server

```bash
cd backend
python3.11 -m venv .venv
source .venv/bin/activate
pip install -e .
uvicorn app.main:app --reload
```

The API will be available at `http://localhost:8000`, with the health endpoint at `http://localhost:8000/api/v1/health`.

### Frontend

1. Copy `frontend/.env.example` to `frontend/.env.local`
2. Confirm `NEXT_PUBLIC_API_BASE_URL` points to the backend URL
3. Install dependencies
4. Run the Next.js dev server

```bash
cd frontend
npm install
npm run dev
```

The frontend will be available at `http://localhost:3000`.

## Manual External Setup

Atlas, Railway, Render, and GitHub all require dashboard actions that are easier to do manually:

- Atlas: create the database user, allow network access, and paste the connection string into `backend/.env`
- Railway: create the backend service and add the backend env vars
- Render: create the frontend service and add the frontend env vars
- GitHub: create the repository, then push this monorepo once you are ready

## Deployment Notes

- Keep all secrets in local or platform env files only
- Never commit `.env` files
- Backend and frontend should both be deployed in EU West regions
- CORS should only allow the frontend origin in deployed environments

## Living Docs

- `PROJECT_BRIEF.md`
- `TASKS.md`
- `DECISIONS.md`
- `NOTIFICATIONS.md`
- `PAYMENTS.md`
- `BILLING.md`

