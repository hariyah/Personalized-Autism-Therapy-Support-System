@echo off
setlocal enabledelayedexpansion
set "BASEDIR=%~dp0"
REM Navigate to actual ml_service directory (two levels up from additional files/ml_service)
set "ML_SERVICE_DIR=%BASEDIR%..\..\ml_service"
pushd "%ML_SERVICE_DIR%"

if not exist "logs" mkdir "logs"

call "%BASEDIR%detect_python.bat" || (echo [service] Python not found & popd & exit /b 1)
rem After detect_python.bat returns, PY_CMD is set without quotes. Ensure no stray quotes.
for /f "delims=" %%P in ("%BASEDIR%detect_python.bat") do rem noop
set "PY_CMD=%PY_CMD%"

rem Accept optional model path as first arg; else read BEST_MODEL_PATH.txt from additional files
set "ML_MODEL_PATH=%~1"
if not defined ML_MODEL_PATH if exist "%BASEDIR%BEST_MODEL_PATH.txt" (
  for /f "usebackq delims=" %%B in ("%BASEDIR%BEST_MODEL_PATH.txt") do set "ML_MODEL_PATH=%%B"
)

set EMOTION_ALLOW_UNCERTAIN=1
rem Force UTF-8 to reduce encoding issues
set PYTHONIOENCODING=UTF-8
rem Stricter defaults to avoid low-confidence mislabels

set EMOTION_MIN_MARGIN=0.05
set EMOTION_MIN_CONF=0.2

echo [service] Using ML_MODEL_PATH: %ML_MODEL_PATH%
echo [service] Logging to %ML_SERVICE_DIR%\logs\ml_service.log
echo [service] Starting at %DATE% %TIME% > "%ML_SERVICE_DIR%\logs\ml_service.log"
echo [service] Thresholds: EMOTION_MIN_CONF=%EMOTION_MIN_CONF% EMOTION_MIN_MARGIN=%EMOTION_MIN_MARGIN% >> "%ML_SERVICE_DIR%\logs\ml_service.log"
echo [service] Invoking: %PY_CMD% -u app.py >> "%ML_SERVICE_DIR%\logs\ml_service.log"
%PY_CMD% -u app.py 1>> "%ML_SERVICE_DIR%\logs\ml_service.log" 2>&1

popd
exit /b 0
