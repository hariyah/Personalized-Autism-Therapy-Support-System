@echo off
echo ========================================
echo Starting DenseNet-121 Model Training
echo ========================================
echo.
echo This will take 30-60 minutes (GPU) or 2-4 hours (CPU)
echo.
echo Make sure:
echo 1. Dataset is downloaded to 'dataset' folder
echo 2. Python dependencies are installed
echo.
pause
echo.
echo Starting training...
python train_model.py
pause

