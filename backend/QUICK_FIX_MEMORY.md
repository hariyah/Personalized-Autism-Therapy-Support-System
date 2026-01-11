# Quick Fix for "Out of Memory" Error

## Immediate Solution: Use CPU Mode

**Option 1: Quick Fix (Run this in PowerShell/CMD before starting your FastAPI server):**
```powershell
$env:OLLAMA_NUM_GPU=0
ollama serve
```
Keep this window open, then start your FastAPI server in another terminal.

**Option 2: Use the batch script:**
```powershell
.\start_ollama_cpu.bat
```

**Option 3: Pull a smaller model:**
```powershell
ollama pull llama3.1:8b
```
Then update your `.env` file:
```
OLLAMA_MODEL=llama3.1:8b
```

## Permanent Solution

1. **Pull the 8B quantized model:**
   ```powershell
   ollama pull llama3.1:8b
   ```

2. **Update your `.env` file in the backend directory:**
   ```
   OLLAMA_MODEL=llama3.1:8b
   ```

3. **If you still get memory errors, use CPU mode:**
   - Create a `.env` file in the backend directory
   - Add: `OLLAMA_NUM_GPU=0`
   - Restart Ollama: `ollama serve`

## Verify It's Working

After starting Ollama in CPU mode, test it:
```powershell
ollama run llama3.1:8b "Hello"
```

If this works, your FastAPI server should now be able to connect successfully.

