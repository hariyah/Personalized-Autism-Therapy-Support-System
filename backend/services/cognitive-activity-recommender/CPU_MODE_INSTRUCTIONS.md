# How to Start Ollama in CPU Mode

## Option 1: Use the Batch Script (Easiest - Windows CMD)

1. Navigate to the `backend` folder
2. Double-click `start_ollama_cpu.bat`
3. Keep that window open
4. Start your FastAPI server in another terminal

## Option 2: PowerShell

Open PowerShell and run:
```powershell
$env:OLLAMA_NUM_GPU = "0"
ollama serve
```

Keep this window open, then start your FastAPI server in another terminal.

## Option 3: Command Prompt (CMD)

Open CMD and run:
```cmd
set OLLAMA_NUM_GPU=0
ollama serve
```

Keep this window open, then start your FastAPI server in another terminal.

## Option 4: PowerShell Script

1. Navigate to the `backend` folder
2. Right-click `start_ollama_cpu.ps1`
3. Select "Run with PowerShell"
4. Keep that window open

## Verify It's Working

After starting Ollama in CPU mode, test it:
```powershell
ollama run llama3.1:8b "Hello"
```

If this works, your FastAPI server should now be able to connect successfully.

## Important Notes

- **Keep the Ollama window open** - Don't close it while using the application
- **CPU mode is slower** - But it uses RAM instead of GPU memory, so it works on any system
- **Restart FastAPI** - After starting Ollama in CPU mode, restart your FastAPI server

