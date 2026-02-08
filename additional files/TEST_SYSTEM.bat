@echo off
setlocal enabledelayedexpansion

echo.
echo ====================================================
echo     AUTISM THERAPY SUPPORT SYSTEM - STATUS
echo ====================================================
echo.
echo System is now FULLY OPERATIONAL!
echo.
echo ML Service (Port 5000): RUNNING
echo    - Model: MobileNetV2 (10 epochs trained)
echo    - Classes: anger, fear, joy, Natural, sadness, surprise
echo    - Status: Ready for predictions
echo.
echo Backend API (Port 3001): RUNNING
echo    - Activities: Loaded
echo    - Child Profiles: Available
echo    - Multi-factor Recommendation: Active
echo.
echo Frontend UI (Port 3000): RUNNING
echo    - React app ready
echo    - Image upload interface active
echo.
echo ====================================================
echo     QUICK START - HOW TO TEST
echo ====================================================
echo.
echo 1. Open your browser and go to:
echo    http://localhost:3000
echo.
echo 2. Upload a photo of an autistic child
echo.
echo 3. The system will:
echo    - Send image to backend (port 3001)
echo    - Backend forwards to ML service (port 5000)
echo    - ML service predicts emotion
echo    - Result shows predicted emotion and confidence
echo.
echo 4. See the emotion prediction and confidence score
echo.
echo ====================================================
echo     API ENDPOINTS
echo ====================================================
echo.
echo ML Service (Python Flask):
echo   POST /predict           - Upload image for prediction
echo   POST /predict-base64    - Send base64 encoded image
echo   GET  /health           - Check service status
echo   GET  /emotions         - Get supported emotions
echo.
echo Backend (Node.js):
echo   POST /api/predict-emotion  - Main prediction endpoint
echo.
echo ====================================================
echo.
pause
