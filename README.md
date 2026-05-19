# Khalas

Khalas (خلاص) is a web-based appointment booking platform for Egypt. The product starts with medical clinics and is designed to expand to other service verticals without changing the core architecture.

## Stack

- `backend/` Python 3.11+, FastAPI, Motor, MongoDB Atlas
- `frontend/` Next.js 14, TypeScript, Tailwind CSS, `next-intl`

## Current App State

The repository is no longer scaffold-only. The current local and pushed app includes:

### Backend

- Health endpoint at `GET /api/v1/health`
- MongoDB Atlas connection with startup ping
- Phone + OTP mock authentication
- JWT access and refresh token flow
- Role-aware auth for `patient`, `provider`, and `admin`
- Provider APIs for:
  - venue creation and update
  - staff creation and update
  - service creation and update
  - staff availability read and replace
- Public APIs for:
  - venue page
  - venue staff list
  - staff profile
  - staff services
  - staff slots for the next 7 days
- Appointment APIs for:
  - patient booking
  - patient upcoming appointments
  - patient cancellation
  - provider appointment listing
  - provider appointment status updates

### Frontend

- Arabic-first Next.js app with English toggle
- OTP registration and login pages
- Public venue page
- Public staff booking page
- Booking confirmation screen
- Patient dashboard
- Provider appointments dashboard
- PWA manifest and service worker scaffold

## Current Routes

### Frontend

- `/`
- `/auth/login`
- `/auth/register`
- `/[slug]`
- `/[slug]/[staffId]`
- `/book/confirm`
- `/dashboard`
- `/provider/appointments`

With locale routing enabled, the app serves these under `/ar/...` and `/en/...`.

### Backend

Base prefix: `/api/v1`

- `GET /health`
- `POST /auth/register`
- `POST /auth/login/request-otp`
- `POST /auth/login/verify-otp`
- `POST /auth/refresh`
- `GET /auth/me`
- `GET /venues/{slug}`
- `GET /venues/{slug}/staff`
- `GET /staff/{staff_id}`
- `GET /staff/{staff_id}/services`
- `GET /staff/{staff_id}/slots`
- `POST /appointments`
- `GET /appointments/mine`
- `POST /appointments/{id}/cancel`
- `GET /provider/venues`
- `POST /provider/venues`
- `PUT /provider/venues/{id}`
- `POST /provider/venues/{id}/staff`
- `PUT /provider/staff/{id}`
- `POST /provider/staff/{id}/services`
- `PUT /provider/services/{id}`
- `GET /provider/staff/{id}/availability`
- `PUT /provider/staff/{id}/availability`
- `GET /provider/appointments`
- `PATCH /provider/appointments/{id}/status`

## Local Setup

### 1. Backend

Create `backend/.env` from the example:

```bash
cd backend
cp .env.example .env
```

Set the required values in `backend/.env`:

- `MONGODB_URI`
- `MONGODB_DB_NAME`
- `JWT_SECRET_KEY`
- `JWT_REFRESH_SECRET_KEY`

Recommended:

- use 32+ character JWT secrets
- keep all values in local env files only
- never commit `.env`

Install and run:

```bash
cd backend
python3.11 -m venv .venv
source .venv/bin/activate
pip install -e .
uvicorn app.main:app --reload
```

The backend will run at `http://localhost:8000`.

### 2. Frontend

Create `frontend/.env.local` from the example:

```bash
cd frontend
cp .env.example .env.local
```

Install and run:

```bash
cd frontend
npm install
npm run dev
```

The frontend will run at `http://localhost:3000`.

## Environment Variables

### Backend

See [backend/.env.example](backend/.env.example).

Important values:

- `MONGODB_URI`
- `MONGODB_DB_NAME`
- `FRONTEND_ORIGIN`
- `JWT_SECRET_KEY`
- `JWT_REFRESH_SECRET_KEY`
- `ACCESS_TOKEN_EXPIRE_MINUTES`
- `REFRESH_TOKEN_EXPIRE_DAYS`
- `OTP_EXPIRE_MINUTES`

### Frontend

See [frontend/.env.example](frontend/.env.example).

Important values:

- `NEXT_PUBLIC_APP_URL`
- `NEXT_PUBLIC_API_BASE_URL`

## OTP Development Flow

OTP is mock-only at the current stage.

- the backend logs the 4-digit OTP to the server console
- no SMS provider is integrated yet
- use the logged OTP in the frontend login/register screens

## Payment Status

Payments are still cash-only in the current implementation.

- `payment_method = "cash"`
- `payment_status = "unpaid"`

No payment gateway is integrated yet.

## Known Gaps

These areas are still pending or intentionally simplified:

- search endpoint and search UI
- admin panel
- QR endpoint and QR download flow
- notifications and Resend email integration
- real SMS or WhatsApp delivery
- provider dashboard for venue/staff/service/availability management
- public filtering for approval status in all public endpoints
- stronger atomic booking collision control
- production-grade session handling on the frontend

## Deployment Notes

- MongoDB Atlas is the primary database target
- Backend target: Railway
- Frontend target: Render
- Keep secrets in platform env settings only
- Restrict CORS to the deployed frontend origin

## Repository Notes

- `.env` files are intentionally ignored
- local scratch files and local-only planning notes are not part of the public repo
- conventional commits are used for project history
