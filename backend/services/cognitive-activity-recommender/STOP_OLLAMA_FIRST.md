# Ollama is Already Running - How to Stop and Restart

## The Problem
You're getting: "bind: Only one usage of each socket address is normally permitted"
This means Ollama is already running and using port 11434.

## Solution: Stop Ollama First

### Method 1: Use Task Manager (Easiest)

1. Press `Ctrl+Shift+Esc` to open Task Manager
2. Click on the "Details" tab
3. Look for `ollama.exe` in the list
4. Right-click on it → "End task"
5. Now start Ollama in CPU mode using `start_ollama_cpu.bat`

### Method 2: Use Command Line

**In CMD:**
```cmd
taskkill /F /IM ollama.exe
```

**In PowerShell:**
```powershell
Stop-Process -Name ollama -Force
```

Wait 2-3 seconds, then start Ollama in CPU mode:
```cmd
set OLLAMA_NUM_GPU=0
ollama serve
```

### Method 3: Use the Batch Script

1. Double-click `stop_and_restart_ollama_cpu.bat`
2. This will automatically stop Ollama and restart it in CPU mode

## Verify Ollama Stopped

Check if Ollama is still running:
```cmd
tasklist | findstr ollama
```

If you see `ollama.exe` in the output, it's still running. Use one of the methods above to stop it.

## After Stopping

1. Wait 2-3 seconds
2. Start Ollama in CPU mode:
   ```cmd
   set OLLAMA_NUM_GPU=0
   ollama serve
   ```
3. Keep that window open
4. Restart your FastAPI server

## Quick Test

After restarting, test if it works:
```cmd
ollama run llama3.1:8b "Hello"
```

If this works without CUDA errors, you're good to go!

