# Quick Start Guide

## Prerequisites Check

- [ ] Python 3.9+ installed (`python --version`)
- [ ] Node.js 18+ installed (`node --version`)
- [ ] MongoDB running locally or accessible remotely

## Step-by-Step Setup

### 1. Backend Setup (5 minutes)

```bash
# Navigate to backend
cd backend

# Create and activate virtual environment
python -m venv venv

# Windows:
venv\Scripts\activate

# macOS/Linux:
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Create .env file
# Copy .env.example to .env and edit it:
# - Set MONGODB_URI (default: mongodb://localhost:27017)
# - Set OPENAI_API_KEY if using OpenAI
# - Set LLM_PROVIDER (openai or local)

# Seed sample activities
python run_seed.py

# Start backend server
uvicorn app.main:app --reload --port 8000
```

Backend should be running at `http://localhost:8000`
API docs at `http://localhost:8000/docs`

### 2. Frontend Setup (3 minutes)

```bash
# In a new terminal, navigate to frontend
cd frontend

# Install dependencies
npm install

# Start development server
npm run dev
```

Frontend should be running at `http://localhost:3000`

### 3. First Use

1. Open `http://localhost:3000` in your browser
2. Click "Create New Profile"
3. Fill in a sample child profile
4. Click on the profile to view details
5. Fill in "Get Recommendations" form
6. Click "Get Recommendations"
7. Review the AI-generated recommendations
8. Try logging an outcome after an activity

## Troubleshooting

### MongoDB Connection Issues
```bash
# Check if MongoDB is running
# Windows: Check Services
# macOS: brew services list
# Linux: sudo systemctl status mongod

# Start MongoDB if needed
# macOS: brew services start mongodb-community
# Linux: sudo systemctl start mongod
```

### Backend Import Errors
- Make sure virtual environment is activated
- Run `pip install -r requirements.txt` again

### Frontend Build Errors
- Delete `node_modules` and run `npm install` again
- Check Node.js version: `node --version` (should be 18+)

### No Recommendations Generated
- Check LLM provider configuration in `.env`
- For OpenAI: Ensure API key is set and valid
- For local LLM: Ensure endpoint is accessible
- Check backend logs for errors

## Next Steps

- Create multiple child profiles
- Browse the activity library
- Log outcomes to improve recommendations
- Customize activities in the library

