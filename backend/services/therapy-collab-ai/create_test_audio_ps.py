#!/usr/bin/env python3
"""Create a more robust test audio using a different TTS engine"""
import subprocess
import sys
from pathlib import Path

output_path = Path("uploads/test_speech.wav")
output_path.parent.mkdir(exist_ok=True)

# Try using PowerShell's built-in text-to-speech capability
message = "My child is experiencing sensory overload. They are having difficulty with loud noises and need immediate support."

ps_script = f"""
Add-Type -AssemblyName System.Speech
$tts = New-Object System.Speech.Synthesis.SpeechSynthesizer
$tts.SetOutputToWaveFile('{output_path}')
$tts.Speak('{message.replace('"', '`"')}')
$tts.Dispose()
Write-Host "[OK] Created {output_path}"
"""

result = subprocess.run(['powershell', '-NoProfile', '-Command', ps_script], capture_output=True, text=True)
print(result.stdout)
if result.stderr:
    print(f"[INFO] {result.stderr}")

if output_path.exists():
    print(f"[SUCCESS] Audio file created: {output_path} ({output_path.stat().st_size} bytes)")
else:
    print("[ERROR] Failed to create audio file")
    sys.exit(1)
