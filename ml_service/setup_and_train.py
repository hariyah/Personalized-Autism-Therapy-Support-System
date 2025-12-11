"""
Automated Setup and Training Script
Attempts to download dataset and train model automatically
"""

import os
import sys
import subprocess
from pathlib import Path

def check_kaggle_setup():
    """Check if Kaggle is set up"""
    kaggle_path = Path.home() / '.kaggle' / 'kaggle.json'
    if os.name == 'nt':  # Windows
        kaggle_path = Path(os.environ.get('USERPROFILE', '')) / '.kaggle' / 'kaggle.json'
    
    return kaggle_path.exists()

def install_dependencies():
    """Install Python dependencies"""
    print("📦 Installing Python dependencies...")
    try:
        subprocess.run([sys.executable, '-m', 'pip', 'install', '-r', 'requirements.txt', '--quiet'], 
                      check=True)
        print("✅ Dependencies installed successfully!")
        return True
    except subprocess.CalledProcessError as e:
        print(f"❌ Error installing dependencies: {e}")
        return False

def download_dataset():
    """Download dataset from Kaggle"""
    print("\n📥 Attempting to download dataset...")
    
    if not check_kaggle_setup():
        print("⚠️  Kaggle credentials not found!")
        print("\n📋 Please set up Kaggle API:")
        print("   1. Go to https://www.kaggle.com/account")
        print("   2. Click 'Create New API Token'")
        print("   3. Place kaggle.json in:")
        if os.name == 'nt':
            print(f"      C:\\Users\\<username>\\.kaggle\\kaggle.json")
        else:
            print(f"      ~/.kaggle/kaggle.json")
        print("\n   Then run: python download_dataset.py")
        return False
    
    try:
        result = subprocess.run([sys.executable, 'download_dataset.py'], 
                              capture_output=True, text=True, timeout=300)
        if result.returncode == 0:
            print("✅ Dataset downloaded successfully!")
            return True
        else:
            print(f"⚠️  Dataset download had issues: {result.stderr}")
            return False
    except subprocess.TimeoutExpired:
        print("⏱️  Dataset download timed out (this is normal for large datasets)")
        return False
    except Exception as e:
        print(f"❌ Error downloading dataset: {e}")
        return False

def check_dataset():
    """Check if dataset exists"""
    dataset_dir = Path('dataset')
    if dataset_dir.exists() and any(dataset_dir.iterdir()):
        print("✅ Dataset folder exists and contains files")
        return True
    else:
        print("❌ Dataset not found. Please download it first.")
        return False

def train_model():
    """Train the DenseNet-121 model"""
    print("\n🏋️  Starting model training...")
    print("⏱️  This will take 30-60 minutes (GPU) or 2-4 hours (CPU)")
    print("   Training will run in the background...")
    
    try:
        # Run training (this is a long process)
        subprocess.run([sys.executable, 'train_model.py'], check=False)
        return True
    except KeyboardInterrupt:
        print("\n⚠️  Training interrupted by user")
        return False
    except Exception as e:
        print(f"❌ Error during training: {e}")
        return False

def main():
    print("=" * 60)
    print("Automated Setup and Training")
    print("=" * 60)
    
    # Step 1: Install dependencies
    if not install_dependencies():
        print("\n❌ Failed to install dependencies. Please install manually:")
        print("   pip install -r requirements.txt")
        return False
    
    # Step 2: Check/download dataset
    if not check_dataset():
        if check_kaggle_setup():
            download_dataset()
        else:
            print("\n⚠️  Please set up Kaggle credentials and download dataset manually")
            print("   Then run: python train_model.py")
            return False
    
    # Step 3: Train model
    print("\n" + "=" * 60)
    print("Ready to train model!")
    print("=" * 60)
    print("\n⚠️  Training is a long process. Would you like to:")
    print("   1. Start training now (will take 30-60 min / 2-4 hours)")
    print("   2. Skip training for now (run manually later)")
    
    # For automation, we'll attempt training
    # In interactive mode, user would choose
    response = input("\nStart training now? (y/n): ").lower().strip()
    
    if response == 'y':
        train_model()
    else:
        print("\n✅ Setup complete! Run 'python train_model.py' when ready to train.")
    
    return True

if __name__ == '__main__':
    try:
        main()
    except KeyboardInterrupt:
        print("\n\n⚠️  Setup interrupted by user")
        sys.exit(1)

