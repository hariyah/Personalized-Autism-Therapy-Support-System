@echo off
echo Starting ML Service...
echo.
REM Navigate to actual ml_service directory
cd /d "%~dp0"
cd ..\..
cd ml_service
python app.py
pause

