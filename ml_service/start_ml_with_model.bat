@echo off
setlocal enabledelayedexpansion
rem Usage: start_ml_with_model.bat "C:\full\path\to\model.keras"
if "%~1"=="" (
  echo [start] Model path argument is required.
  exit /b 1
)
set "ML_MODEL_PATH=%~1"
cd /d "%~dp0"
echo [start] Launching ML Service with model:
echo          %ML_MODEL_PATH%
py -3.11 app.py
