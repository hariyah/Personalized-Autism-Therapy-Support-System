# MongoDB Setup Guide

## Option 1: Local MongoDB Installation (Windows)

### Step 1: Download MongoDB Community Edition
1. Go to: https://www.mongodb.com/try/download/community
2. Select your Windows version (Windows 64-bit)
3. Download the MSI installer

### Step 2: Install MongoDB
1. Run the downloaded `.msi` file
2. Follow the installer wizard:
   - Accept License Agreement
   - Server Configuration: Keep defaults
   - Install MongoDB as a Service: ✅ Recommended
   - Run Service as Network Service User: Default is fine
   - Complete the installation

### Step 3: Verify Installation
```powershell
# Check MongoDB service status
Get-Service -Name MongoDB
# Should show "Running"

# Or start the service if not running
Start-Service MongoDB
```

### Step 4: Connect to MongoDB
```powershell
mongosh
# Should connect to mongodb://localhost:27017/
```

---

## Option 2: MongoDB Atlas (Cloud - Recommended for Development)

### Step 1: Create Account
1. Go to: https://www.mongodb.com/cloud/atlas
2. Sign up for free account
3. Create a free M0 cluster

### Step 2: Get Connection String
1. In Atlas Dashboard, click "Connect"
2. Choose "Drivers" → "Node.js"
3. Copy the connection string:
   ```
   mongodb+srv://username:password@cluster.mongodb.net/autism-app?retryWrites=true&w=majority
   ```

### Step 3: Update Environment Files
Replace all `MONGO_URI` values in `.env` files:

**backend/services/autism-profile-builder/.env**
```env
MONGO_URI=mongodb+srv://username:password@cluster.mongodb.net/autism-app?retryWrites=true&w=majority
```

**backend/services/cognitive-activity-recommender/.env**
```env
MONGO_URI=mongodb+srv://username:password@cluster.mongodb.net/autism-app?retryWrites=true&w=majority
```

**backend/services/therapy-collab/.env**
```env
MONGO_URI=mongodb+srv://username:password@cluster.mongodb.net/autism-app?retryWrites=true&w=majority
```

---

## Testing MongoDB Connection

### Local MongoDB
```powershell
mongosh localhost:27017
# Should connect successfully
```

### MongoDB Atlas
```powershell
mongosh "mongodb+srv://username:password@cluster.mongodb.net/test"
# Replace with your Atlas connection string
```

---

## Create Initial Database & Collections

```javascript
// In mongosh session

// Switch to autism-app database
use autism-app

// Create guardians collection (for auth)
db.createCollection("guardians")

// Create indexes
db.guardians.createIndex({ email: 1 }, { unique: true })

// Verify
db.getCollectionNames()
// Should show: [ "guardians" ]

// Exit
exit
```

---

## Troubleshooting

### "Connection refused"
- Ensure MongoDB service is running
- Check if port 27017 is available

### "Authentication failed" (Atlas)
- Verify username and password in connection string
- Check IP whitelist in Atlas dashboard
- Ensure database user has proper permissions

### "Cannot connect to local MongoDB"
```powershell
# Check if service is running
Get-Service MongoDB

# Start it
Start-Service MongoDB

# Check what's listening on port 27017
Get-NetTCPConnection -LocalPort 27017
```

---

## Next Steps
1. Complete MongoDB setup (Local or Atlas)
2. Update all `.env` files with MONGO_URI
3. Run the services (see STARTUP_GUIDE.md)
