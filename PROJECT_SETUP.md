# Complete Project Setup Guide

## Personalized Autism Therapy Support System

A comprehensive web application that uses DenseNet-121 for emotion detection and deep learning for personalized activity recommendations.

## 🎯 System Overview

This system consists of three main components:

1. **Frontend (React)**: Beautiful, modern UI for caregivers and therapists
2. **Backend (Node.js/Express)**: API server handling requests and integrating ML services
3. **ML Service (Python/Flask)**: 
   - DenseNet-121 emotion recognition model (6 emotions)
   - Deep learning recommendation model (neural network)

## 📋 Prerequisites

### Required Software

1. **Node.js** (v14 or higher)
   - Download from: https://nodejs.org/
   - Verify: `node --version`

2. **Python** (3.8 or higher)
   - Download from: https://www.python.org/downloads/
   - Verify: `python --version`

3. **pip** (Python package manager)
   - Usually comes with Python
   - Verify: `pip --version`

### Optional (for better performance)

- **CUDA-enabled GPU** (for faster model training)
- **Git** (for version control)

## 🚀 Installation Steps

### Step 1: Clone/Download the Project

If using Git:
```bash
git clone <repository-url>
cd Personalized-Autism-Therapy-Support-System
```

Or download and extract the ZIP file.

### Step 2: Install Backend Dependencies

```bash
cd backend
npm install
cd ..
```

### Step 3: Install Frontend Dependencies

```bash
cd frontend
npm install
cd ..
```

### Step 4: Install Python ML Dependencies

```bash
cd ml_service
pip install -r requirements.txt
cd ..
```

**Note**: If you encounter permission errors, use:
- Windows: `python -m pip install -r requirements.txt`
- Linux/Mac: `pip3 install -r requirements.txt` or `python3 -m pip install -r requirements.txt`

### Step 5: Download Emotion Recognition Dataset

The emotion detection model requires the "Autistic Children Emotions" dataset from Kaggle.

**Option A: Using Kaggle CLI (Recommended)**

1. Install Kaggle CLI:
   ```bash
   pip install kaggle
   ```

2. Set up Kaggle credentials:
   - Go to https://www.kaggle.com/account
   - Click "Create New API Token"
   - Save `kaggle.json` to:
     - **Windows**: `C:\Users\<username>\.kaggle\kaggle.json`
     - **Linux/Mac**: `~/.kaggle/kaggle.json`

3. Download dataset:
   ```bash
   cd ml_service
   python download_dataset.py
   ```

**Option B: Manual Download**

1. Visit: https://www.kaggle.com/datasets/fatmamtalaat/autistic-children-emotions-dr-fatma-m-talaat
2. Download the dataset ZIP file
3. Extract to `ml_service/dataset/` folder
4. Ensure structure: `ml_service/dataset/emotion_class/images/`

### Step 6: Train the Emotion Recognition Model

```bash
cd ml_service
python train_model.py
```

**Expected Time:**
- GPU: 30-60 minutes
- CPU: 2-4 hours

The trained model will be saved to `ml_service/models/densenet121_emotion_model.h5`

### Step 7: Train the Recommendation Model

```bash
cd ml_service
python train_recommendation_model.py
```

**Expected Time:**
- GPU: 5-10 minutes
- CPU: 15-30 minutes

The trained model will be saved to `ml_service/models/recommendation_model.keras`

## 🎮 Running the Application

You need to run three services simultaneously. Open three terminal windows:

### Terminal 1: ML Service (Python)

```bash
cd ml_service
python app.py
```

The ML service will start on `http://localhost:5000`

### Terminal 2: Backend Server (Node.js)

```bash
cd backend
npm start
```

The backend will start on `http://localhost:3001`

### Terminal 3: Frontend (React)

```bash
cd frontend
npm start
```

The frontend will automatically open in your browser at `http://localhost:3000`

## ✅ Verification

### Check ML Service Health

```bash
curl http://localhost:5000/health
```

Expected response:
```json
{
  "healthy": true,
  "modelLoaded": true,
  "tfAvailable": true,
  "port": 5000
}
```

### Check Backend Health

```bash
curl http://localhost:3001/api/ml-service/health
```

### Test Emotion Recognition

Upload an image through the web interface or use curl:

```bash
curl -X POST -F "image=@test_image.jpg" http://localhost:3001/api/predict-emotion
```

## 📊 System Architecture

```
┌─────────────┐
│   Frontend  │ (React, Port 3000)
│  (Browser)  │
└──────┬──────┘
       │ HTTP Requests
       ▼
┌─────────────┐
│   Backend   │ (Node.js/Express, Port 3001)
│     API     │
└──────┬──────┘
       │
       ├──► Emotion Detection ──► ML Service (Port 5000)
       │                            ├── DenseNet-121 Model
       │                            └── Recommendation Model
       │
       └──► Activity Recommendations
```

## 🎯 Features

### Emotion Detection
- **6 Emotion Categories**: Natural (0), joy (1), fear (2), anger (3), sadness (4), surprise (5)
- **Model**: DenseNet-121 (pre-trained on ImageNet, fine-tuned on autism emotion dataset)
- **Input**: Image upload via web interface
- **Output**: Emotion label with confidence scores

### Activity Recommendations
- **5 Input Factors**:
  1. Real-time emotion (from DenseNet-121)
  2. Personal interests (manual input)
  3. Financial/economic status (manual input)
  4. Social status (manual input)
  5. Autism profile (type, severity - manual input)

- **Model**: Deep Neural Network
  - Input: 35 features (6 emotion + 19 interests + 4 financial + 4 social + 1 severity + 1 type)
  - Architecture: 256 → 128 → 64 → output (sigmoid)
  - Output: Activity recommendation scores

## 🔧 Troubleshooting

### ML Service Not Starting

1. **Check Python version**: `python --version` (should be 3.8+)
2. **Check dependencies**: `pip list | grep tensorflow`
3. **Check model path**: Ensure `ml_service/models/densenet121_emotion_model.h5` exists
4. **Check port**: Ensure port 5000 is not in use

### Backend Connection Issues

1. **Check ML service**: Ensure it's running on port 5000
2. **Check CORS**: Backend should allow frontend origin
3. **Check environment variables**: `ML_SERVICE_URL` if using custom URL

### Frontend Not Loading

1. **Check Node version**: `node --version` (should be 14+)
2. **Clear cache**: `npm cache clean --force`
3. **Reinstall dependencies**: `rm -rf node_modules && npm install`

### Model Training Issues

1. **Dataset not found**: Ensure dataset is in `ml_service/dataset/`
2. **Out of memory**: Reduce batch size in `train_model.py`
3. **CUDA errors**: Install correct CUDA version or use CPU

## 📝 Configuration

### Environment Variables

**Backend** (`backend/.env` or environment):
- `PORT`: Backend server port (default: 3001)
- `ML_SERVICE_URL`: ML service URL (default: http://127.0.0.1:5000)

**ML Service** (`ml_service/.env` or environment):
- `ML_MODEL_PATH`: Path to emotion model (auto-detected if not set)
- `EMOTION_ALLOW_UNCERTAIN`: Allow uncertain predictions (default: 1)

## 📚 File Structure

```
Personalized-Autism-Therapy-Support-System/
├── backend/
│   ├── index.js              # Express API server
│   ├── emotionService.js     # ML service integration
│   └── package.json
├── frontend/
│   ├── src/
│   │   ├── App.js            # Main React component
│   │   └── App.css           # Styling
│   └── package.json
├── ml_service/
│   ├── app.py                # Flask ML service
│   ├── train_model.py        # Emotion model training
│   ├── train_recommendation_model.py  # Recommendation model training
│   ├── predict_emotion.py    # Emotion prediction
│   ├── predict_recommendations.py  # Recommendation prediction
│   ├── models/               # Trained models (after training)
│   ├── dataset/              # Dataset (after download)
│   └── requirements.txt
└── README.md
```

## 🎓 Usage Guide

### For Caregivers/Therapists

1. **Upload Child Image**: Click "Upload Image" and select a photo of the child
2. **View Emotion**: The system will detect and display the current emotion
3. **Set Preferences**: 
   - Select child interests (train, cartoon, music, etc.)
   - Set financial status (free, low, medium, high)
   - Set social status (alone, with-parent, group, community)
   - Enter autism profile (type and severity 1-5)
4. **Get Recommendations**: Click "Generate Personalized Recommendations"
5. **View Activities**: Browse recommended activities with details

### Emotion Categories

- **Natural (0)**: Neutral, calm expression
- **Joy (1)**: Happy, positive expression
- **Fear (2)**: Anxious, worried expression
- **Anger (3)**: Frustrated, upset expression
- **Sadness (4)**: Sad, down expression
- **Surprise (5)**: Surprised, excited expression

## 🔬 Technical Details

### Emotion Detection Model

- **Architecture**: DenseNet-121
- **Input Size**: 224x224 RGB images
- **Preprocessing**: Face detection (Haar Cascade) with center-crop fallback
- **Output**: 6-class softmax probabilities
- **Training**: Transfer learning with fine-tuning

### Recommendation Model

- **Architecture**: Feedforward Neural Network
- **Input Features**: 35 dimensions
- **Layers**: 256 → 128 → 64 → output
- **Activation**: ReLU (hidden), Sigmoid (output)
- **Loss**: Binary Cross-Entropy
- **Training**: Synthetic data generation with rule-based labels

## 📞 Support

For issues or questions:
1. Check the troubleshooting section
2. Review error logs in terminal windows
3. Verify all services are running
4. Check file paths and permissions

## 📄 License

This project is for educational/research purposes.

## 🙏 Acknowledgments

- Dataset: "Autistic Children Emotions" by Dr. Fatma M. Talaat (Kaggle)
- DenseNet-121: Pre-trained on ImageNet
- TensorFlow/Keras: Deep learning framework

---

**Last Updated**: 2024
**Version**: 1.0

