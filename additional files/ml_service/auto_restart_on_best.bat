@echo off
setlocal enabledelayedexpansion
set BASEDIR=%~dp0
pushd "%BASEDIR%"
cd /d "%BASEDIR%"

echo [auto] Watching for BEST_MODEL_PATH.txt to trigger ML restart...

rem Wait up to 120 minutes, checking every 30 seconds
for /l %%i in (1,1,240) do (
  if exist BEST_MODEL_PATH.txt goto RESTART
  timeout /t 30 /nobreak >nul
)
echo [auto] Timeout waiting for BEST_MODEL_PATH.txt. Exiting.
popd
exit /b 1

:RESTART
echo [auto] BEST_MODEL_PATH.txt detected. Restarting ML with best model...
call restart_ml_with_best.bat
echo [auto] Restart attempted. Exiting watcher.
popd
exit /b 0
