"""
View Training Output - Runs training with full output visible
"""

import sys
import os

# Change to script directory
os.chdir(os.path.dirname(os.path.abspath(__file__)))

print("=" * 70)
print("DenseNet-121 Emotion Recognition Model Training")
print("=" * 70)
print()

# Check Python and TensorFlow
try:
    import tensorflow as tf
    print(f"✅ TensorFlow version: {tf.__version__}")
    print(f"✅ GPU Available: {len(tf.config.list_physical_devices('GPU')) > 0}")
    if len(tf.config.list_physical_devices('GPU')) > 0:
        print(f"   GPU Devices: {tf.config.list_physical_devices('GPU')}")
    print()
except Exception as e:
    print(f"❌ Error importing TensorFlow: {e}")
    print("   Please install: pip install tensorflow")
    sys.exit(1)

# Check dataset
if not os.path.exists('dataset'):
    print("❌ Dataset folder not found!")
    print()
    print("📥 Please download the dataset first:")
    print("   1. Set up Kaggle API credentials")
    print("   2. Run: python download_dataset.py")
    print()
    sys.exit(1)

# Check if dataset has content
dataset_files = []
for root, dirs, files in os.walk('dataset'):
    dataset_files.extend(files)
    if len(dataset_files) > 10:  # Just check if there are files
        break

if len(dataset_files) == 0:
    print("⚠️  Dataset folder exists but appears empty!")
    print("   Please download the dataset first.")
    sys.exit(1)

print(f"✅ Dataset found with files")
print()

# Import and run training
print("🚀 Starting training...")
print("=" * 70)
print()

try:
    # Import the training function
    from train_model import train_model
    
    # Run training
    model, history = train_model()
    
    print()
    print("=" * 70)
    print("✅ Training completed successfully!")
    print("=" * 70)
    
except KeyboardInterrupt:
    print()
    print("⚠️  Training interrupted by user")
    sys.exit(1)
except Exception as e:
    print()
    print(f"❌ Error during training: {e}")
    import traceback
    traceback.print_exc()
    sys.exit(1)

