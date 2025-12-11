"""
Setup Verification Script
Checks if all required files and dependencies are in place
"""

import os
import sys
import subprocess
from pathlib import Path

def check_file(filepath, description):
    """Check if a file exists"""
    exists = os.path.exists(filepath)
    status = "✅" if exists else "❌"
    print(f"{status} {description}: {filepath}")
    return exists

def check_python_package(package_name):
    """Check if a Python package is installed"""
    try:
        __import__(package_name)
        print(f"✅ {package_name} is installed")
        return True
    except ImportError:
        print(f"❌ {package_name} is NOT installed")
        return False

def check_directory(dirpath, description):
    """Check if a directory exists"""
    exists = os.path.exists(dirpath)
    status = "✅" if exists else "❌"
    print(f"{status} {description}: {dirpath}")
    return exists

def main():
    print("=" * 60)
    print("ML Service Setup Verification")
    print("=" * 60)
    
    all_ok = True
    
    # Check required files
    print("\n📄 Checking required files...")
    files_to_check = [
        ('train_model.py', 'Training script'),
        ('predict_emotion.py', 'Prediction script'),
        ('app.py', 'Flask API server'),
        ('requirements.txt', 'Dependencies file'),
        ('download_dataset.py', 'Dataset downloader'),
        ('README.md', 'Documentation'),
    ]
    
    for filepath, description in files_to_check:
        if not check_file(filepath, description):
            all_ok = False
    
    # Check Python packages
    print("\n📦 Checking Python packages...")
    packages = [
        'tensorflow',
        'keras',
        'numpy',
        'PIL',
        'flask',
        'flask_cors',
        'matplotlib',
        'sklearn'
    ]
    
    for package in packages:
        if not check_python_package(package):
            all_ok = False
    
    # Check directories
    print("\n📁 Checking directories...")
    dirs_to_check = [
        ('models', 'Models directory'),
        ('dataset', 'Dataset directory (optional - for training)'),
    ]
    
    for dirpath, description in dirs_to_check:
        check_directory(dirpath, description)
    
    # Check if model is trained
    print("\n🤖 Checking trained model...")
    model_path = 'models/densenet121_emotion_model.h5'
    if os.path.exists(model_path):
        size = os.path.getsize(model_path) / (1024 * 1024)  # MB
        print(f"✅ Trained model found: {model_path} ({size:.2f} MB)")
    else:
        print(f"⚠️  Model not trained yet: {model_path}")
        print("   Run 'python train_model.py' to train the model")
    
    # Check Kaggle CLI
    print("\n🔍 Checking Kaggle CLI...")
    try:
        subprocess.run(['kaggle', '--version'], 
                      capture_output=True, check=True)
        print("✅ Kaggle CLI is installed")
    except (subprocess.CalledProcessError, FileNotFoundError):
        print("❌ Kaggle CLI is NOT installed")
        print("   Install with: pip install kaggle")
        all_ok = False
    
    # Summary
    print("\n" + "=" * 60)
    if all_ok:
        print("✅ All checks passed! Setup is complete.")
        print("\nNext steps:")
        print("1. Download dataset: python download_dataset.py")
        print("2. Train model: python train_model.py")
        print("3. Start ML service: python app.py")
    else:
        print("⚠️  Some checks failed. Please fix the issues above.")
        print("\nTo install missing packages:")
        print("  pip install -r requirements.txt")
    print("=" * 60)
    
    return all_ok

if __name__ == '__main__':
    success = main()
    sys.exit(0 if success else 1)

