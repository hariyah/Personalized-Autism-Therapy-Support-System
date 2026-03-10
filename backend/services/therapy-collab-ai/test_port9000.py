#!/usr/bin/env python3
"""Test endpoint on port 9000"""
import requests
import json
from pathlib import Path

audio_file = Path("uploads/test_speech.wav")
print(f"[INFO] Testing /analyze-voice on port 9000")
print(f"[INFO] Audio file: {audio_file.name} ({audio_file.stat().st_size} bytes)")

try:
    with open(audio_file, 'rb') as f:
        files = {'file': f}
        response = requests.post('http://localhost:9000/analyze-voice', files=files)
    
    print(f"\n[RESULT] Status: {response.status_code}")
    result = response.json()
    print(json.dumps(result, indent=2))
    
    if result.get('transcript'):
        print(f"\n✓ TRANSCRIPT: {result['transcript']}")
    else:
        print(f"\n✗ Transcript empty")
        
except Exception as e:
    print(f"[ERROR] {e}")
