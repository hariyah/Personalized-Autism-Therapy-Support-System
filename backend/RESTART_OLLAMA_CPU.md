# How to Restart Ollama in CPU Mode

## ⚠️ Important: You Must Restart Ollama

If you're getting CUDA or GPU memory errors, Ollama is still trying to use your GPU. You need to **completely stop and restart** Ollama with CPU mode enabled.

## Step-by-Step Instructions

### Step 1: Stop Ollama Completely

**Option A: If Ollama is running in a terminal window:**
- Press `Ctrl+C` in that window
- Close the window

**Option B: If Ollama is running as a service:**
- Open Task Manager (Ctrl+Shift+Esc)
- Find "Ollama" process
- Right-click → End Task

### Step 2: Start Ollama in CPU Mode

**Easiest Method - Use the Batch File:**
1. Navigate to the `backend` folder
2. Double-click `start_ollama_cpu.bat`
3. Keep that window open

**Or Use Command Prompt (CMD):**
```cmd
cd C:\Users\creat\Desktop\cognitive_plan\backend
set OLLAMA_NUM_GPU=0
ollama serve
```

**Or Use PowerShell:**
```powershell
cd C:\Users\creat\Desktop\cognitive_plan\backend
$env:OLLAMA_NUM_GPU = "0"
ollama serve
```

### Step 3: Verify It's Working

In a NEW terminal, test:
```cmd
ollama run llama3.1:8b "Hello"
```

If this works without errors, Ollama is running in CPU mode.

### Step 4: Restart Your FastAPI Server

1. Stop your current FastAPI server (Ctrl+C)
2. Start it again:
   ```cmd
   cd backend
   uvicorn app.main:app --reload
   ```

### Step 5: Try the Recommendation Request Again

Now it should work!

## Troubleshooting

**Still getting CUDA errors?**
- Make sure you completely stopped the old Ollama process
- Check Task Manager - no Ollama processes should be running
- Start fresh with the batch file

**Can't find the batch file?**
- Navigate to: `C:\Users\creat\Desktop\cognitive_plan\backend`
- Look for `start_ollama_cpu.bat`

**Ollama won't start?**
- Make sure Ollama is installed
- Try: `ollama --version` to verify installation

