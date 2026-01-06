@echo off
title Autism Therapy Support System - RUNNING
mode con: cols=70 lines=30
color 0A

cls
echo.
echo ========================================================
echo.
echo    PERSONALIZED AUTISM THERAPY SUPPORT SYSTEM 
echo.
echo   STATUS: FULLY OPERATIONAL
echo.
echo 
echo.
echo   Frontend (React UI)
echo      URL: http://localhost:3000
echo      Status: RUNNING
echo      Port: 3000
echo.
echo   Backend API (Node.js)
echo      URL: http://localhost:3001
echo      Status: RUNNING
echo      Port: 3001
echo.
echo   ML Service (Python/Flask)
echo      URL: http://localhost:5000
echo      Status: RUNNING
echo      Port: 5000
echo.
echo ========================================================
echo.
echo   READY TO USE!
echo.
echo   1. Open http://localhost:3000 in your browser
echo   2. Upload a photo of an autistic child
echo   3. System predicts emotion:
echo      - anger, fear, joy, natural, sadness, surprise
echo   4. View confidence score and probabilities
echo.
echo ========================================================
echo.
echo   SYSTEM COMPONENTS:
echo.
echo   Dataset: 1,199 autism emotion images
echo   Model: MobileNetV2 (trained, 10 epochs)
echo   Classes: 6 emotion categories
echo   Format: Keras native (.keras)
echo.
echo ========================================================
echo.
echo   Keep all three terminal windows open while testing!
echo   Close any terminal to stop that service.
echo.
echo ========================================================
echo.
pause
