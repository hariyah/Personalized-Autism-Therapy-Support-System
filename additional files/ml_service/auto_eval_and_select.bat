@echo off
setlocal enabledelayedexpansion
set BASEDIR=%~dp0
pushd "%BASEDIR%"
cd /d "%BASEDIR%"

set MODEL_CONS=models\densenet121_emotion_model_conservative.keras
set MODEL_OVER=models\densenet121_emotion_model_oversample.keras

rem Prefer known test root if available
set TEST_ROOT=%BASEDIR%dataset\Autism emotion recogition dataset\Autism emotion recogition dataset\test
if exist "%TEST_ROOT%" (
  set "TEST_ARG= --test_root \"%TEST_ROOT%\""
) else (
  set "TEST_ARG="
)

echo [auto] Waiting for conservative model at "%MODEL_CONS%" ...

rem Wait up to 120 minutes, checking every 60 seconds
for /l %%i in (1,1,120) do (
  if exist "%MODEL_CONS%" goto EVAL
  echo [auto] Not found yet (%%i/120). Sleeping 60s...
  timeout /t 60 /nobreak >nul
)
echo [auto] Timeout waiting for conservative model. Exiting.
popd
exit /b 1

:EVAL
echo [auto] Conservative model found. Running evaluation...
py -3.11 eval_testset.py --model_path "%MODEL_CONS%" --output eval_conservative_results.json %TEST_ARG%
if errorlevel 1 (
  echo [auto] Evaluation failed for conservative model.
) else (
  echo [auto] Wrote eval_conservative_results.json
)

if exist "%MODEL_OVER%" (
  echo [auto] Oversample model found. Running evaluation...
  py -3.11 eval_testset.py --model_path "%MODEL_OVER%" --output eval_oversample_results.json %TEST_ARG%
  if errorlevel 1 (
    echo [auto] Evaluation failed for oversample model.
  ) else (
    echo [auto] Wrote eval_oversample_results.json
  )
) else (
  echo [auto] Oversample model not found; skipping oversample evaluation.
)

echo [auto] Selecting best model...
for /f "delims=" %%a in ('py -3.11 select_best_model.py') do set BEST=%%a
echo [auto] Best model: !BEST!
echo !BEST!> BEST_MODEL_PATH.txt

echo [auto] Done. Results:
echo   - eval_conservative_results.json (if success)
echo   - eval_oversample_results.json (if oversample existed)
echo   - BEST_MODEL_PATH.txt

popd
exit /b 0
