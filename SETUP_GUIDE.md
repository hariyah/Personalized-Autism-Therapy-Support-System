# Autism Support App - Complete Setup Guide

## Project Overview

This is a full-stack application with:
- **Backend**: API Gateway + 6 microservices (Node.js & Python)
- **Frontend**: React 18 + TypeScript with Vite
- **Database**: MongoDB
- **ML Services**: FastAPI-based AI services

### Architecture

```
Gateway (Port 3000)
  ├── autism-profile-builder (Flask, Port 5001) - Auth service
  ├── cognitive-activity-recommender (FastAPI, Port 8001) - ML recommender
  ├── emotional-activity-recommender (Express, Port 5002) - Activity service
  ├── emotional-activity-recommender-ml (FastAPI, Port 8002) - ML emotion engine
  ├── therapy-collab (Express, Port 5003) - Collaboration service
  └── therapy-collab-ai (FastAPI, Port 9000) - AI therapy service
Frontend (Port 5173)
```

---

## Prerequisites

- **Node.js** v16+ (for backend services and frontend)
- **Python** 3.8+ (for ML services)
- **MongoDB** v4.4+ (local or cloud instance)
- **npm** or **yarn** (package manager)
- **pip** (Python package manager)

---

## Setup Instructions

### 1. Prerequisites Installation

```powershell
# Check versions
node --version    # Should be v16+
python --version  # Should be 3.8+
npm --version
```

### 2. Clone & Navigate

```powershell
cd e:\4th 2nd\Final Project\autism-app\autism-app
```

### 3. Backend Setup

#### A. Gateway Setup

```powershell
cd backend/gateway
npm install
```

#### B. Python Services Setup

**Option 1: Create Virtual Environments (Recommended)**

```powershell
# autism-profile-builder
cd ../services/autism-profile-builder
python -m venv venv
.\venv\Scripts\Activate.ps1
pip install -r requirements.txt

# cognitive-activity-recommender
cd ../cognitive-activity-recommender
python -m venv venv
.\venv\Scripts\Activate.ps1
pip install -r requirements.txt

# emotional-activity-recommender-ml
cd ../emotional-activity-recommender-ml
python -m venv venv
.\venv\Scripts\Activate.ps1
pip install -r requirements.txt

# therapy-collab-ai
cd ../therapy-collab-ai
python -m venv venv
.\venv\Scripts\Activate.ps1
pip install -r requirements.txt
```

**Option 2: Global Python (Simple but less isolated)**

```powershell
cd backend/services/autism-profile-builder
pip install -r requirements.txt

cd ../cognitive-activity-recommender
pip install -r requirements.txt

cd ../emotional-activity-recommender-ml
pip install -r requirements.txt

cd ../therapy-collab-ai
pip install -r requirements.txt
```

#### C. Node.js Services Setup

```powershell
# emotional-activity-recommender
cd backend/services/emotional-activity-recommender
npm install

# therapy-collab
cd ../therapy-collab
npm install
npm run seed        # Seed initial data
npm run seed:activities
```

### 4. Frontend Setup

```powershell
cd frontend
npm install
```

### 5. Environment Configuration

Create `.env` files for each service:

#### `backend/services/autism-profile-builder/.env`
```env
SECRET_KEY=dev-secret-change-in-production
MONGO_URI=mongodb://localhost:27017/autism-app
FLASK_ENV=development
FLASK_DEBUG=1
PORT=5001
```

#### `backend/services/cognitive-activity-recommender/.env`
```env
SECRET_KEY=dev-secret-change-in-production
MONGO_URI=mongodb://localhost:27017/autism-app
FASTAPI_ENV=development
PORT=8001
```

#### `backend/services/emotional-activity-recommender-ml/.env`
```env
PORT=8002
FASTAPI_ENV=development
```

#### `backend/services/therapy-collab-ai/.env`
```env
PORT=9000
FASTAPI_ENV=development
```

#### `backend/services/therapy-collab/.env`
```env
MONGO_URI=mongodb://localhost:27017/autism-app
JWT_SECRET=dev-secret-change-in-production
PORT=5003
```

#### `frontend/.env`
```env
VITE_API_URL=http://localhost:3000/api
```

### 6. MongoDB Setup

#### Local MongoDB (Windows)

```powershell
# Download from https://www.mongodb.com/try/download/community
# Install MongoDB Community Edition

# Start MongoDB service
net start MongoDB

# Verify connection
mongo --version
```

#### MongoDB Atlas (Cloud)

1. Go to https://www.mongodb.com/cloud/atlas
2. Create account and cluster
3. Get connection string
4. Update `MONGO_URI` in all `.env` files:
   ```env
   MONGO_URI=mongodb+srv://username:password@cluster.mongodb.net/autism-app?retryWrites=true&w=majority
   ```

---

## Running the Application

### Option A: Run All Services (Automated Script)

**PowerShell (Windows)**
```powershell
cd backend/scripts
.\START_SERVICES.ps1
```

**Batch (Windows)**
```batch
cd backend\scripts
START_SERVICES.bat
```

**Bash (Linux/Mac)**
```bash
cd backend/scripts
bash start
```

### Option B: Run Services Manually

**Terminal 1 - Gateway**
```powershell
cd backend/gateway
npm start
# Gateway runs on http://localhost:3000
```

**Terminal 2 - autism-profile-builder**
```powershell
cd backend/services/autism-profile-builder
python app.py
# Runs on http://localhost:5001
```

**Terminal 3 - cognitive-activity-recommender**
```powershell
cd backend/services/cognitive-activity-recommender
# Activate venv first
.\venv\Scripts\Activate.ps1
python -m uvicorn app.main:app --reload --port 8001
# Runs on http://localhost:8001
```

**Terminal 4 - emotional-activity-recommender**
```powershell
cd backend/services/emotional-activity-recommender
npm start
# Runs on http://localhost:5002
```

**Terminal 5 - emotional-activity-recommender-ml**
```powershell
cd backend/services/emotional-activity-recommender-ml
# Activate venv first
.\venv\Scripts\Activate.ps1
python -m uvicorn main:app --reload --port 8002
# Runs on http://localhost:8002
```

**Terminal 6 - therapy-collab**
```powershell
cd backend/services/therapy-collab
npm start
# Runs on http://localhost:5003
```

**Terminal 7 - therapy-collab-ai**
```powershell
cd backend/services/therapy-collab-ai
# Activate venv first
.\venv\Scripts\Activate.ps1
python run_server.py
# Runs on http://localhost:9000
```

**Terminal 8 - Frontend**
```powershell
cd frontend
npm run dev
# Frontend runs on http://localhost:5173
```

---

## API Testing

### Health Check
```bash
curl http://localhost:3000/api/auth
```

### Register User
```bash
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "guardian@example.com",
    "password": "secure_password",
    "fullName": "John Doe",
    "phone": "1234567890",
    "relationship": "parent"
  }'
```

### Login
```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "guardian@example.com",
    "password": "secure_password"
  }'
```

---

## Troubleshooting

### Port Already in Use
```powershell
# Find and kill process using port
Get-NetTCPConnection -LocalPort 3000 | Stop-Process -Force
```

### Python Module Not Found
```powershell
# Ensure venv is activated
.\venv\Scripts\Activate.ps1
# Reinstall dependencies
pip install -r requirements.txt --force-reinstall
```

### MongoDB Connection Error
```powershell
# Check MongoDB is running
net start MongoDB
# or verify local connection
mongosh
```

### CORS Issues
- Gateway automatically handles CORS
- Ensure all services are running
- Check API URLs in frontend `.env`

---

## Key Files & Directories

| Path | Purpose |
|------|---------|
| `backend/gateway/` | API Gateway (Express) |
| `backend/services/*/` | Individual microservices |
| `frontend/src/` | React components & pages |
| `backend/services/autism-profile-builder/` | Authentication service |
| `backend/scripts/` | Service startup scripts |

---

## Authentication

- **Login/Register**: Only available in `autism-profile-builder` service
- **JWT Token**: Same `SECRET_KEY` across all services
- **Protected Routes**: Require `Authorization: Bearer <token>` header

---

## Development Tips

1. **Check logs**: Each service outputs to console when running manually
2. **API Testing**: Use VS Code REST Client or Postman
3. **Database**: Use MongoDB Compass for GUI access
4. **Frontend Hot Reload**: Automatic with Vite dev server

---

## Next Steps

1. ✅ Install dependencies (npm install, pip install)
2. ✅ Setup environment variables (.env files)
3. ✅ Start MongoDB
4. ✅ Run backend services
5. ✅ Run frontend
6. ✅ Test authentication flow
7. ✅ Access http://localhost:5173

---

## Support Resources

- [Express Documentation](https://expressjs.com/)
- [FastAPI Documentation](https://fastapi.tiangolo.com/)
- [React Documentation](https://react.dev/)
- [MongoDB Documentation](https://docs.mongodb.com/)
