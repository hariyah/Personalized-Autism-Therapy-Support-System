# Ollama Setup Guide

## Installation

1. **Download and Install Ollama:**
   - Visit https://ollama.ai
   - Download the Windows installer
   - Run the installer and follow the setup wizard

2. **Verify Installation:**
   ```powershell
   ollama --version
   ```

3. **Pull a Small Model (Recommended):**
   
   **Smallest model (3B - recommended for most systems):**
   ```powershell
   ollama pull llama3.2:3b
   ```
   This downloads the 3B model (approximately 2GB), which works on most systems with limited VRAM.
   
   **Medium model (8B - if you have more memory):**
   ```powershell
   ollama pull llama3.1:8b
   ```
   This downloads the 8B quantized version (approximately 4.7GB).
   
   **For CPU-only systems:**
   ```powershell
   ollama pull llama3.2:3b
   set OLLAMA_NUM_GPU=0
   ```

4. **Verify Model is Available:**
   ```powershell
   ollama list
   ```
   You should see `llama3.1` in the list.

## Starting Ollama

Ollama typically runs as a background service on Windows. If it's not running:

1. **Check if Ollama is running:**
   - Open Task Manager
   - Look for "Ollama" process
   - Or check if http://localhost:11434 is accessible in your browser

2. **Start Ollama manually (if needed):**
   - Open Command Prompt or PowerShell
   - Run: `ollama serve`
   - Keep this window open (or run it as a service)

3. **Test the API:**
   ```powershell
   curl http://localhost:11434/api/tags
   ```
   Or visit http://localhost:11434/api/tags in your browser

## Configuration

The backend is already configured to use Ollama by default:
- Endpoint: `http://localhost:11434/api/chat`
- Model: `llama3.1`

You can override these in your `.env` file:
```
OLLAMA_ENDPOINT=http://localhost:11434/api/chat
OLLAMA_MODEL=llama3.2:3b
```

**Note:** The default is set to `llama3.2:3b` (3B model) which is the smallest and works on most systems. If you have more VRAM available, you can use `llama3.1:8b` (8B quantized) for better quality.

## Troubleshooting

### "Connection refused" or "All connection attempts failed"
- **Solution:** Ollama is not running. Start it with `ollama serve` or ensure the service is running.

### "Model not found"
- **Solution:** Pull the model: `ollama pull llama3.1:8b` (or the model name you configured)

### "Out of memory" or "cudaMalloc failed"
- **Solution 1:** Use a smaller quantized model:
  ```powershell
  ollama pull llama3.1:8b
  ```
  Then update your `.env` file: `OLLAMA_MODEL=llama3.1:8b`

- **Solution 2:** Force CPU mode (slower but uses RAM instead of VRAM):
  ```powershell
  set OLLAMA_NUM_GPU=0
  ollama serve
  ```

- **Solution 3:** Close other GPU-intensive applications to free VRAM

- **Solution 4:** Use an even smaller model:
  ```powershell
  ollama pull llama3.1:4b
  ```

### Port 11434 is already in use
- **Solution:** Another instance of Ollama might be running. Check Task Manager and stop duplicate processes.

### Slow responses
- **Solution:** This is normal for local LLMs. The first request may take longer as the model loads into memory. Subsequent requests will be faster. CPU mode will be slower than GPU mode.

## Testing Ollama Manually

Test if Ollama is working:
```powershell
ollama run llama3.1 "Hello, how are you?"
```

If this works, Ollama is properly set up and the backend should be able to connect to it.

