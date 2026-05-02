#!/usr/bin/env python3
"""Debug Whisper ASR directly"""
from pathlib import Path
from transformers import pipeline
import librosa

audio_path = "uploads/test_speech.wav"
print(f"[INFO] Testing Whisper on: {audio_path}")
print(f"[INFO] File exists: {Path(audio_path).exists()}")
print(f"[INFO] File size: {Path(audio_path).stat().st_size} bytes")

# Load audio
audio_data, sr = librosa.load(audio_path, sr=16000)
print(f"[INFO] Audio loaded: shape={audio_data.shape}, sr={sr}, duration={len(audio_data)/sr:.2f}s")
print(f"[INFO] Audio values range: min={audio_data.min():.4f}, max={audio_data.max():.4f}")

# Test Whisper directly
try:
    print("\n[INFO] Loading Whisper...")
    asr = pipeline("automatic-speech-recognition", model="openai/whisper-small", device=0)
    print("[OK] Whisper loaded")
    
    print("\n[INFO] Testing with file path...")
    result1 = asr(audio_path)
    print(f"[RESULT] File path input: {result1}")
    
    print("\n[INFO] Testing with numpy array...")
    result2 = asr(audio_data)
    print(f"[RESULT] Numpy array input: {result2}")
    
except Exception as e:
    print(f"[ERROR] {type(e).__name__}: {e}")
    import traceback
    traceback.print_exc()
