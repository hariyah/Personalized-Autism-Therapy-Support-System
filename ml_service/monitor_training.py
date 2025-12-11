"""
Monitor training progress by checking for model file and output
"""

import os
import time
import subprocess
import sys

def check_training_status():
    """Check if training is running or completed"""
    print("=" * 70)
    print("Training Progress Monitor")
    print("=" * 70)
    print()
    
    # Check if model exists
    model_path = 'models/densenet121_emotion_model.h5'
    if os.path.exists(model_path):
        size_mb = os.path.getsize(model_path) / (1024 * 1024)
        print(f"✅ Model file exists: {model_path}")
        print(f"   Size: {size_mb:.2f} MB")
        print(f"   Status: Training appears to be COMPLETE!")
        return True
    else:
        print(f"⏳ Model file not found yet: {model_path}")
        print(f"   Status: Training may still be running or not started")
        return False
    
    # Check for other files
    print()
    print("Checking for other training artifacts...")
    
    if os.path.exists('models/class_indices.json'):
        print("✅ Class indices file exists")
    
    if os.path.exists('models/training_history.png'):
        print("✅ Training history plot exists")
    
    # Check if Python process is running
    print()
    print("Checking for running Python processes...")
    try:
        result = subprocess.run(['tasklist', '/FI', 'IMAGENAME eq python.exe'], 
                              capture_output=True, text=True)
        if 'python.exe' in result.stdout:
            print("✅ Python process is running (training may be in progress)")
        else:
            print("⚠️  No Python process found")
    except:
        print("⚠️  Could not check processes")
    
    print()
    print("=" * 70)

def monitor_loop():
    """Monitor training progress"""
    print("Monitoring training progress...")
    print("Press Ctrl+C to stop monitoring")
    print()
    
    check_count = 0
    try:
        while True:
            check_count += 1
            print(f"\n[{check_count}] Checking status... ({time.strftime('%H:%M:%S')})")
            
            if check_training_status():
                print("\n🎉 Training completed! Model is ready.")
                break
            
            print("\nWaiting 30 seconds before next check...")
            time.sleep(30)
            
    except KeyboardInterrupt:
        print("\n\nMonitoring stopped by user")

if __name__ == '__main__':
    if len(sys.argv) > 1 and sys.argv[1] == '--monitor':
        monitor_loop()
    else:
        check_training_status()
        print("\n💡 Tip: Run with --monitor flag to continuously monitor:")
        print("   python monitor_training.py --monitor")

