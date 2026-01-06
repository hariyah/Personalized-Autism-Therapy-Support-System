@echo off
title DenseNet-121 Training - Watch Output Here
color 0A
echo ========================================
echo DenseNet-121 Emotion Recognition Training
echo ========================================
echo.
echo This window will show ALL training output
echo Training takes 30-60 minutes (GPU) or 2-4 hours (CPU)
echo.
echo You will see:
echo   - TensorFlow version
echo   - GPU/CPU detection  
echo   - Dataset loading
echo   - Model architecture
echo   - Real-time training progress (each epoch)
echo   - Validation accuracy improvements
echo   - Model saving confirmation
echo.
echo ========================================
echo.
pause
echo.
echo Starting training...
echo ========================================
echo.

cd /d "%~dp0"
REM Navigate to ml_service directory (one level up, then into ml_service)
cd ..\..
cd ml_service
python train_model.py

echo.
echo ========================================
echo Training process finished
echo ========================================
pause

