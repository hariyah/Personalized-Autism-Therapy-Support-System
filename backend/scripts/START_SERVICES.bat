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
echo     1. gateway                     (Express, port 7777)
echo     2. autism-profile-builder      (Flask, port 7001)
echo     3. cognitive-activity-recommender (FastAPI, port 7002)
echo     4. emotional-activity-recommender (Node, port 7003)
echo     5. emotional-activity-recommender-ml (FastAPI, port 7004)
echo     6. therapy-collab             (Node, port 7005)
echo     7. therapy-collab-ai          (Python, port 7006)
echo.

REM 1. Gateway (Express, port 7777)
if exist "%GATEWAY%" (
  echo   Installing/updating npm dependencies in gateway...
  cd /d "%GATEWAY%"
  call npm install
  cd /d "%SCRIPT_DIR%"
  echo Starting gateway...
  start "gateway (7777)" cmd /k "cd /d "%GATEWAY%" && set PORT=7777 && npm start"
  timeout /t 3 /nobreak >nul
)

REM 2. Autism Profile Builder (Flask, port 7001)
if exist "%SERVICES%\autism-profile-builder" (
  if not exist "%SERVICES%\autism-profile-builder\.venv\Scripts\python.exe" (
    echo   Creating venv in autism-profile-builder...
    cd /d "%SERVICES%\autism-profile-builder"
    python -m venv .venv
    cd /d "%SCRIPT_DIR%"
  )
  echo   Installing/updating Python requirements in autism-profile-builder...
  if exist "%SERVICES%\autism-profile-builder\.venv\Scripts\pip.exe" (
    "%SERVICES%\autism-profile-builder\.venv\Scripts\pip.exe" install -r "%SERVICES%\autism-profile-builder\requirements.txt"
  ) else (
    cd /d "%SERVICES%\autism-profile-builder"
    pip install -r requirements.txt
    cd /d "%SCRIPT_DIR%"
  )
  if errorlevel 1 echo   WARNING: pip install failed for autism-profile-builder
  echo Starting autism-profile-builder...
  if exist "%SERVICES%\autism-profile-builder\.venv\Scripts\python.exe" (
    start "autism-profile-builder (7001)" cmd /k "cd /d "%SERVICES%\autism-profile-builder" && set FLASK_APP=app.py && set FLASK_RUN_PORT=7001 && "%SERVICES%\autism-profile-builder\.venv\Scripts\python.exe" app.py"
  ) else (
    start "autism-profile-builder (7001)" cmd /k "cd /d "%SERVICES%\autism-profile-builder" && set FLASK_APP=app.py && set FLASK_RUN_PORT=7001 && python app.py"
  )
  timeout /t 3 /nobreak >nul
)

REM 3. Cognitive Activity Recommender (FastAPI, port 7002)
if exist "%SERVICES%\cognitive-activity-recommender" (
  if not exist "%SERVICES%\cognitive-activity-recommender\.venv\Scripts\python.exe" (
    echo   Creating venv in cognitive-activity-recommender...
    cd /d "%SERVICES%\cognitive-activity-recommender"
    python -m venv .venv
    cd /d "%SCRIPT_DIR%"
  )
  echo   Installing/updating Python requirements in cognitive-activity-recommender...
  if exist "%SERVICES%\cognitive-activity-recommender\.venv\Scripts\pip.exe" (
    "%SERVICES%\cognitive-activity-recommender\.venv\Scripts\pip.exe" install -r "%SERVICES%\cognitive-activity-recommender\requirements.txt"
  ) else (
    cd /d "%SERVICES%\cognitive-activity-recommender"
    pip install -r requirements.txt
    cd /d "%SCRIPT_DIR%"
  )
  if errorlevel 1 echo   WARNING: pip install failed for cognitive-activity-recommender
  echo Starting cognitive-activity-recommender...
  if exist "%SERVICES%\cognitive-activity-recommender\.venv\Scripts\python.exe" (
    start "cognitive-activity-recommender (7002)" cmd /k "cd /d "%SERVICES%\cognitive-activity-recommender" && "%SERVICES%\cognitive-activity-recommender\.venv\Scripts\python.exe" -m uvicorn app.main:app --host 0.0.0.0 --port 7002"
  ) else (
    start "cognitive-activity-recommender (7002)" cmd /k "cd /d "%SERVICES%\cognitive-activity-recommender" && python -m uvicorn app.main:app --host 0.0.0.0 --port 7002"
  )
  timeout /t 3 /nobreak >nul
)

REM 4. Emotional Activity Recommender (Node, port 7003)
if exist "%SERVICES%\emotional-activity-recommender" (
  echo   Installing/updating npm dependencies in emotional-activity-recommender...
  cd /d "%SERVICES%\emotional-activity-recommender"
  call npm install
  cd /d "%SCRIPT_DIR%"
  echo Starting emotional-activity-recommender...
  start "emotional-activity-recommender (7003)" cmd /k "cd /d "%SERVICES%\emotional-activity-recommender" && set PORT=7003 && npm start"
  timeout /t 3 /nobreak >nul
)

REM 5. Emotional Activity Recommender ML (FastAPI, port 7004) - use short-path venv so TensorFlow installs on Windows
set "EMOTION_ML_VENV=C:\emotion_ml_venv"
if exist "%SERVICES%\emotional-activity-recommender-ml" (
  if not exist "%EMOTION_ML_VENV%\Scripts\python.exe" (
    echo   Creating short-path venv for emotional-activity-recommender-ml at %EMOTION_ML_VENV%...
    if not exist "%EMOTION_ML_VENV%" mkdir "%EMOTION_ML_VENV%"
    python -m venv "%EMOTION_ML_VENV%"
  )
  echo   Installing/updating Python requirements in emotional-activity-recommender-ml (TensorFlow + app)...
  "%EMOTION_ML_VENV%\Scripts\pip.exe" install -r "%SERVICES%\emotional-activity-recommender-ml\requirements.txt"
  if errorlevel 1 echo   WARNING: pip install had issues for emotional-activity-recommender-ml
  echo Starting emotional-activity-recommender-ml...
  start "emotional-activity-recommender-ml (7004)" cmd /k "cd /d "%SERVICES%\emotional-activity-recommender-ml" && "%EMOTION_ML_VENV%\Scripts\python.exe" app.py"
  timeout /t 3 /nobreak >nul
)

REM 6. Therapy Collab (Node, port 7005)
if exist "%SERVICES%\therapy-collab" (
  echo   Installing/updating npm dependencies in therapy-collab...
  cd /d "%SERVICES%\therapy-collab"
  call npm install
  cd /d "%SCRIPT_DIR%"
  echo Starting therapy-collab...
  start "therapy-collab (7005)" cmd /k "cd /d "%SERVICES%\therapy-collab" && set PORT=7005 && set AI_URL=http://localhost:7006/analyze-voice && set AI_TEXT_URL=http://localhost:7006/analyze-text && npm start"
  timeout /t 3 /nobreak >nul
)

REM 7. Therapy Collab AI (Python, port 7006)
if exist "%SERVICES%\therapy-collab-ai" (
  if exist "%SERVICES%\therapy-collab-ai\requirements.txt" (
    if not exist "%SERVICES%\therapy-collab-ai\.venv\Scripts\python.exe" (
      echo   Creating venv in therapy-collab-ai...
      cd /d "%SERVICES%\therapy-collab-ai"
      python -m venv .venv
      cd /d "%SCRIPT_DIR%"
    )
    echo   Installing/updating Python requirements in therapy-collab-ai...
    if exist "%SERVICES%\therapy-collab-ai\.venv\Scripts\pip.exe" (
      "%SERVICES%\therapy-collab-ai\.venv\Scripts\pip.exe" install -r "%SERVICES%\therapy-collab-ai\requirements.txt"
      if errorlevel 1 (
        echo   WARNING: therapy-collab-ai full install failed ^(TensorFlow path length on Windows^). Trying minimal deps...
        "%SERVICES%\therapy-collab-ai\.venv\Scripts\pip.exe" install fastapi uvicorn python-multipart torch librosa "transformers<5" numpy pillow pydantic python-dotenv
      )
    ) else (
      cd /d "%SERVICES%\therapy-collab-ai"
      pip install -r requirements.txt
      if errorlevel 1 pip install fastapi uvicorn python-multipart torch librosa "transformers<5" numpy pillow pydantic python-dotenv
      cd /d "%SCRIPT_DIR%"
    )
  )
  echo Starting therapy-collab-ai...
  if exist "%SERVICES%\therapy-collab-ai\.venv\Scripts\python.exe" (
    start "therapy-collab-ai (7006)" cmd /k "cd /d "%SERVICES%\therapy-collab-ai" && set PORT=7006 && "%SERVICES%\therapy-collab-ai\.venv\Scripts\python.exe" main.py"
  ) else (
    start "therapy-collab-ai (7006)" cmd /k "cd /d "%SERVICES%\therapy-collab-ai" && set PORT=7006 && python main.py"
  )
)

echo.
echo ================================================
echo   All services are starting in separate windows.
echo   gateway:                   http://localhost:7777
echo   autism-profile-builder:    http://localhost:7001
echo   cognitive-activity-recommender: http://localhost:7002
echo   emotional-activity-recommender:  http://localhost:7003
echo   emotional-activity-recommender-ml: http://localhost:7004
echo   therapy-collab:            http://localhost:7005
echo   therapy-collab-ai:         http://localhost:7006
echo ================================================
echo.

timeout /t 5 /nobreak
