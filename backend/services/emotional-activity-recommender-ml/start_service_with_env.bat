@echo off
setlocal enabledelayedexpansion
set "BASEDIR=%~dp0"
pushd "%BASEDIR%"

if not exist "logs" mkdir "logs"

call "%BASEDIR%detect_python.bat" || (echo [service] Python not found & popd & exit /b 1)
rem After detect_python.bat returns, PY_CMD is set without quotes. Ensure no stray quotes.
for /f "delims=" %%P in ("%BASEDIR%detect_python.bat") do rem noop
set "PY_CMD=%PY_CMD%"

rem Accept optional model path as first arg; else read BEST_MODEL_PATH.txt
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
rem Camera pipeline (main.py) reads CAMERA_MIN_* thresholds.
if not defined CAMERA_MIN_MARGIN set CAMERA_MIN_MARGIN=%EMOTION_MIN_MARGIN%
if not defined CAMERA_MIN_CONF set CAMERA_MIN_CONF=%EMOTION_MIN_CONF%
if not defined CAMERA_MIN_CONF_NATURAL set CAMERA_MIN_CONF_NATURAL=0.40
if not defined CAMERA_MIN_CONF_EMOTION set CAMERA_MIN_CONF_EMOTION=0.20
if not defined CAMERA_NEUTRAL_OVERRIDE_MARGIN set CAMERA_NEUTRAL_OVERRIDE_MARGIN=0.20
if not defined CAMERA_NEUTRAL_MIN_EMOTION_CONF set CAMERA_NEUTRAL_MIN_EMOTION_CONF=0.20
if not defined CAMERA_NEUTRAL_MAX_CONF set CAMERA_NEUTRAL_MAX_CONF=0.75
if not defined CAMERA_NEUTRAL_NEGATIVE_MASS_MIN set CAMERA_NEUTRAL_NEGATIVE_MASS_MIN=0.33

echo [service] Using ML_MODEL_PATH: %ML_MODEL_PATH%
echo [service] Logging to %BASEDIR%logs\ml_service.log
echo [service] Starting at %DATE% %TIME% > "%BASEDIR%logs\ml_service.log"
echo [service] Thresholds: EMOTION_MIN_CONF=%EMOTION_MIN_CONF% EMOTION_MIN_MARGIN=%EMOTION_MIN_MARGIN% CAMERA_MIN_CONF=%CAMERA_MIN_CONF% CAMERA_MIN_MARGIN=%CAMERA_MIN_MARGIN% CAMERA_MIN_CONF_NATURAL=%CAMERA_MIN_CONF_NATURAL% CAMERA_MIN_CONF_EMOTION=%CAMERA_MIN_CONF_EMOTION% CAMERA_NEUTRAL_OVERRIDE_MARGIN=%CAMERA_NEUTRAL_OVERRIDE_MARGIN% CAMERA_NEUTRAL_MIN_EMOTION_CONF=%CAMERA_NEUTRAL_MIN_EMOTION_CONF% CAMERA_NEUTRAL_MAX_CONF=%CAMERA_NEUTRAL_MAX_CONF% CAMERA_NEUTRAL_NEGATIVE_MASS_MIN=%CAMERA_NEUTRAL_NEGATIVE_MASS_MIN% >> "%BASEDIR%logs\ml_service.log"
echo [service] Invoking: %PY_CMD% -u app.py >> "%BASEDIR%logs\ml_service.log"
%PY_CMD% -u app.py 1>> "%BASEDIR%logs\ml_service.log" 2>&1

popd
exit /b 0
