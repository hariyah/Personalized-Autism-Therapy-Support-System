@echo off
setlocal ENABLEDELAYEDEXPANSION
REM Automated pipeline: venv setup -> install -> diagnostics -> conservative train -> eval -> start services

REM Move to repo root based on this script location
pushd "%~dp0..\.."

REM 1) Create/activate venv and install dependencies
REM Use a short venv path to avoid Windows MAX_PATH issues with TensorFlow
set "VENV_PATH=%USERPROFILE%\mlvenv_autism"
if not exist "%VENV_PATH%" (
  echo Creating Python virtual environment at %VENV_PATH% ...
  py -m venv "%VENV_PATH%" || goto :error
)
call "%VENV_PATH%\Scripts\activate.bat" || goto :error
  py -m pip install --upgrade pip || goto :error
  py -m pip install --upgrade wheel setuptools || goto :error
  REM Best-effort dependency install; continue if network blocks TensorFlow
  py -m pip install --no-cache-dir -r ml_service\requirements.txt || echo Pip install encountered issues; continuing with global packages.

REM 2) Diagnostics: confirm generators and labels
pushd ml_service
if exist debug_output (echo Cleaning previous debug_output & rmdir /S /Q debug_output)
  py debug_generators.py || goto :error
popd

REM 3) Train conservative DenseNet121 (low LR, few epochs)
pushd ml_service
  py quick_finetune_conservative.py || goto :error
set MODEL_PATH=models\densenet121_emotion_model_conservative.keras
REM Always also train oversample variant for comparison
  py quick_finetune_oversample.py || echo Oversample training failed, continuing with conservative.

REM 4) Evaluate both models on test set (if present) and write separate reports
  py eval_testset.py --model_path models\densenet121_emotion_model_conservative.keras --output eval_conservative_results.json || echo Conservative eval failed.
if exist models\densenet121_emotion_model_oversample.keras (
  py eval_testset.py --model_path models\densenet121_emotion_model_oversample.keras --output eval_oversample_results.json || echo Oversample eval failed.
)
popd

REM 5) Auto-select best model and export ML_MODEL_PATH for this session
for /f "usebackq delims=" %%A in (`py ml_service\select_best_model.py`) do set ML_MODEL_PATH=%%A
if not defined ML_MODEL_PATH (
  echo Failed to select best model; falling back to conservative.
  set ML_MODEL_PATH=%CD%\ml_service\models\densenet121_emotion_model_conservative.keras
)

REM 6) Start services (ML service, backend, frontend)
if exist "additional files\START_ALL_SERVICES.bat" (
  echo Starting all services via START_ALL_SERVICES.bat...
  call "additional files\START_ALL_SERVICES.bat"
) else (
  echo Starting ML service...
  start "ml_service" cmd /c "additional files\ml_service\start_ml_service.bat"
  echo Starting backend...
  start "backend" cmd /c "backend\index.js"
  echo Starting frontend...
  start "frontend" cmd /c "cd frontend && npm start"
)

echo Done. Best model: %ML_MODEL_PATH%
echo Check ml_service\debug_output\debug_report.json, eval_conservative_results.json, and eval_oversample_results.json.
goto :eof

:error
echo Failed at step: %ERRORLEVEL%
exit /b %ERRORLEVEL%
