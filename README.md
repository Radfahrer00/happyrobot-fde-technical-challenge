# Acme Logistics — AI-Powered Inbound Carrier Sales

An end-to-end automation system for inbound carrier load sales built on the [HappyRobot](https://happyrobot.ai) AI voice platform. When a carrier calls in, the AI agent handles the entire interaction autonomously: verifying eligibility, finding matching loads, negotiating rates, and logging the outcome — no human dispatcher required.

---

## Live Demo

| Service | URL |
|---|---|
| Backend API | https://happyrobot-take-home-production-f6ab.up.railway.app/docs |
| Dashboard | https://dashboard-production-b4e6.up.railway.app |

---

## Architecture

The system has three layers:

### 1. HappyRobot Voice Agent
An inbound AI agent triggered via web call. It conducts the full carrier conversation: collects the MC number, verifies carrier eligibility against FMCSA, searches and pitches available loads, negotiates pricing across up to 3 rounds, and handles the outcome. Post-call, an AI Extract node pulls structured data from the transcript and an AI Classify node assigns outcome and sentiment labels, which are posted to the backend via webhook.

### 2. FastAPI Backend
A REST API serving as the tool layer for the HappyRobot agent. Deployed on Railway with PostgreSQL.

| Endpoint | Purpose |
|---|---|
| `POST /carriers/verify` | FMCSA MC number lookup — flags ineligible carriers early |
| `GET /loads/search` | Fuzzy city match against the load database |
| `POST /negotiations/evaluate` | Accepts, counters, or rejects a carrier's rate offer |
| `POST /calls/log` | Persists full call record to the database |

**Negotiation logic:** floor = 85% of the loadboard rate. Accepts on first offer if at or above floor. Counters up to 3 rounds at the midpoint between offer and board rate. Rejects after 3 failed rounds.

### 3. React Dashboard
A metrics dashboard reading live data from the same PostgreSQL database.

- **Overview** — KPIs (total calls, booking rate, avg agreed rate, rate vs board), outcome distribution, sentiment breakdown, 30-day call volume chart
- **Load Map** — Leaflet-based US map showing active freight lanes by equipment type and booking demand heatmap by city
- **Analytics** — Outcome & sentiment charts, negotiation rate waterfall + round-by-round funnel, load aging table with pickup urgency, full paginated call log with CSV export
- Light/dark theme, collapsible sidebar, auto-refresh every 30 seconds

---

## Running Locally

### Prerequisites
- Python 3.12+
- Node.js 20+
- An FMCSA web key (optional — without it all carriers pass eligibility)

### Backend

```bash
cd backend
python3.12 -m venv .venv
.venv/bin/pip install -r requirements.txt
cp .env.example .env    # set API_KEY and optionally FMCSA_API_KEY
.venv/bin/uvicorn app.main:app --reload --port 8000
```

API docs available at http://localhost:8000/docs

### Dashboard

```bash
cd dashboard
npm install
cp .env.example .env    # set VITE_API_KEY to match backend API_KEY
npm run dev             # http://localhost:3000
```

### Docker (both services together)

```bash
cp backend/.env.example .env   # fill in values
docker compose up --build
# Backend: http://localhost:8000
# Dashboard: http://localhost:3000
```

---

## Environment Variables

| Variable | Service | Description |
|---|---|---|
| `API_KEY` | Backend | Bearer token for all endpoints |
| `FMCSA_API_KEY` | Backend | FMCSA web key (optional) |
| `DATABASE_URL` | Backend | SQLAlchemy URL (defaults to SQLite locally) |
| `VITE_API_KEY` | Dashboard | Must match backend `API_KEY` |
| `VITE_API_URL` | Dashboard | Set to point at a remote backend (optional) |

---

## Deployment

Both services are deployed as separate Railway services, each using their own `Dockerfile`. The backend uses a Railway Postgres plugin (`DATABASE_URL` is set automatically). The dashboard bakes `VITE_API_URL` into the static bundle at build time.

```bash
railway login
railway up   # from backend/ or dashboard/ directory
```
