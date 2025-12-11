"""
Script to download the Autistic Children Emotions dataset from Kaggle
"""

import os
import subprocess
import sys
from pathlib import Path

def check_kaggle_installed():
    """Check if kaggle CLI is installed"""
    try:
        subprocess.run(['kaggle', '--version'], 
                      capture_output=True, check=True)
        return True
    except (subprocess.CalledProcessError, FileNotFoundError):
        return False

def download_dataset():
    """Download dataset from Kaggle"""
    print("=" * 60)
    print("Autistic Children Emotions Dataset Downloader")
    print("=" * 60)
    
    # Check if kaggle is installed
    if not check_kaggle_installed():
        print("\n❌ Kaggle CLI is not installed!")
        print("\n📥 Please install it first:")
        print("   pip install kaggle")
        print("\n📋 Then set up your Kaggle API credentials:")
        print("   1. Go to https://www.kaggle.com/account")
        print("   2. Click 'Create New API Token'")
        print("   3. Place kaggle.json in:")
        print("      - Linux/Mac: ~/.kaggle/")
        print("      - Windows: C:\\Users\\<username>\\.kaggle\\")
        return False
    
    # Create dataset directory
    dataset_dir = Path('dataset')
    dataset_dir.mkdir(exist_ok=True)
    
    print("\n📥 Downloading dataset...")
    print("   Dataset: fatmamtalaat/autistic-children-emotions-dr-fatma-m-talaat")
    
    try:
        # Download dataset
        result = subprocess.run([
            'kaggle', 'datasets', 'download',
            '-d', 'fatmamtalaat/autistic-children-emotions-dr-fatma-m-talaat',
            '-p', str(dataset_dir)
        ], check=True, capture_output=True, text=True)
        
        print("✅ Dataset downloaded successfully!")
        
        # Extract zip file
        zip_file = dataset_dir / 'autistic-children-emotions-dr-fatma-m-talaat.zip'
        if zip_file.exists():
            print("\n📦 Extracting dataset...")
            
            import zipfile
            with zipfile.ZipFile(zip_file, 'r') as zip_ref:
                zip_ref.extractall(dataset_dir)
            
            print("✅ Dataset extracted successfully!")
            
            # Remove zip file
            zip_file.unlink()
            print("🧹 Cleaned up zip file")
            
            print("\n✅ Dataset ready!")
            print(f"   Location: {dataset_dir.absolute()}")
            return True
        else:
            print("⚠️  Zip file not found. Please check the download.")
            return False
            
    except subprocess.CalledProcessError as e:
        print(f"\n❌ Error downloading dataset: {e}")
        print(f"   Error output: {e.stderr}")
        return False
    except Exception as e:
        print(f"\n❌ Unexpected error: {e}")
        return False

if __name__ == '__main__':
    success = download_dataset()
    sys.exit(0 if success else 1)

