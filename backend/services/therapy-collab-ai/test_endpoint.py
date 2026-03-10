#!/usr/bin/env python3
"""Test the analyze-voice endpoint with audio file"""
import requests
import json
from pathlib import Path

audio_file = Path("uploads/test_speech.mp3")
if not audio_file.exists():
    print(f"[ERROR] Audio file not found: {audio_file}")
    exit(1)

print(f"[INFO] Testing /analyze-voice with: {audio_file.name}")
print(f"[INFO] File size: {audio_file.stat().st_size} bytes")

try:
    with open(audio_file, 'rb') as f:
        files = {'file': f}
        response = requests.post('http://localhost:8000/analyze-voice', files=files)
    
    print(f"\n[INFO] Response status: {response.status_code}")
    result = response.json()
    print(f"\n[RESULT] Full response:")
    print(json.dumps(result, indent=2))
    
    # Analyze results
    if result.get('transcript'):
        print(f"\n✓ Transcript found: {result['transcript'][:100]}...")
    else:
        print(f"\n✗ Transcript is empty")
    
    if result.get('issue_label') != 'UNKNOWN':
        print(f"✓ Issue detected: {result['issue_label']}")
        if result.get('issue_top3'):
            print(f"  Top 3 issues: {result['issue_top3']}")
    else:
        print(f"✗ No issue detected (UNKNOWN)")
    
    if result.get('urgency_label') != 'UNKNOWN':
        print(f"✓ Urgency level: {result['urgency_label']}")
        if result.get('urgency_top3'):
            print(f"  Top 3 urgencies: {result['urgency_top3']}")
    else:
        print(f"✗ No urgency detected (UNKNOWN)")
    
    if result.get('summary') and result['summary'] != "No transcript available":
        print(f"✓ Summary: {result['summary'][:100]}...")
    else:
        print(f"✗ No summary generated")
        
except Exception as e:
    print(f"[ERROR] {type(e).__name__}: {e}")
    exit(1)
