@echo off
setlocal enabledelayedexpansion
title Autism Therapy - Starting All Services
color 0A
echo.
echo =========================================
echo  PERSONALIZED AUTISM THERAPY SYSTEM
echo  Starting All Services
echo =========================================
echo.

cd /d "%~dp0"

echo.
echo [STEP 1] Checking ML Model...
REM Model resolution logic
set MODEL_FOUND=0
if defined ML_MODEL_PATH (
    if exist "%ML_MODEL_PATH%" (
        echo   Found via ML_MODEL_PATH: %ML_MODEL_PATH%
        set MODEL_FOUND=1
    ) else (
        echo   ML_MODEL_PATH is set but file not found: %ML_MODEL_PATH%
    )
) else (
    if exist "ml_service\BEST_MODEL_PATH.txt" (
        for /f "usebackq delims=" %%B in ("ml_service\BEST_MODEL_PATH.txt") do set "ML_MODEL_PATH=%%B"
        if defined ML_MODEL_PATH if "!ML_MODEL_PATH:~0,3!"=="ï»¿" set "ML_MODEL_PATH=!ML_MODEL_PATH:~3!"
        rem Remove any embedded double quotes
        if defined ML_MODEL_PATH set "ML_MODEL_PATH=!ML_MODEL_PATH:\"=!"
        if exist "%ML_MODEL_PATH%" (
            echo   Using best model from BEST_MODEL_PATH.txt
            echo   %ML_MODEL_PATH%
            set MODEL_FOUND=1
        ) else (
            echo   BEST_MODEL_PATH.txt path invalid, trying fallbacks...
        )
    )
    if !MODEL_FOUND! neq 1 (
        for %%F in (densenet121_emotion_model_conservative.keras densenet121_emotion_model_oversample.keras densenet121_emotion_model.keras densenet121_emotion_model.h5) do (
            if !MODEL_FOUND! neq 1 if exist "ml_service\models\%%F" (
                set "ML_MODEL_PATH=%CD%\ml_service\models\%%F"
                echo   Using fallback model: %%F
                set MODEL_FOUND=1
            )
        )
    )
)
if !MODEL_FOUND! neq 1 echo   Model not found - skipping ML Service

echo.
if !MODEL_FOUND! equ 1 (
    echo [STEP 2] Starting ML Service on Port 5000...
    start "ML Service - Port 5000" "%CD%\ml_service\start_service_with_env.bat" "!ML_MODEL_PATH!"
    echo   Waiting for ML Service health (up to 15s)...
    set "_ML_HEALTH=0"
    for /l %%I in (1,1,15) do (
        curl -s http://localhost:5000/health | find "model_loaded" >nul && (
            set "_ML_HEALTH=1"
            goto :ml_health_done
        )
        timeout /t 1 >nul
    )
    :ml_health_done
    if "!_ML_HEALTH!"=="1" (
        echo   ML Service healthy.
    ) else (
        echo   ML Service health not confirmed; check logs if issues arise.
    )
) else (
    echo [STEP 2] Skipping ML Service (no trained model)
)

echo.
echo [STEP 3] Starting Backend on Port 3001...
start "Backend API - Port 3001" cmd /k "cd backend && npm start"
timeout /t 3 /nobreak >nul
echo   ✓ Backend launched

echo.
echo [STEP 4] Starting Frontend on Port 3000...
start "Frontend UI - Port 3000" cmd /k "cd frontend && npm start"
timeout /t 5 /nobreak >nul
echo   ✓ Frontend launched

echo.
echo [STEP 5] Opening Browser...
timeout /t 3 /nobreak >nul
start http://localhost:3000

echo.
echo =========================================
echo  ALL SERVICES STARTED SUCCESSFULLY!
echo =========================================
echo.
echo   Frontend:   http://localhost:3000
echo   Backend:    http://localhost:3001
echo   ML Service: http://localhost:5000
echo.
echo   Three terminal windows have opened.
echo   Keep all terminals open while using!
echo.
echo =========================================
echo.
echo Startup script complete.

