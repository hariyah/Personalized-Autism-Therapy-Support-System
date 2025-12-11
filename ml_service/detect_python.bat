@echo off
setlocal

rem Detect a usable Python interpreter, preferring 3.11, then 3.10, 3.9, generic 3.
set "PY_CMD="

py -3.11 -c "print(0)" >nul 2>&1 && set "PY_CMD=py -3.11"
if not defined PY_CMD py -3.10 -c "print(0)" >nul 2>&1 && set "PY_CMD=py -3.10"
if not defined PY_CMD py -3.9 -c "print(0)" >nul 2>&1 && set "PY_CMD=py -3.9"
if not defined PY_CMD py -3 -c "print(0)" >nul 2>&1 && set "PY_CMD=py -3"
if not defined PY_CMD python -c "print(0)" >nul 2>&1 && set "PY_CMD=python"

if not defined PY_CMD (
  echo [python] No suitable Python found. Please install Python 3.10+.
  exit /b 1
)

rem Export to caller
endlocal & set "PY_CMD=%PY_CMD%"
exit /b 0
