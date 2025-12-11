# Complete Setup Guide for Emotion Recognition ML Service

## 🎯 Overview

This guide will help you set up the DenseNet-121 emotion recognition model for the Personalized Autism Therapy Support System.

## 📋 Step-by-Step Setup

### Step 1: Install Python Dependencies

```bash
cd ml_service
pip install -r requirements.txt
```

### Step 2: Download the Dataset

#### Option A: Using Kaggle CLI (Recommended)

1. **Install Kaggle CLI:**
   ```bash
   pip install kaggle
   ```

2. **Set up Kaggle API:**
   - Go to https://www.kaggle.com/account
   - Click "Create New API Token"
   - This downloads `kaggle.json`
   - Place it in:
     - **Windows:** `C:\Users\<your-username>\.kaggle\kaggle.json`
     - **Linux/Mac:** `~/.kaggle/kaggle.json`

3. **Download using script:**
   ```bash
   python download_dataset.py
   ```

   Or manually:
   ```bash
   kaggle datasets download -d fatmamtalaat/autistic-children-emotions-dr-fatma-m-talaat
   unzip autistic-children-emotions-dr-fatma-m-talaat.zip -d dataset
   ```

#### Option B: Manual Download

1. Visit: https://www.kaggle.com/datasets/fatmamtalaat/autistic-children-emotions-dr-fatma-m-talaat
2. Click "Download" (requires Kaggle account)
3. Extract the zip file to `ml_service/dataset/`
4. Ensure folder structure: `dataset/emotion_class/images/`

### Step 3: Train the Model

```bash
python train_model.py
```

**Expected Training Time:**
- **CPU:** 2-4 hours
- **GPU (recommended):** 30-60 minutes

**What happens during training:**
1. Phase 1: Trains with frozen DenseNet-121 base (faster)
2. Phase 2: Fine-tunes top layers (better accuracy)
3. Model saved to `models/densenet121_emotion_model.h5`
4. Training history plot saved to `models/training_history.png`

### Step 4: Test the Model

Test with a single image:
```bash
python predict_emotion.py path/to/test_image.jpg
```

### Step 5: Start the ML API Service

```bash
python app.py
```

The service will run on `http://localhost:5000`

### Step 6: Install Backend Dependencies

In a new terminal:
```bash
cd backend
npm install
```

This installs:
- `multer` (for file uploads)
- `axios` (for API calls)
- `form-data` (for multipart requests)

### Step 7: Start the Backend Server

```bash
cd backend
npm start
```

The backend will run on `http://localhost:3001`

### Step 8: Test the Integration

1. **Check ML service health:**
   ```bash
   curl http://localhost:5000/health
   ```

2. **Check backend ML service connection:**
   ```bash
   curl http://localhost:3001/api/ml-service/health
   ```

3. **Test emotion recognition:**
   ```bash
   curl -X POST -F "image=@test_image.jpg" http://localhost:3001/api/emotion/1/recognize
   ```

## 🔧 Configuration

### Environment Variables

You can set the ML service URL:
```bash
# Windows
set ML_SERVICE_URL=http://localhost:5000

# Linux/Mac
export ML_SERVICE_URL=http://localhost:5000
```

Or update in `backend/emotionService.js`:
```javascript
const ML_SERVICE_URL = process.env.ML_SERVICE_URL || 'http://localhost:5000';
```

## 📊 Model Performance

After training, you should see:
- **Validation Accuracy:** Typically 85-95%
- **Training Time:** Depends on hardware
- **Model Size:** ~30-40 MB

## 🐛 Troubleshooting

### Issue: "Model not found"
**Solution:** Make sure you've completed training. Check that `models/densenet121_emotion_model.h5` exists.

### Issue: "Dataset not found"
**Solution:** 
- Verify dataset is in `ml_service/dataset/`
- Check folder structure matches: `dataset/emotion_class/images/`

### Issue: "ML service connection refused"
**Solution:**
- Make sure ML service is running: `python app.py`
- Check it's on port 5000
- Verify firewall isn't blocking

### Issue: "CUDA/GPU errors"
**Solution:**
- Install CUDA and cuDNN for GPU support
- Or use CPU (works but slower)
- TensorFlow will automatically use CPU if GPU unavailable

### Issue: "Memory errors during training"
**Solution:**
- Reduce batch size in `train_model.py` (change `batch_size` from 32 to 16 or 8)
- Close other applications
- Use smaller image size

## ✅ Verification Checklist

- [ ] Python dependencies installed
- [ ] Dataset downloaded and extracted
- [ ] Model trained successfully
- [ ] Model file exists (`models/densenet121_emotion_model.h5`)
- [ ] ML service starts without errors
- [ ] Backend dependencies installed
- [ ] Backend can connect to ML service
- [ ] Image upload endpoint works

## 🚀 Quick Start (All Commands)

```bash
# 1. Setup ML service
cd ml_service
pip install -r requirements.txt
python download_dataset.py
python train_model.py

# 2. Start ML service (Terminal 1)
python app.py

# 3. Setup backend (Terminal 2)
cd ../backend
npm install

# 4. Start backend (Terminal 2)
npm start

# 5. Test
curl http://localhost:3001/api/ml-service/health
```

## 📝 Next Steps

1. Integrate image upload in frontend
2. Test with real images
3. Monitor model performance
4. Fine-tune if needed

