# Emotion Recognition ML Service

DenseNet-121 based emotion recognition model for autistic children using the dataset from Dr. Fatma M. Talaat.

## 📋 Prerequisites

- Python 3.8 or higher
- TensorFlow 2.13+
- GPU recommended (but not required)

## 📥 Dataset Setup

### Option 1: Using Kaggle API (Recommended)

1. **Install Kaggle CLI:**
   ```bash
   pip install kaggle
   ```

2. **Set up Kaggle API credentials:**
   - Go to https://www.kaggle.com/account
   - Click "Create New API Token"
   - This downloads `kaggle.json`
   - Place it in `~/.kaggle/` (Linux/Mac) or `C:\Users\<username>\.kaggle\` (Windows)

3. **Download the dataset:**
   ```bash
   kaggle datasets download -d fatmamtalaat/autistic-children-emotions-dr-fatma-m-talaat
   ```

4. **Extract the dataset:**
   ```bash
   unzip autistic-children-emotions-dr-fatma-m-talaat.zip -d dataset
   ```

### Option 2: Manual Download

1. Visit: https://www.kaggle.com/datasets/fatmamtalaat/autistic-children-emotions-dr-fatma-m-talaat
2. Download the dataset
3. Extract to `ml_service/dataset/` folder
4. Ensure folder structure: `dataset/emotion_class/images/`

## 🚀 Installation

1. **Navigate to ml_service directory:**
   ```bash
   cd ml_service
   ```

2. **Create virtual environment (recommended):**
   ```bash
   python -m venv venv
   
   # Windows
   venv\Scripts\activate
   
   # Linux/Mac
   source venv/bin/activate
   ```

3. **Install dependencies:**
   ```bash
   pip install -r requirements.txt
   ```

## 🏋️ Training the Model

1. **Ensure dataset is in place:**
   ```bash
   # Check dataset structure
   ls dataset/
   ```

2. **Run training script:**
   ```bash
   python train_model.py
   ```

3. **Training process:**
   - Phase 1: Trains with frozen base model (faster)
   - Phase 2: Fine-tunes top layers (better accuracy)
   - Model will be saved to `models/densenet121_emotion_model.h5`
   - Training history plot saved to `models/training_history.png`

4. **Expected training time:**
   - CPU: ~2-4 hours
   - GPU: ~30-60 minutes

## 🧪 Testing the Model

Test the trained model with a single image:

```bash
python predict_emotion.py path/to/image.jpg
```

## 🌐 Running the API Server

1. **Start the Flask API server:**
   ```bash
   python app.py
   ```

2. **Server will run on:** `http://localhost:5000`

3. **API Endpoints:**
   - `POST /predict` - Upload image file (multipart/form-data)
   - `POST /predict-base64` - Send base64 encoded image (JSON)
   - `GET /health` - Health check
   - `GET /emotions` - Get supported emotions

4. **Example API usage:**
   ```bash
   # Using curl
   curl -X POST -F "image=@test_image.jpg" http://localhost:5000/predict
   
   # Using Python
   import requests
   with open('test_image.jpg', 'rb') as f:
       response = requests.post('http://localhost:5000/predict', files={'image': f})
   print(response.json())
   ```

## 📊 Model Architecture

- **Base Model:** DenseNet-121 (pre-trained on ImageNet)
- **Input Size:** 224x224x3
- **Output:** 7 emotion classes (happy, sad, anxious, calm, excited, frustrated, neutral)
- **Training:** Transfer learning with fine-tuning

## 🔗 Integration with Backend

The ML service integrates with the Node.js backend. See `backend/index.js` for integration details.

## 📁 Project Structure

```
ml_service/
├── train_model.py          # Training script
├── predict_emotion.py      # Inference script
├── app.py                  # Flask API server
├── requirements.txt        # Python dependencies
├── README.md              # This file
├── dataset/               # Dataset folder (after download)
├── models/                # Saved models (after training)
│   ├── densenet121_emotion_model.h5
│   ├── class_indices.json
│   └── training_history.png
└── uploads/               # Temporary upload folder
```

## 🐛 Troubleshooting

1. **Model not found error:**
   - Make sure you've trained the model first
   - Check that `models/densenet121_emotion_model.h5` exists

2. **Dataset not found:**
   - Verify dataset is downloaded and extracted
   - Check folder structure matches expected format

3. **GPU not detected:**
   - Install CUDA and cuDNN for GPU support
   - Or use CPU (slower but works)

4. **Memory errors:**
   - Reduce batch size in `train_model.py`
   - Use smaller image size
   - Close other applications

## 📝 Notes

- The model uses transfer learning from ImageNet pre-trained DenseNet-121
- Data augmentation is applied during training
- Model checkpoints are saved during training
- Early stopping prevents overfitting

