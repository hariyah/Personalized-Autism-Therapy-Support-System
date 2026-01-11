@echo off
echo Checking for running Ollama processes...
taskkill /F /IM ollama.exe 2>nul
if %errorlevel% equ 0 (
    echo Stopped existing Ollama process.
    timeout /t 2 /nobreak >nul
) else (
    echo No existing Ollama process found.
)
echo.
echo Starting Ollama in CPU mode...
echo This will use RAM instead of GPU memory (slower but works on any system)
echo.
set OLLAMA_NUM_GPU=0
echo Environment variable set: OLLAMA_NUM_GPU=0
echo.
echo Starting Ollama server...
ollama serve
pause

