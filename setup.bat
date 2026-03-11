@echo off
echo ================================================
echo   PERSONALIZED AUTISM THERAPY SUPPORT SETUP
echo ================================================
echo.

echo [1/4] Installing gateway dependencies...
cd backend\gateway && npm install && cd ..\..

echo [2/4] Installing therapy-collab service dependencies...
cd backend\services\therapy-collab && npm install && cd ..\..\..

echo [3/4] Installing frontend dependencies...
cd frontend && npm install && cd ..

echo [4/4] Setting up therapy-collab AI service...
cd backend\services\therapy-collab-ai
if not exist .venv (
    echo Creating virtual environment...
    python -m venv .venv
)
.\.venv\Scripts\python.exe -m pip install -r requirements.txt
cd ..\..\..

echo.
echo ================================================
echo   SETUP COMPLETE
echo   To start the project, run: npm start
echo ================================================
pause
