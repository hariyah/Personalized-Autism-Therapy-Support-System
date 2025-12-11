# Quick Start Guide

## 🚀 Fast Setup (5 Minutes)

### Prerequisites Check
```bash
node --version    # Should be v14+
python --version  # Should be 3.8+
```

### 1. Install Dependencies

**Backend:**
```bash
cd backend && npm install && cd ..
```

**Frontend:**
```bash
cd frontend && npm install && cd ..
```

**ML Service:**
```bash
cd ml_service && pip install -r requirements.txt && cd ..
```

### 2. Download Dataset (Required for Emotion Model)

**Option 1: Kaggle CLI**
```bash
pip install kaggle
# Set up kaggle.json in ~/.kaggle/ (see PROJECT_SETUP.md)
cd ml_service
python download_dataset.py
```

**Option 2: Manual**
- Download from: https://www.kaggle.com/datasets/fatmamtalaat/autistic-children-emotions-dr-fatma-m-talaat
- Extract to `ml_service/dataset/`

### 3. Train Models

**Emotion Model (DenseNet-121):**
```bash
cd ml_service
python train_model.py
# Takes 30-60 min (GPU) or 2-4 hours (CPU)
```

**Recommendation Model:**
```bash
cd ml_service
python train_recommendation_model.py
# Takes 5-10 min (GPU) or 15-30 min (CPU)
```

### 4. Start Services

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

### 5. Access Application

Open browser: **http://localhost:3000**

## ✅ Quick Test

1. Upload an image of a child
2. System detects emotion (6 categories)
3. Fill in preferences (interests, financial, social, autism profile)
4. Click "Generate Recommendations"
5. View personalized activity recommendations

## 🎯 Key Features

- **6 Emotion Detection**: Natural, joy, fear, anger, sadness, surprise
- **Deep Learning Recommendations**: Neural network based on 5 factors
- **Beautiful UI**: Modern, responsive design
- **Real-time Updates**: Recommendations change with emotion

## 📖 Full Documentation

See `PROJECT_SETUP.md` for complete setup instructions and troubleshooting.

