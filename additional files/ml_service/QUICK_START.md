# Quick Start Guide - Emotion Recognition ML Service

## 🚀 Fast Setup (5 Steps)

### 1. Install Python Dependencies
```bash
cd ml_service
pip install -r requirements.txt
```

### 2. Download Dataset
```bash
# Option A: Using script
python download_dataset.py

# Option B: Manual
kaggle datasets download -d fatmamtalaat/autistic-children-emotions-dr-fatma-m-talaat
unzip autistic-children-emotions-dr-fatma-m-talaat.zip -d dataset
```

### 3. Train Model
```bash
python train_model.py
```
⏱️ **Time:** 30-60 min (GPU) or 2-4 hours (CPU)

### 4. Start ML Service
```bash
python app.py
```
✅ Service runs on `http://localhost:5000`

### 5. Install & Start Backend
```bash
cd ../backend
npm install
npm start
```
✅ Backend runs on `http://localhost:3001`

## 🧪 Test It

```bash
# Test ML service
curl http://localhost:5000/health

# Test backend connection
curl http://localhost:3001/api/ml-service/health

# Test emotion recognition
curl -X POST -F "image=@test_image.jpg" http://localhost:3001/api/emotion/1/recognize
```

## 📋 What You Need

- Python 3.8+
- Node.js 14+
- Kaggle account (for dataset)
- GPU recommended (but CPU works)

## ❓ Need Help?

See [SETUP_GUIDE.md](SETUP_GUIDE.md) for detailed instructions.

