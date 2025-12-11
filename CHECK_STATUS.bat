@echo off
title Application Status Check - November 30, 2025
color 0B

echo.
echo ════════════════════════════════════════════════════════════════════════
echo   PERSONALIZED AUTISM THERAPY SUPPORT SYSTEM - STATUS CHECK
echo ════════════════════════════════════════════════════════════════════════
echo.

REM Check Backend
echo Checking Backend (Port 3001)...
netstat -ano | findstr ":3001" | findstr "LISTENING" >nul
if %errorlevel% equ 0 (
    echo   [OK] Backend Server is RUNNING on http://localhost:3001/api/
) else (
    echo   [FAIL] Backend Server is NOT running
)
echo.

REM Check Frontend
echo Checking Frontend (Port 3000)...
netstat -ano | findstr ":3000" >nul
if %errorlevel% equ 0 (
    echo   [OK] Frontend Application is RUNNING on http://localhost:3000
) else (
    echo   [WAIT] Frontend Application may still be initializing...
)
echo.

REM Check Python
echo Checking Python Installation...
python --version >nul 2>&1
if %errorlevel% equ 0 (
    for /f "tokens=*" %%i in ('python --version') do echo   [OK] Python installed: %%i
) else (
    echo   [MISSING] Python is NOT installed yet
    echo   Action: Run INSTALL_PYTHON_AND_ML.bat to set up
)
echo.

REM Check ML Service
echo Checking ML Service (Port 5000)...
netstat -ano | findstr ":5000" | findstr "LISTENING" >nul
if %errorlevel% equ 0 (
    echo   [OK] ML Service is RUNNING on http://localhost:5000
) else (
    echo   [PENDING] ML Service - Ready once Python setup complete
)
echo.

echo ════════════════════════════════════════════════════════════════════════
echo.
echo NEXT STEPS:
echo.
echo 1. OPEN APPLICATION:
echo    http://localhost:3000
echo.
echo 2. FOR ML SETUP:
echo    - Run: INSTALL_PYTHON_AND_ML.bat
echo    - Or see SETUP_COMPLETE.md for manual steps
echo.
echo DOCUMENTATION:
echo   - SETUP_COMPLETE.md ........... Complete setup & ML guide
echo   - INSTALL_PYTHON_AND_ML.bat .. ML installer script
echo   - STARTUP_SUMMARY.txt ........ Quick reference guide
echo.
echo ════════════════════════════════════════════════════════════════════════
echo.
pause

