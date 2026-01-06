@echo off
setlocal enabledelayedexpansion
set BASEDIR=%~dp0
pushd "%BASEDIR%"
cd /d "%BASEDIR%"

call "%BASEDIR%detect_python.bat" || (echo [restart] Python not found & popd & exit /b 1)

if not exist "logs" mkdir "logs"

if not exist BEST_MODEL_PATH.txt (
  echo [restart] BEST_MODEL_PATH.txt not found. Run auto_eval_and_select.bat first.
  popd
  exit /b 1
)

for /f "usebackq delims=" %%B in ("BEST_MODEL_PATH.txt") do set "ML_MODEL_PATH=%%B"
if not exist "%ML_MODEL_PATH%" (
  echo [restart] Model path from BEST_MODEL_PATH.txt does not exist:
  echo          %ML_MODEL_PATH%
  popd
  exit /b 1
)

echo [restart] Stopping any service listening on port 5000...
for /f "tokens=5" %%P in ('netstat -ano ^| findstr :5000') do (
  echo   Killing PID %%P
  taskkill /PID %%P /F >nul 2>&1
)

echo [restart] Starting ML Service with model:
echo          %ML_MODEL_PATH%
start "ML Service - Port 5000" "%BASEDIR%start_service_with_env.bat" "%ML_MODEL_PATH%"

popd
exit /b 0
