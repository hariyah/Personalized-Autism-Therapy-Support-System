# 🚀 Complete Project Startup Guide

## Prerequisites Check

Before starting, verify MongoDB is running:

```powershell
Get-Service MongoDB | Select-Object Status, DisplayName
```

**Expected output:**
```
Status  DisplayName
------  -----------
Running MongoDB Server (MongoDB)
```

If not running, start it:
```powershell
Start-Service MongoDB
```

---

## ⭐ FASTEST WAY: Automated Startup (Recommended - 30 seconds)

**Open ONE PowerShell terminal and run:**

```powershell
cd "e:\4th 2nd\Final Project\autism-app\autism-app\backend\scripts"
.\START_SERVICES.ps1
```

This will automatically start ALL services and the frontend in one go!

---

## 📘 DETAILED WAY: Manual Startup (Learn What's Running)

Open **8 separate PowerShell terminals** and run each command below in order.

### ✅ Terminal 1: API Gateway (Main Entry Point)

```powershell
cd "e:\4th 2nd\Final Project\autism-app\autism-app\backend\gateway"
npm start
```

**Wait for this output:**
```
Gateway running at http://localhost:3000
...
```

✅ **Gateway is the main entry point** - all frontend requests go through this.

---

### ✅ Terminal 2: Auth Service (Authentication/Login)

```powershell
cd "e:\4th 2nd\Final Project\autism-app\autism-app\backend\services\autism-profile-builder"
.\venv\Scripts\Activate.ps1
python app.py
```

**Wait for this output:**
```
WARNING in app.run()
 * Running on http://127.0.0.1:5001
```

✅ **This handles all login/registration** - only service with auth endpoints.

---

### ✅ Terminal 3: Cognitive Activity Recommender (AI Suggestions)

```powershell
cd "e:\4th 2nd\Final Project\autism-app\autism-app\backend\services\cognitive-activity-recommender"
.\venv\Scripts\Activate.ps1
python -m uvicorn app.main:app --reload --port 8001
```

**Wait for this output:**
```
INFO:     Uvicorn running on http://127.0.0.1:8001
INFO:     Application startup complete
```

✅ **AI service for cognitive activities** - FastAPI based.

---

### ✅ Terminal 4: Emotional Activity Recommender (Node Service)

```powershell
cd "e:\4th 2nd\Final Project\autism-app\autism-app\backend\services\emotional-activity-recommender"
npm start
```

**Wait for output indicating server is running on port 5002.**

✅ **Emotional support activities** - Express based.

---

### ✅ Terminal 5: Emotional ML Service (Emotion Detection)

```powershell
cd "e:\4th 2nd\Final Project\autism-app\autism-app\backend\services\emotional-activity-recommender-ml"
python -m uvicorn main:app --reload --port 8002
```

**Wait for this output:**
```
INFO:     Uvicorn running on http://127.0.0.1:8002
INFO:     Application startup complete
```

✅ **ML-based emotion analysis** - FastAPI based.

---

### ✅ Terminal 6: Therapy Collaboration Service (Node Service)

```powershell
cd "e:\4th 2nd\Final Project\autism-app\autism-app\backend\services\therapy-collab"
npm start
```

**Wait for output indicating server is running on port 5003.**

✅ **Collaboration features** - Express + Mongoose.

---

### ✅ Terminal 7: Therapy AI Service (AI Therapy)

```powershell
cd "e:\4th 2nd\Final Project\autism-app\autism-app\backend\services\therapy-collab-ai"
python run_server.py
```

**Wait for this output:**
```
INFO:     Uvicorn running on http://127.0.0.1:9000
```

✅ **AI-powered therapy** - FastAPI based.

---

### ✅ Terminal 8: Frontend (React App)

```powershell
cd "e:\4th 2nd\Final Project\autism-app\autism-app\frontend"
npm run dev
```

**Wait for this output:**
```
  Local:   http://localhost:5173/
```

✅ **Frontend web app** - React with Vite dev server.

---

## 🎯 Verify Everything is Running

Once all 8 terminals show their "running" messages, open a **new terminal** and run:

```powershell
curl http://localhost:3000/health
```

**Expected response:**
```json
{
  "status": "ok",
  "gateway": "running",
  "port": 3000,
  "services": {...}
}
```

---

## 🌐 Access Your Application

### 1. Open Frontend in Browser
**Go to:** http://localhost:5173

You should see:
- Autism Support App interface
- Login/Register page
- Dashboard (after login)

### 2. Check API Gateway
**Go to:** http://localhost:3000/health

Should return JSON with status "ok"

---

## 📝 Create Test Account

### Option A: Use Frontend UI (Easiest)
1. Go to http://localhost:5173
2. Click "Register"
3. Fill in:
   - Email: `test@example.com`
   - Password: `Test123!@#`
   - Full Name: `Test Guardian`
   - Phone: `1234567890`
   - Relationship: `Parent`
4. Click Register
5. Login with credentials

### Option B: Use API Directly
```powershell
# Register
$body = @{
    email = "test@example.com"
    password = "Test123!@#"
    fullName = "Test Guardian"
    phone = "1234567890"
    relationship = "parent"
} | ConvertTo-Json

curl -X POST http://localhost:3000/api/auth/register `
  -H "Content-Type: application/json" `
  -d $body

# Login
$loginBody = @{
    email = "test@example.com"
    password = "Test123!@#"
} | ConvertTo-Json

curl -X POST http://localhost:3000/api/auth/login `
  -H "Content-Type: application/json" `
  -d $loginBody
```

You'll get a JWT token to use in subsequent requests.

---

## ✅ Startup Checklist

As each service starts, check it off:

- [ ] **Terminal 1** - Gateway running on port 3000
- [ ] **Terminal 2** - Auth service running on port 5001
- [ ] **Terminal 3** - Cognitive service running on port 8001
- [ ] **Terminal 4** - Emotional service running on port 5002
- [ ] **Terminal 5** - Emotional ML service running on port 8002
- [ ] **Terminal 6** - Therapy service running on port 5003
- [ ] **Terminal 7** - Therapy AI service running on port 9000
- [ ] **Terminal 8** - Frontend running on port 5173
- [ ] MongoDB is running (check: `Get-Service MongoDB`)
- [ ] http://localhost:3000/health returns OK
- [ ] http://localhost:5173 loads the app

---

## 🔍 Service Status Check

Use this to verify all services are running:

```powershell
# Check all ports
$ports = @(3000, 5001, 5002, 5003, 8001, 8002, 9000, 5173)
foreach ($port in $ports) {
    $status = Get-NetTCPConnection -LocalPort $port -ErrorAction SilentlyContinue | Select-Object -First 1
    if ($status) {
        Write-Host "✅ Port $port: LISTENING" -ForegroundColor Green
    } else {
        Write-Host "❌ Port $port: NOT LISTENING" -ForegroundColor Red
    }
}
```

---

## 🐛 Troubleshooting

### Service Won't Start: "Port Already in Use"

**Find what's using the port:**
```powershell
Get-NetTCPConnection -LocalPort 3000  # Replace 3000 with your port
```

**Kill the process:**
```powershell
Get-NetTCPConnection -LocalPort 3000 | Stop-Process -Force
```

Then restart the service.

---

### Python Service Won't Start: "Module Not Found"

Make sure virtual environment is activated:
```powershell
# Should show (venv) in your terminal prompt
.\venv\Scripts\Activate.ps1

# Then run the service again
python -m uvicorn main:app --reload --port 8001
```

---

### MongoDB Connection Error

**Check MongoDB is running:**
```powershell
Get-Service MongoDB

# Start if not running
Start-Service MongoDB
```

**Check connection:**
```powershell
# Should connect to MongoDB
mongosh
# Type: exit
```

---

### Frontend Shows Blank Page

1. **Check browser console** for errors (F12)
2. **Verify gateway is running** on port 3000
3. **Check .env file** in frontend folder has correct API URL

---

### Services Not Communicating

1. Verify **Gateway is running** on port 3000
2. Check **all .env files** have correct ports
3. Ensure **no firewall** blocking ports
4. Verify **MongoDB is running**

---

## 🔄 Shutdown / Restart

### Stop All Services

Press `Ctrl + C` in each terminal.

### Stop MongoDB
```powershell
Stop-Service MongoDB
```

### Restart Everything

Same steps as startup above.

---

## 📊 Service Architecture

```
┌─────────────────────────────────────────────────────────┐
│                  Frontend (React)                        │
│              http://localhost:5173                       │
└────────────────────────┬────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────┐
│              API Gateway (Express)                       │
│              http://localhost:3000                       │
│  (Proxy to all 6 backend services)                       │
└─┬────┬────┬────┬────┬────┬─────────────────────────────┘
  │    │    │    │    │    │
  ▼    ▼    ▼    ▼    ▼    ▼
[5001][5002][5003][8001][8002][9000]
 Auth  Emot   Ther  Cog   Emot   Ther
      Rec   Coll   Rec   ML     AI
                          
        ▼
    MongoDB (27017)
```

---

## 🎯 What Each Service Does

| Port | Service | Purpose | Tech |
|------|---------|---------|------|
| **3000** | Gateway | Main entry point | Express |
| **5001** | Auth | Login/Register | Flask |
| **5002** | Emotional | Activity suggestions | Express |
| **5003** | Therapy | Collaboration features | Express |
| **8001** | Cognitive | AI activity recommendations | FastAPI |
| **8002** | Emotion ML | Emotion detection/analysis | FastAPI |
| **9000** | Therapy AI | AI therapy conversations | FastAPI |
| **5173** | Frontend | React web app | React/Vite |
| **27017** | MongoDB | Data storage | MongoDB |

---

## 💡 Quick Tips

1. **Keep all 8 terminals open** - services must stay running
2. **Check each terminal for errors** - scroll up to see startup messages
3. **First register/login takes a sec** - don't refresh multiple times
4. **Backend logs are useful** - watch them to debug issues
5. **Browser DevTools help** - press F12 to see frontend errors

---

## ✨ Success Indicators

Everything is working when:
- ✅ All 8 terminals show "running" messages
- ✅ http://localhost:5173 loads the app
- ✅ http://localhost:3000/health returns JSON
- ✅ You can register a new account
- ✅ You can login with that account
- ✅ Dashboard loads after login
- ✅ No error messages in any terminal

---

## 🚀 You're Ready!

Choose your startup method:
1. **Auto** (30 sec): `.\START_SERVICES.ps1`
2. **Manual** (2 min): Follow 8 terminal steps above

Then go to: **http://localhost:5173** and start using the app!

---

## 📞 Still Need Help?

Check these files in your project root:
- `SETUP_GUIDE.md` - Installation details
- `MONGODB_SETUP.md` - Database help
- `SETUP_COMPLETION_REPORT.md` - Full project info
