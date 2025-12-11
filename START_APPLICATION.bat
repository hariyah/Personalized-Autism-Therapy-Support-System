@echo off
title Starting Application Servers
color 0B
echo ========================================
echo Starting Personalized Autism Therapy Support System
echo ========================================
echo.
echo This will start:
echo   1. Backend Server (Port 3001)
echo   2. Frontend Server (Port 3000)
echo.
echo The application will open in your browser automatically
echo.
echo ========================================
echo.

cd /d "%~dp0"

echo Starting Backend Server...
start "Backend Server" cmd /k "cd backend && npm start"

timeout /t 3 /nobreak >nul

echo Starting Frontend Server...
start "Frontend Server" cmd /k "cd frontend && npm start"

echo.
echo ========================================
echo Servers are starting in separate windows
echo ========================================
echo.
echo Backend:  http://localhost:3001
echo Frontend: http://localhost:3000
echo.
echo The frontend will open automatically in your browser
echo.
echo To stop servers, close the command windows
echo.
pause

