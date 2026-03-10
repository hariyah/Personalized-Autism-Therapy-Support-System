@echo off
REM Run all backend services (backend\services\*)
REM Script lives at backend\scripts\ -> repo root is ..\..

set "SCRIPT_DIR=%~dp0"
set "REPO_ROOT=%SCRIPT_DIR%..\.."
set "SERVICES=%REPO_ROOT%\backend\services"
set "GATEWAY=%REPO_ROOT%\backend\gateway"

echo.
echo ================================================
echo   BACKEND SERVICES STARTUP
echo ================================================
echo   Repo root: %REPO_ROOT%
echo   Services:  %SERVICES%
echo.
echo   Starting:
echo     1. autism-profile-builder       (Flask, port 5002)
echo     2. cognitive-activity-recommender (FastAPI, port 7002)
echo     3. emotional-activity-recommender  (Node, port 3001)
echo     4. emotional-activity-recommender-ml (FastAPI, port 5000)
echo     5. gateway                     (Express, port 7777)
echo.

REM 1. Autism Profile Builder (Flask)
if exist "%SERVICES%\autism-profile-builder" (
  if not exist "%SERVICES%\autism-profile-builder\.venv\Scripts\python.exe" (
    echo   Creating venv and installing dependencies in autism-profile-builder...
    cd /d "%SERVICES%\autism-profile-builder"
    python -m venv .venv
    call .venv\Scripts\pip.exe install -q -r requirements.txt
    cd /d "%SCRIPT_DIR%"
  )
  echo Starting autism-profile-builder...
  start "autism-profile-builder (5002)" cmd /k "cd /d "%SERVICES%\autism-profile-builder" && set FLASK_APP=app.py && set FLASK_RUN_PORT=5002 && (if exist .venv\Scripts\python.exe (.venv\Scripts\python.exe app.py) else (python app.py))"
  timeout /t 3 /nobreak >nul
)

REM 2. Cognitive Activity Recommender (FastAPI)
if exist "%SERVICES%\cognitive-activity-recommender" (
  if not exist "%SERVICES%\cognitive-activity-recommender\.venv\Scripts\python.exe" (
    echo   Creating venv and installing dependencies in cognitive-activity-recommender...
    cd /d "%SERVICES%\cognitive-activity-recommender"
    python -m venv .venv
    call .venv\Scripts\pip.exe install -q -r requirements.txt
    cd /d "%SCRIPT_DIR%"
  )
  echo Starting cognitive-activity-recommender...
  cd /d "%SERVICES%\cognitive-activity-recommender"
  if exist .venv\Scripts\python.exe (
    start "cognitive-activity-recommender (7002)" cmd /k .venv\Scripts\python.exe -m uvicorn app.main:app --host 0.0.0.0 --port 7002
  ) else (
    start "cognitive-activity-recommender (7002)" cmd /k python -m uvicorn app.main:app --host 0.0.0.0 --port 7002
  )
  cd /d "%SCRIPT_DIR%"
  timeout /t 3 /nobreak >nul
)

REM 3. Emotional Activity Recommender (Node)
if exist "%SERVICES%\emotional-activity-recommender" (
  if not exist "%SERVICES%\emotional-activity-recommender\node_modules" (
    echo   Installing npm dependencies in emotional-activity-recommender...
    cd /d "%SERVICES%\emotional-activity-recommender"
    call npm install
    cd /d "%SCRIPT_DIR%"
  )
  echo Starting emotional-activity-recommender...
  start "emotional-activity-recommender (3001)" cmd /k "cd /d "%SERVICES%\emotional-activity-recommender" && npm start"
  timeout /t 3 /nobreak >nul
)

REM 4. Emotional Activity Recommender ML (FastAPI)
if exist "%SERVICES%\emotional-activity-recommender-ml" (
  if not exist "%SERVICES%\emotional-activity-recommender-ml\.venv\Scripts\python.exe" (
    echo   Creating venv and installing dependencies in emotional-activity-recommender-ml...
    cd /d "%SERVICES%\emotional-activity-recommender-ml"
    python -m venv .venv
    call .venv\Scripts\pip.exe install -q -r requirements.txt
    cd /d "%SCRIPT_DIR%"
  )
  echo Starting emotional-activity-recommender-ml...
  cd /d "%SERVICES%\emotional-activity-recommender-ml"
  if exist .venv\Scripts\python.exe (
    start "emotional-activity-recommender-ml (5000)" cmd /k .venv\Scripts\python.exe app.py
  ) else (
    start "emotional-activity-recommender-ml (5000)" cmd /k python app.py
  )
  cd /d "%SCRIPT_DIR%"
)

REM 5. Gateway (Express, port 7777)
if exist "%GATEWAY%" (
  if not exist "%GATEWAY%\node_modules" (
    echo   Installing npm dependencies in gateway...
    cd /d "%GATEWAY%"
    call npm install
    cd /d "%SCRIPT_DIR%"
  )
  echo Starting gateway...
  start "gateway (7000)" cmd /k "cd /d "%GATEWAY%" && npm start"
)

echo.
echo ================================================
echo   All services are starting in separate windows.
echo   gateway:                   http://localhost:7777
echo   autism-profile-builder:    http://localhost:5002
echo   cognitive-activity-recommender: http://localhost:7002
echo   emotional-activity-recommender:  http://localhost:3001
echo   emotional-activity-recommender-ml: http://localhost:5000
echo ================================================
echo.

timeout /t 5 /nobreak
