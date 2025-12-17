# How to View Training Output - Quick Guide

## Best Way: Run in Your Own Terminal

Since the automated tool doesn't show real-time output well, **run these commands directly in your Command Prompt or PowerShell**:

### Step 1: Open Command Prompt
Press `Win + R`, type `cmd`, press Enter

### Step 2: Navigate to ML Service
```bash
cd "C:\Users\avi\OneDrive - Sri Lanka Institute of Information Technology\Desktop\Personalized-Autism-Therapy-Support-System\ml_service"
```

### Step 3: Check Status First
```bash
python test_and_show_output.py
```

This shows:
-  Python version
-  TensorFlow installation
-  GPU/CPU status
-  Dataset status
-  Model status

### Step 4: Run Training (See All Output)
```bash
python train_model.py
```

**You'll see:**
- TensorFlow version
- GPU detection
- Dataset loading
- Model architecture
- **Real-time training progress:**
  ```
  Epoch 1/50
  47/47 [==============================] - 45s 950ms/step 
  - loss: 1.2345 - accuracy: 0.4567 
  - val_loss: 1.1234 - val_accuracy: 0.5123
  
  Epoch 2/50
  47/47 [==============================] - 42s 890ms/step 
  - loss: 0.9876 - accuracy: 0.5678 
  - val_loss: 0.9123 - val_accuracy: 0.6234
  ...
  ```
- Model saving confirmation
- Final results

##  Alternative: Check Progress Files

After training starts, check these files:

```bash
# Check if model is being created
dir ml_service\models\*.h5

# Check training history (after training)
dir ml_service\models\*.png

# Check class indices
dir ml_service\models\*.json
```

##  What's Happening Now

I've started the training process in the background. To see the output:

1. **Open a new Command Prompt window**
2. **Navigate to:** `ml_service` folder
3. **Run:** `python train_model.py`

Or check if the model file is being created:
```bash
dir ml_service\models\*.h5
```

##  If You See Dataset Error

If training shows "Dataset not found":
1. Set up Kaggle API (see SETUP_GUIDE.md)
2. Run: `python download_dataset.py`
3. Then: `python train_model.py`

##  Quick Status Check

Run this anytime to see current status:
```bash
cd ml_service
python test_and_show_output.py
```

This will tell you exactly what's installed, what's missing, and current status!

