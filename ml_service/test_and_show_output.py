"""
Test script to show output and check system status
"""

import sys
import os

print("=" * 70)
print("System Status Check")
print("=" * 70)
print()

# Check Python
print(f"Python version: {sys.version}")
print(f"Python executable: {sys.executable}")
print()

# Check TensorFlow
print("Checking TensorFlow...")
try:
    import tensorflow as tf
    print(f"✅ TensorFlow {tf.__version__} is installed")
    
    # Check GPU
    gpus = tf.config.list_physical_devices('GPU')
    if gpus:
        print(f"✅ GPU available: {len(gpus)} device(s)")
        for gpu in gpus:
            print(f"   - {gpu}")
    else:
        print("⚠️  No GPU detected - will use CPU (slower)")
    print()
except ImportError as e:
    print(f"❌ TensorFlow not installed: {e}")
    print("   Install with: pip install tensorflow")
    print()
    sys.exit(1)

# Check other dependencies
deps = ['keras', 'numpy', 'PIL', 'flask', 'flask_cors', 'matplotlib', 'sklearn']
print("Checking dependencies...")
for dep in deps:
    try:
        if dep == 'PIL':
            import PIL
            print(f"✅ Pillow (PIL) installed")
        elif dep == 'sklearn':
            import sklearn
            print(f"✅ scikit-learn installed")
        else:
            __import__(dep)
            print(f"✅ {dep} installed")
    except ImportError:
        print(f"❌ {dep} not installed")
print()

# Check dataset
print("Checking dataset...")
if os.path.exists('dataset'):
    file_count = 0
    for root, dirs, files in os.walk('dataset'):
        file_count += len(files)
        if file_count > 100:  # Just sample
            break
    if file_count > 0:
        print(f"✅ Dataset folder exists with {file_count}+ files")
    else:
        print("⚠️  Dataset folder exists but appears empty")
        print("   Run: python download_dataset.py")
else:
    print("❌ Dataset folder not found")
    print("   Run: python download_dataset.py")
print()

# Check models folder
print("Checking models folder...")
os.makedirs('models', exist_ok=True)
if os.path.exists('models/densenet121_emotion_model.h5'):
    size_mb = os.path.getsize('models/densenet121_emotion_model.h5') / (1024 * 1024)
    print(f"✅ Trained model exists ({size_mb:.2f} MB)")
else:
    print("⚠️  Model not trained yet")
    print("   Run: python train_model.py")
print()

print("=" * 70)
print("To see training output, run in your terminal:")
print("  cd ml_service")
print("  python train_model.py")
print("=" * 70)

