# How to View Training Output

## View Output in Your Terminal

The best way to see all training output is to run the commands directly in your terminal (Command Prompt or PowerShell).

### Step 1: Open Terminal/Command Prompt

Open a new terminal window.

### Step 2: Navigate to ML Service

```bash
cd "C:\Users\avi\OneDrive - Sri Lanka Institute of Information Technology\Desktop\Personalized-Autism-Therapy-Support-System\ml_service"
```

### Step 3: Run Training (See All Output)

```bash
python train_model.py
```

This will show:
-  TensorFlow version
-  GPU/CPU detection
-  Dataset loading progress
   Model architecture
-  Training progress (epoch by epoch)
-  Validation accuracy
-  Loss values
-  Model saving confirmation

##  What You'll See

The training output will look like:

```
TensorFlow version: 2.13.0
GPU Available: [PhysicalDevice(name='/physical_device:GPU:0', device_type='GPU')]

 Preparing data generators...
Class indices: {'happy': 0, 'sad': 1, ...}
Number of training samples: 1500
Number of validation samples: 375

  Creating DenseNet-121 model...
Model: "model"
_________________________________________________________________
Layer (type)                 Output Shape              Param #
=================================================================
...

 Starting training (Phase 1: Frozen base model)...
Epoch 1/50
47/47 [==============================] - 45s 950ms/step - loss: 1.2345 - accuracy: 0.4567 - val_loss: 1.1234 - val_accuracy: 0.5123
Epoch 2/50
47/47 [==============================] - 42s 890ms/step - loss: 0.9876 - accuracy: 0.5678 - val_loss: 0.9123 - val_accuracy: 0.6234
...
```

##  Alternative: Check Status Script

Run this to see current status:

```bash
cd ml_service
python test_and_show_output.py
```

This shows:
- Python version
- TensorFlow installation
- GPU availability
- Dataset status
- Model training status

##  Check Files Directly

You can also check if training completed by looking for:

```bash
# Check if model exists
dir ml_service\models\*.h5

# Check training history plot
dir ml_service\models\*.png

# Check class indices
dir ml_service\models\*.json
```

##  Quick Commands

```bash
# See system status
cd ml_service
python test_and_show_output.py

# Run training with visible output
python train_model.py

# Check if model is ready
dir models\*.h5
```

##  Tips

1. **Keep terminal open** - Training takes 30-60 minutes, keep the window open
2. **Watch for errors** - If you see dataset errors, download it first
3. **Check progress** - Each epoch shows accuracy improving
4. **Model saved** - Look for "Model saved to..." message

##  If No Output Appears

If commands run but show no output:
1. Make sure Python is in your PATH
2. Try: `python --version` to verify Python works
3. Run commands directly in Command Prompt (not through IDE)
4. Check for error messages in red

