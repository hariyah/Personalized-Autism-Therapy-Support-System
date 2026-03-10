#!/usr/bin/env python3
"""Start server and test endpoint"""
import subprocess
import threading
import time
import requests
import json
from pathlib import Path

def run_server():
    """Run FastAPI server"""
    subprocess.run(
        [".\.venv\Scripts\python.exe", "-m", "uvicorn", "main:app", "--port", "8000"],
        cwd=str(Path(__file__).parent)
    )

# Start server in background thread
print("[INFO] Starting FastAPI server on port 8000...")
server_thread = threading.Thread(target=run_server, daemon=True)
server_thread.start()

# Wait for server to start
time.sleep(10)

# Test endpoint
audio_file = Path(__file__).parent / "uploads/test_speech.wav"
print(f"\n[INFO] Testing endpoint with: {audio_file.name}")

try:
    with open(audio_file, 'rb') as f:
        files = {'file': f}
        response = requests.post('http://localhost:8000/analyze-voice', files=files, timeout=60)
    
    print(f"[RESULT] Status: {response.status_code}")
    result = response.json()
    print(json.dumps(result, indent=2))
    
    # Check results
    print("\n=== ANALYSIS ===")
    if result.get('transcript'):
        print(f"✓ Transcript: {result['transcript']}")
    else:
        print(f"✗ Transcript empty")
    
    if result.get('issue_label') != 'UNKNOWN':
        print(f"✓ Issue: {result['issue_label']}")
        print(f"  Scores: {result.get('issue_top3', [])}")
    else:
        print(f"✗ No issue detected")
    
    if result.get('urgency_label') != 'UNKNOWN':
        print(f"✓ Urgency: {result['urgency_label']}")  
        print(f"  Scores: {result.get('urgency_top3', [])}")
    else:
        print(f"✗ No urgency detected")
        
except Exception as e:
    print(f"[ERROR] {e}")
    import traceback
    traceback.print_exc()
