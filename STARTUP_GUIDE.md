# Autism Support App - Startup Guide

## ✅ Setup Status: COMPLETE

All dependencies have been installed and configured. Your project is ready to run!

---

## Quick Start (All Services)

### Option 1: Use Startup Scripts (Easiest)

**PowerShell (Windows):**
```powershell
cd backend\scripts
.\START_SERVICES.ps1
```

**Batch (Windows):**
```batch
cd backend\scripts
START_SERVICES.bat
```

**Bash (Linux/Mac):**
```bash
cd backend/scripts
bash start
```

---

### Option 2: Start Services Manually (For Development)

Open **8 separate terminals** and run each command:

#### Terminal 1: API Gateway (Port 3000)
```powershell
cd backend\gateway
npm start
# Expected output: Gateway running at http://localhost:3000
```

#### Terminal 2: Auth Service (Port 5001)
```powershell
cd backend\services\autism-profile-builder
.\venv\Scripts\Activate.ps1
python app.py
# Expected output: Flask running at http://localhost:5001
```

#### Terminal 3: Cognitive Service (Port 8001)
```powershell
cd backend\services\cognitive-activity-recommender
.\venv\Scripts\Activate.ps1
python -m uvicorn app.main:app --reload --port 8001
# Expected output: Application startup complete
```

#### Terminal 4: Emotional Service (Port 5002)
```powershell
cd backend\services\emotional-activity-recommender
npm start
# Expected output: Server running on port 5002
```

#### Terminal 5: Emotional ML Service (Port 8002)
```powershell
cd backend\services\emotional-activity-recommender-ml
.\venv\Scripts\Activate.ps1
python -m uvicorn main:app --reload --port 8002
# Expected output: Application startup complete
```

#### Terminal 6: Therapy Service (Port 5003)
```powershell
cd backend\services\therapy-collab
npm start
# Expected output: Server running on port 5003
```

#### Terminal 7: Therapy AI Service (Port 9000)
```powershell
cd backend\services\therapy-collab-ai
python run_server.py
# Expected output: Uvicorn running on http://127.0.0.1:9000
```

#### Terminal 8: Frontend (Port 5173)
```powershell
cd frontend
npm run dev
# Expected output: Local: http://localhost:5173/
```

---

## Before You Start: MongoDB Setup

### ⚠️ IMPORTANT: MongoDB Must Be Running

Choose one option:

#### Option A: Local MongoDB (Windows)
```powershell
# Install from: https://www.mongodb.com/try/download/community
# Then start the service:
net start MongoDB

# Verify:
mongosh
# You should see mongosh version and connected to localhost:27017
```

#### Option B: MongoDB Atlas (Cloud - Easier)
1. Go to: https://www.mongodb.com/cloud/atlas
2. Create a free M0 cluster
3. Get your connection string
4. Update these files with your connection string:
   - `backend/services/autism-profile-builder/.env`
   - `backend/services/cognitive-activity-recommender/.env`
   - `backend/services/therapy-collab/.env`

See [MONGODB_SETUP.md](./MONGODB_SETUP.md) for detailed instructions.

---

## Checking Everything Works

### Check Gateway
```bash
curl http://localhost:3000/health
```

Expected response:
```json
{
  "status": "ok",
  "gateway": "running",
  "port": 3000,
  "services": {
    "auth": "/api/auth (login, register -> profile-builder)"
  }
}
```

### Check Frontend
Open: http://localhost:5173

You should see the Autism Support App interface.

### Test Login
```bash
# Register
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "Test123!@#",
    "fullName": "Test Guardian",
    "phone": "1234567890",
    "relationship": "parent"
  }'

# Login
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "Test123!@#"
  }'
```

---

## What's Been Installed

### ✅ Node.js Packages
- **Gateway**: express, cors, http-proxy-middleware, dotenv
- **emotional-activity-recommender**: express, cors, multer, axios, form-data
- **therapy-collab**: express, mongoose, dotenv, bcryptjs, jsonwebtoken

### ✅ Python Packages
- **autism-profile-builder**: flask, pymongo, PyJWT, bcrypt, scikit-learn, pandas
- **cognitive-activity-recommender**: fastapi, uvicorn, pymongo, motor, faiss-cpu
- **emotional-activity-recommender-ml**: fastapi, uvicorn, python-multipart, opencv-python
- **therapy-collab-ai**: fastapi, uvicorn, pydantic, python-dotenv

### ✅ Environment Files
All `.env` files configured with correct ports and service URLs.

---

## Troubleshooting

### Port Already in Use
If a service fails to start due to "port already in use", kill the process:

```powershell
# Find what's using port (example: 3000)
Get-NetTCPConnection -LocalPort 3000

# Kill the process (replace PID with the Process ID)
Stop-Process -PID <PID> -Force
```

### MongoDB Connection Error
```
Error: connect ECONNREFUSED 127.0.0.1:27017
```

**Solution:**
1. Start MongoDB service: `net start MongoDB`
2. If using Atlas, verify connection string in `.env` files
3. Check network connectivity

### Module Not Found (Python)
```
ModuleNotFoundError: No module named 'fastapi'
```

**Solution:**
1. Ensure venv is activated: `.\venv\Scripts\Activate.ps1`
2. Reinstall: `pip install -r requirements.txt`

### npm ERR! code EACCES
```powershell
# Try clearing npm cache
npm cache clean --force

# Then reinstall
npm install --legacy-peer-deps
```

### Services Not Communicating
- Check gateway is running on port 3000
- Verify all service ports are correct in `.env`
- Check firewall isn't blocking ports
- Ensure MongoDB is running

---

## File Structure Overview

```
autism-app/
├── backend/
│   ├── gateway/                    ← API Gateway (Port 3000)
│   ├── services/
│   │   ├── autism-profile-builder/      ← Auth (Port 5001)
│   │   ├── cognitive-activity-recommender/  ← Cognitive AI (Port 8001)
│   │   ├── emotional-activity-recommender/  ← Emotional (Port 5002)
│   │   ├── emotional-activity-recommender-ml/ ← Emotion ML (Port 8002)
│   │   ├── therapy-collab/          ← Collaboration (Port 5003)
│   │   └── therapy-collab-ai/       ← Therapy AI (Port 9000)
│   └── scripts/                    ← Service startup scripts
├── frontend/                       ← React App (Port 5173)
├── SETUP_GUIDE.md                 ← General setup guide
├── MONGODB_SETUP.md               ← Database setup
└── STARTUP_GUIDE.md               ← This file

```

---

## Environment Variables Configured

### Gateway (Port 3000)
```env
PORT=3000
PROFILE_BUILDER_URL=http://localhost:5001
COGNITIVE_URL=http://localhost:8001
EMOTIONAL_URL=http://localhost:5002
EMOTION_ML_URL=http://localhost:8002
THERAPY_AI_URL=http://localhost:9000
THERAPY_URL=http://localhost:5003
```

### Auth Service (Port 5001)
```env
SECRET_KEY=dev-secret-change-in-production
MONGO_URI=mongodb://localhost:27017/autism-app
FLASK_ENV=development
PORT=5001
```

### Frontend (Port 5173)
```env
VITE_API_URL=http://localhost:3000/api
```

---

## Next Steps

1. **Setup MongoDB** (Local or Atlas)
2. **Start all services** using one of the methods above
3. **Open** http://localhost:5173 in your browser
4. **Register** a new guardian account
5. **Login** and start using the app!

---

## Common Issues & Solutions

| Issue | Solution |
|-------|----------|
| Port 3000 in use | `Get-NetTCPConnection -LocalPort 3000 \| Stop-Process -Force` |
| MongoDB not found | See MONGODB_SETUP.md |
| Services not connecting | Verify all ports in Gateway .env |
| Frontend blank | Check browser console for errors |
| CORS errors | Verify gateway is running |
| Python venv not working | Try: `python -m venv venv --clear` |

---

## Support Resources

- **Express.js**: https://expressjs.com/
- **FastAPI**: https://fastapi.tiangolo.com/
- **React**: https://react.dev/
- **MongoDB**: https://docs.mongodb.com/
- **Vite**: https://vitejs.dev/

---

## You're All Set! 🎉

Everything is installed and configured. Just start MongoDB, run the services, and you're good to go!

Questions? Check the common issues section or review the detailed guides in this directory.
