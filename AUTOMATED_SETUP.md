# Automated Setup Instructions

## 🚀 Quick Automated Setup

I've created automated scripts to help you set up everything. Here's what to do:

### Option 1: Automated Setup Script (Recommended)

```bash
cd ml_service
python setup_and_train.py
```

This script will:
1. ✅ Install Python dependencies
2. ✅ Check for Kaggle setup
3. ✅ Download dataset (if Kaggle is configured)
4. ✅ Start model training

### Option 2: Step-by-Step Manual Setup

#### Step 1: Install Dependencies
```bash
cd ml_service
pip install -r requirements.txt
```

#### Step 2: Set Up Kaggle (One-time)
1. Go to https://www.kaggle.com/account
2. Click "Create New API Token"
3. Save `kaggle.json` to:
   - **Windows:** `C:\Users\<your-username>\.kaggle\kaggle.json`
   - **Linux/Mac:** `~/.kaggle/kaggle.json`

#### Step 3: Download Dataset
```bash
cd ml_service
python download_dataset.py
```

#### Step 4: Train Model
```bash
python train_model.py
```

**Note:** Training takes 30-60 minutes (GPU) or 2-4 hours (CPU)

#### Step 5: Start Services

**Terminal 1 - ML Service:**
```bash
cd ml_service
python app.py
```

**Terminal 2 - Backend:**
```bash
cd backend
npm start
```

**Terminal 3 - Frontend:**
```bash
cd frontend
npm start
```

## ✅ What's Already Done

- ✅ All code files created
- ✅ Backend dependencies installed
- ✅ Integration complete
- ✅ Documentation complete

## ⚠️ What Needs Your Action

1. **Kaggle Credentials** - One-time setup (5 minutes)
2. **Dataset Download** - Automated once Kaggle is set up
3. **Model Training** - Automated but takes time (30-60 min)
4. **Start Services** - Run the services when ready

## 🎯 Current Status

The system is **100% code-complete**. All you need to do is:
1. Set up Kaggle credentials (one-time)
2. Run the setup script or follow manual steps
3. Wait for model training to complete
4. Start the services

Everything else is automated!

