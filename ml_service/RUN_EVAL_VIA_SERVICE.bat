@echo off
setlocal enabledelayedexpansion
set BASEDIR=%~dp0
pushd "%BASEDIR%"
cd /d "%BASEDIR%"

call "%BASEDIR%detect_python.bat" || (echo [eval] Python not found & popd & exit /b 1)
echo [eval] Using Python: %PY_CMD%

if not exist "logs" mkdir "logs"

echo [eval] Ensuring Python deps (requests, etc.)...
echo [log] Writing to logs\pip_install.log
%PY_CMD% -m pip install -r requirements.txt 1>"logs\pip_install.log" 2>&1

set TEST_ROOT=%BASEDIR%dataset\Autism emotion recogition dataset\Autism emotion recogition dataset\test
if not exist "%TEST_ROOT%" (
  echo [eval] Test root not found:
  echo        %TEST_ROOT%
  echo [eval] Please adjust the path in RUN_EVAL_VIA_SERVICE.bat and retry.
  popd
  exit /b 1
)

echo [eval] Checking ML service health ...
echo [log] Writing to logs\health_check.log
%PY_CMD% service_health_check.py 1>"logs\health_check.log" 2>&1
if errorlevel 1 (
  echo [eval] Service not healthy. Restarting with best model...
  call restart_ml_with_best.bat
  echo [eval] Waiting for service to become healthy...
  set ATTEMPTS=0
  :WAIT_HEALTH
  timeout /t 5 /nobreak >nul
  %PY_CMD% service_health_check.py 1>"logs\health_check.log" 2>&1
  if errorlevel 1 (
    set /a ATTEMPTS+=1
    echo [eval] Still waiting... attempt !ATTEMPTS!/60
    if !ATTEMPTS! GEQ 60 (
      echo [eval] Timed out waiting for healthy service.
      popd
      exit /b 1
    )
    goto WAIT_HEALTH
  )
)

echo [eval] Service healthy. Running evaluation via service...
echo [log] Writing to logs\eval_service.log
%PY_CMD% -u eval_via_service.py --test_root "%TEST_ROOT%" --output eval_conservative_results.json 1>"logs\eval_service.log" 2>&1
if errorlevel 1 (
  echo [eval] Evaluation failed. See any errors above.
  type "logs\eval_service.log" | more
  popd
  exit /b 1
)

echo [eval] Done. Results written to eval_conservative_results.json
echo [eval] Summary of evaluation log:
type "logs\eval_service.log" | more
popd
exit /b 0
