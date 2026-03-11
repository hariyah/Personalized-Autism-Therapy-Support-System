# Personalized Autism Therapy Support System

This repository is organized as a frontend plus a service-oriented backend:

- `frontend/`
- `backend/gateway/`
- `backend/scripts/`
- `backend/services/therapy-collab/`
- `backend/services/therapy-collab-ai/`

## Runtime layout

- `frontend` runs on `http://localhost:3000`
- `backend/gateway` runs on `http://localhost:5000`
- `backend/services/therapy-collab` runs on `http://localhost:5001`
- `backend/services/therapy-collab-ai` runs on `http://localhost:8000`

The frontend talks only to the gateway. The gateway proxies `/api/*` requests to the therapy-collab service. The therapy-collab service calls the AI service for voice and text analysis.

## Setup

Install everything from the repo root:

```powershell
npm run install:all
```

Or use the Windows helper:

```powershell
.\setup.bat
```

## Local MongoDB

The backend uses the local MongoDB service on:

```text
mongodb://127.0.0.1:27017/autism_support
```

Before starting the app, make sure your local MongoDB service is running.
On Windows this is typically the `MongoDB` service.

## Start

Start all services from the repo root:

```powershell
npm start
```

Windows wrapper:

```powershell
.\START_ALL.bat
```

Individual services:

```powershell
npm run start:frontend
```

```powershell
npm run start:gateway
```

```powershell
npm run start:backend
```

```powershell
npm run start:ai
```

## Seed demo data

```powershell
npm run seed:demo
```

Demo users:

- Parent: `parent@example.com / password123`
- Doctor: `doctor@example.com / password123`

## Backend structure

- `backend/COMMON_AUTH.md`
- `backend/gateway/index.js`
- `backend/services/therapy-collab/index.js`
- `backend/services/therapy-collab-ai/main.py`

## Frontend structure

The active UI is grouped under:

- `frontend/src/pages/therapy-collab/App.js`
- `frontend/src/pages/therapy-collab/components/`
- `frontend/src/pages/therapy-collab/contexts/`
- `frontend/src/pages/therapy-collab/pages/`
- `frontend/src/pages/therapy-collab/utils/`
