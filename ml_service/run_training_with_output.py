"""
Run training with real-time output display
"""

import sys
import subprocess
import os

# Change to script directory
os.chdir(os.path.dirname(os.path.abspath(__file__)))

print("=" * 70)
print("Starting DenseNet-121 Training with Real-Time Output")
print("=" * 70)
print()
print("This will show all training progress...")
print("Press Ctrl+C to stop")
print()
print("-" * 70)
print()

# Run training with real-time output
try:
    process = subprocess.Popen(
        [sys.executable, 'train_model.py'],
        stdout=subprocess.PIPE,
        stderr=subprocess.STDOUT,
        universal_newlines=True,
        bufsize=1
    )
    
    # Print output line by line
    for line in process.stdout:
        print(line, end='')
        sys.stdout.flush()
    
    process.wait()
    
    if process.returncode == 0:
        print()
        print("=" * 70)
        print("✅ Training completed successfully!")
        print("=" * 70)
    else:
        print()
        print("=" * 70)
        print(f"⚠️  Training exited with code {process.returncode}")
        print("=" * 70)
        
except KeyboardInterrupt:
    print()
    print("⚠️  Training interrupted by user")
    if 'process' in locals():
        process.terminate()
except Exception as e:
    print(f"❌ Error: {e}")
    import traceback
    traceback.print_exc()

