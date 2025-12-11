@echo off
echo ========================================
echo DenseNet-121 Emotion Recognition Training
echo ========================================
echo.
echo This will show all training output in real-time
echo Training takes 30-60 minutes (GPU) or 2-4 hours (CPU)
echo.
echo Press Ctrl+C to stop training
echo.
pause
echo.
echo Starting training...
echo.
python train_model.py
echo.
echo Training completed or stopped.
pause

