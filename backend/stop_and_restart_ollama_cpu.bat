@echo off
echo Stopping any running Ollama processes...
taskkill /F /IM ollama.exe 2>nul
timeout /t 2 /nobreak >nul

echo.
echo Starting Ollama in CPU mode...
set OLLAMA_NUM_GPU=0
ollama serve

