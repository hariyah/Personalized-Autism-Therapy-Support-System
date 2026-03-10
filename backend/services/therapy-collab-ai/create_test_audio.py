#!/usr/bin/env python3
"""Generate test audio with speech for autism support application"""
import os
import sys
from pathlib import Path

# Try pyttsx3 first (offline, no dependencies)
try:
    import pyttsx3
    engine = pyttsx3.init()
    engine.setProperty('rate', 150)  # Slow down speech
    
    # Test speech content about autism support scenarios
    test_messages = [
        "My child is experiencing sensory overload. They are having difficulty with loud noises and need immediate support.",
        "There has been significant regression in social skills over the past week. The child is withdrawing from peer interactions.",
        "We are observing increased anxiety and meltdowns. The child needs calming strategies and routine adjustments.",
    ]
    
    # Use the first message
    message = test_messages[0]
    output_path = Path(__file__).parent / "uploads" / "test_speech.mp3"
    output_path.parent.mkdir(exist_ok=True)
    
    # Save to temp WAV first (pyttsx3 native format)
    temp_wav = output_path.with_suffix('.wav')
    engine.save_to_file(message, str(temp_wav))
    engine.runAndWait()
    
    # Try to convert WAV to MP3 using sox or ffmpeg if available
    if os.system(f'ffmpeg -i "{temp_wav}" -q:a 9 -n "{output_path}" 2>nul') == 0:
        os.remove(temp_wav)
        print(f"[SUCCESS] Created test audio: {output_path}")
        print(f"Message: {message}")
        sys.exit(0)
    else:
        # Fall back to WAV
        output_path_wav = output_path.with_suffix('.wav')
        os.rename(temp_wav, output_path_wav)
        print(f"[SUCCESS] Created test audio (WAV): {output_path_wav}")
        print(f"Message: {message}")
        sys.exit(0)

except ImportError:
    print("[INFO] pyttsx3 not available, trying gTTS...")
    try:
        from gtts import gTTS
        
        message = "My child is experiencing sensory overload. They are having difficulty with loud noises and need immediate support."
        output_path = Path(__file__).parent / "uploads" / "test_speech.mp3"
        output_path.parent.mkdir(exist_ok=True)
        
        tts = gTTS(text=message, lang='en', slow=False)
        tts.save(str(output_path))
        print(f"[SUCCESS] Created test audio: {output_path}")
        print(f"Message: {message}")
        sys.exit(0)
        
    except ImportError:
        print("[ERROR] Neither pyttsx3 nor gTTS available")
        print("[INFO] Installing gTTS...")
        os.system(f'"{sys.executable}" -m pip install gtts -q')
        
        from gtts import gTTS
        message = "My child is experiencing sensory overload. They are having difficulty with loud noises and need immediate support."
        output_path = Path(__file__).parent / "uploads" / "test_speech.mp3"
        output_path.parent.mkdir(exist_ok=True)
        
        tts = gTTS(text=message, lang='en', slow=False)
        tts.save(str(output_path))
        print(f"[SUCCESS] Created test audio: {output_path}")
        print(f"Message: {message}")
        sys.exit(0)
