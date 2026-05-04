@echo off
REM Run all backend services (backend\services\*)
REM Script lives at backend\scripts\ -> repo root is ..\..

set "SCRIPT_DIR=%~dp0"
set "REPO_ROOT=%SCRIPT_DIR%..\.."
set "SERVICES=%REPO_ROOT%\backend\services"
set "GATEWAY=%REPO_ROOT%\backend\gateway"

REM Short-path venvs to avoid Windows Long Path issues
set "PROFILE_VENV=C:\autism_profile_venv"
set "COGNITIVE_VENV=C:\autism_cognitive_venv"
set "EMOTION_ML_VENV=C:\emotion_ml_venv"
set "THERAPY_AI_VENV=C:\autism_therapy_ai_venv"

echo.
echo ================================================
echo   BACKEND SERVICES STARTUP
echo ================================================
echo   Repo root: "%REPO_ROOT%"
echo.
echo   Starting:
echo     1. gateway                     (Express, port 7000)
echo     2. autism-profile-builder      (Flask, port 7001)
echo     3. cognitive-activity-recommender (FastAPI, port 7002)
echo     4. emotional-activity-recommender (Node, port 7003)
echo     5. emotional-activity-recommender-ml (FastAPI, port 7004)
echo     6. therapy-collab             (Node, port 7005)
echo     7. therapy-collab-ai          (Python, port 7006)
echo.

REM 1. Gateway (Express, port 7000)
if exist "%GATEWAY%" (
  echo   Installing/updating npm dependencies in gateway...
  pushd "%GATEWAY%"
  call npm install
  popd
  echo Starting gateway...
  start "gateway (7000)" /D "%GATEWAY%" cmd /k "set PORT=7000 && npm start"
  timeout /t 3 /nobreak >nul
)

REM 2. Autism Profile Builder (Flask, port 7001)
if exist "%SERVICES%\autism-profile-builder" (
  if not exist "%PROFILE_VENV%\Scripts\python.exe" (
    echo   Creating short-path venv for profile-builder at %PROFILE_VENV%...
    if not exist "%PROFILE_VENV%" mkdir "%PROFILE_VENV%"
    python -m venv "%PROFILE_VENV%"
  )
  echo   Installing/updating Python requirements in autism-profile-builder...
  "%PROFILE_VENV%\Scripts\pip.exe" install -r "%SERVICES%\autism-profile-builder\requirements.txt"
  if errorlevel 1 echo   WARNING: pip install failed for autism-profile-builder
  echo Starting autism-profile-builder...
  start "autism-profile-builder (7001)" /D "%SERVICES%\autism-profile-builder" cmd /k "set FLASK_APP=app.py && set FLASK_RUN_PORT=7001 && "%PROFILE_VENV%\Scripts\python.exe" app.py"
  timeout /t 3 /nobreak >nul
)

REM 3. Cognitive Activity Recommender (FastAPI, port 7002)
if exist "%SERVICES%\cognitive-activity-recommender" (
  if not exist "%COGNITIVE_VENV%\Scripts\python.exe" (
    echo   Creating short-path venv for cognitive-recommender at %COGNITIVE_VENV%...
    if not exist "%COGNITIVE_VENV%" mkdir "%COGNITIVE_VENV%"
    python -m venv "%COGNITIVE_VENV%"
  )
  echo   Installing/updating Python requirements in cognitive-activity-recommender...
  "%COGNITIVE_VENV%\Scripts\pip.exe" install -r "%SERVICES%\cognitive-activity-recommender\requirements.txt"
  if errorlevel 1 echo   WARNING: pip install failed for cognitive-activity-recommender
  echo Starting cognitive-activity-recommender...
  start "cognitive-activity-recommender (7002)" /D "%SERVICES%\cognitive-activity-recommender" cmd /k ""%COGNITIVE_VENV%\Scripts\python.exe" -m uvicorn app.main:app --host 0.0.0.0 --port 7002"
  timeout /t 3 /nobreak >nul
)

REM 4. Emotional Activity Recommender (Node, port 7003)
if exist "%SERVICES%\emotional-activity-recommender" (
  echo   Installing/updating npm dependencies in emotional-activity-recommender...
  pushd "%SERVICES%\emotional-activity-recommender"
  call npm install
  popd
  echo Starting emotional-activity-recommender...
  start "emotional-activity-recommender (7003)" /D "%SERVICES%\emotional-activity-recommender" cmd /k "set PORT=7003 && npm start"
  timeout /t 3 /nobreak >nul
)

REM 5. Emotional Activity Recommender ML (FastAPI, port 7004)
if exist "%SERVICES%\emotional-activity-recommender-ml" (
  if not exist "%EMOTION_ML_VENV%\Scripts\python.exe" (
    echo   Creating short-path venv for emotional-ml at %EMOTION_ML_VENV%...
    if not exist "%EMOTION_ML_VENV%" mkdir "%EMOTION_ML_VENV%"
    python -m venv "%EMOTION_ML_VENV%"
  )
  echo   Installing/updating Python requirements in emotional-activity-recommender-ml...
  "%EMOTION_ML_VENV%\Scripts\pip.exe" install -r "%SERVICES%\emotional-activity-recommender-ml\requirements.txt"
  if errorlevel 1 echo   WARNING: pip install had issues for emotional-activity-recommender-ml
  echo Starting emotional-activity-recommender-ml...
  start "emotional-activity-recommender-ml (7004)" /D "%SERVICES%\emotional-activity-recommender-ml" cmd /k ""%EMOTION_ML_VENV%\Scripts\python.exe" app.py"
  timeout /t 3 /nobreak >nul
)

REM 6. Therapy Collab (Node, port 7005)
if exist "%SERVICES%\therapy-collab" (
  echo   Installing/updating npm dependencies in therapy-collab...
  pushd "%SERVICES%\therapy-collab"
  call npm install
  popd
  echo Starting therapy-collab...
  start "therapy-collab (7005)" /D "%SERVICES%\therapy-collab" cmd /k "set PORT=7005 && set AI_URL=http://localhost:7006/analyze-voice && set AI_TEXT_URL=http://localhost:7006/analyze-text && npm start"
  timeout /t 3 /nobreak >nul
)

REM 7. Therapy Collab AI (Python, port 7006)
if exist "%SERVICES%\therapy-collab-ai" (
  if not exist "%THERAPY_AI_VENV%\Scripts\python.exe" (
    echo   Creating short-path venv for therapy-collab-ai at %THERAPY_AI_VENV%...
    if not exist "%THERAPY_AI_VENV%" mkdir "%THERAPY_AI_VENV%"
    python -m venv "%THERAPY_AI_VENV%"
  )
  echo   Installing/updating Python requirements in therapy-collab-ai...
  "%THERAPY_AI_VENV%\Scripts\pip.exe" install -r "%SERVICES%\therapy-collab-ai\requirements.txt"
  if errorlevel 1 (
    echo   WARNING: therapy-collab-ai install had issues. Trying minimal deps...
    "%THERAPY_AI_VENV%\Scripts\pip.exe" install fastapi uvicorn python-multipart torch librosa "transformers<5" numpy pillow pydantic python-dotenv
  )
  echo Starting therapy-collab-ai...
  start "therapy-collab-ai (7006)" /D "%SERVICES%\therapy-collab-ai" cmd /k "set PORT=7006 && "%THERAPY_AI_VENV%\Scripts\python.exe" main.py"
)

echo.
echo ================================================
echo   All services are starting in separate windows.
echo   gateway:                   http://localhost:7000
echo   autism-profile-builder:    http://localhost:7001
echo   cognitive-activity-recommender: http://localhost:7002
echo   emotional-activity-recommender:  http://localhost:7003
echo   emotional-activity-recommender-ml: http://localhost:7004
echo   therapy-collab:            http://localhost:7005
echo   therapy-collab-ai:         http://localhost:7006
echo ================================================
echo.

timeout /t 5 /nobreak
