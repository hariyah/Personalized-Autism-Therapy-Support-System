@echo off
title Installing Python and Setting Up ML Service
color 0B
echo ========================================
echo Python & ML Service Installation Script
echo ========================================
echo.
echo This script will:
echo   1. Check for Python installation
echo   2. Install Python from Microsoft Store if needed
echo   3. Install Python dependencies for ML service
echo   4. Download and prepare the dataset
echo   5. Train the emotion recognition model
echo.
echo ========================================
echo.

REM Check if Python is available
python --version >nul 2>&1
if %errorlevel% neq 0 (
    echo Python is NOT installed. Installing Python 3.11...
    echo.
    echo Opening Microsoft Store. Please:
    echo   1. Click "Get" to install Python 3.11
    echo   2. Wait for installation to complete
    echo   3. Run this script again
    echo.
    start ms-windows-store://pdp/?ProductId=9NBLGGH4NNS1
    timeout /t 5 /nobreak
    pause
    exit /b
) else (
    python --version
    echo Python is installed!
)

echo.
echo Installing Python dependencies...
cd /d "%~dp0ml_service"
pip install -r requirements.txt

if %errorlevel% neq 0 (
    echo Error installing dependencies
    pause
    exit /b 1
)

echo.
echo ========================================
echo Dependencies installed successfully!
echo ========================================
echo.
echo Next steps:
echo   1. Download the dataset from Kaggle:
echo      https://www.kaggle.com/datasets/fatmamtalaat/autistic-children-emotions-dr-fatma-m-talaat
echo   2. Extract to: ml_service\dataset\
echo   3. Run: python train_model.py
echo   4. Once training completes, run: python app.py
echo.
echo For detailed instructions, see: SETUP_GUIDE.md
echo.
pause
