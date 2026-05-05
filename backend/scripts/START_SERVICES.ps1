# Run all backend services (backend/services/*)
# Script lives at backend/scripts/ -> repo root is ../..
# Usage: .\START_SERVICES.ps1

$ErrorActionPreference = "Stop"
$ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$RepoRoot = (Resolve-Path (Join-Path $ScriptDir "..\..")).Path
$Services = Join-Path $RepoRoot "backend\services"
$Gateway = Join-Path $RepoRoot "backend\gateway"

Write-Host ""
Write-Host "================================================"
Write-Host "  BACKEND SERVICES STARTUP"
Write-Host "================================================"
Write-Host "  Repo root: $RepoRoot"
Write-Host "  Services:  $Services"
Write-Host ""
Write-Host "  Starting:"
Write-Host "    1. gateway                     (Express, port 7000)"
Write-Host "    2. autism-profile-builder      (Flask, port 7001)"
Write-Host "    3. cognitive-activity-recommender (FastAPI, port 7002)"
Write-Host "    4. emotional-activity-recommender (Node, port 7003)"
Write-Host "    5. emotional-activity-recommender-ml (FastAPI, port 7004)"
Write-Host "    6. therapy-collab              (Node, port 7005)"
Write-Host "    7. therapy-collab-ai           (Python, port 7006)"
Write-Host ""

# Create Python venv if needed, then install/update requirements (uses venv's pip so deps go into venv)
function Setup-PythonVenv {
    param([string]$Dir)
    if (-not (Test-Path $Dir) -or -not (Test-Path (Join-Path $Dir "requirements.txt"))) { return }
    $venvPy = Join-Path $Dir ".venv\Scripts\python.exe"
    $venvPip = Join-Path $Dir ".venv\Scripts\pip.exe"
    if (-not (Test-Path $venvPy)) {
        Write-Host "  Creating venv in $(Split-Path $Dir -Leaf)..."
        Push-Location $Dir
        python -m venv .venv
        Pop-Location
    }
    Write-Host "  Installing/updating Python requirements in $(Split-Path $Dir -Leaf)..."
    $reqTxt = Join-Path $Dir "requirements.txt"
    if (Test-Path $venvPip) {
        & $venvPip install -r $reqTxt
        if ($LASTEXITCODE -ne 0) { Write-Warning "  pip install failed for $(Split-Path $Dir -Leaf)" }
    } else {
        Push-Location $Dir
        pip install -r requirements.txt
        Pop-Location
    }
}

# npm install then run (Node): install/update deps before start
function Setup-NodeDeps {
    param([string]$Dir)
    if (-not (Test-Path $Dir) -or -not (Test-Path (Join-Path $Dir "package.json"))) { return }
    Write-Host "  Installing/updating npm dependencies in $(Split-Path $Dir -Leaf)..."
    Push-Location $Dir
    npm install
    Pop-Location
}

# 1. Gateway (Express, port 7000)
if (Test-Path $Gateway) {
    Setup-NodeDeps $Gateway
    Write-Host "Starting gateway..."
    Start-Process -FilePath "cmd.exe" -ArgumentList "/k", "cd /d `"$Gateway`" && set PORT=7000 && npm start"
    Start-Sleep -Seconds 2
}

# 2. Autism Profile Builder (Flask, port 7001)
$profileBuilder = Join-Path $Services "autism-profile-builder"
if (Test-Path $profileBuilder) {
    Setup-PythonVenv $profileBuilder
    Write-Host "Starting autism-profile-builder..."
    $pyExe = Join-Path $profileBuilder ".venv\Scripts\python.exe"
    $pyCmd = if (Test-Path $pyExe) { "`"$pyExe`" app.py" } else { "python app.py" }
    Start-Process -FilePath "cmd.exe" -ArgumentList "/k", "cd /d `"$profileBuilder`" && set FLASK_APP=app.py && set FLASK_RUN_PORT=7001 && $pyCmd"
    Start-Sleep -Seconds 2
}

# 3. Cognitive Activity Recommender (FastAPI, port 7002)
$cognitive = Join-Path $Services "cognitive-activity-recommender"
if (Test-Path $cognitive) {
    Setup-PythonVenv $cognitive
    Write-Host "Starting cognitive-activity-recommender..."
    $pyExe = Join-Path $cognitive ".venv\Scripts\python.exe"
    $uvicorn = if (Test-Path $pyExe) { "`"$pyExe`" -m uvicorn app.main:app --host 0.0.0.0 --port 7002" } else { "python -m uvicorn app.main:app --host 0.0.0.0 --port 7002" }
    Start-Process -FilePath "cmd.exe" -ArgumentList "/k", "cd /d `"$cognitive`" && $uvicorn"
    Start-Sleep -Seconds 2
}

# 4. Emotional Activity Recommender (Node, port 7003)
$emotional = Join-Path $Services "emotional-activity-recommender"
if (Test-Path $emotional) {
    Setup-NodeDeps $emotional
    Write-Host "Starting emotional-activity-recommender..."
    Start-Process -FilePath "cmd.exe" -ArgumentList "/k", "cd /d `"$emotional`" && set PORT=7003 && npm start"
    Start-Sleep -Seconds 2
}

# 5. Emotional Activity Recommender ML (FastAPI, port 7004) - needs TensorFlow; use short-path venv on Windows to avoid path-length install failure
$emotionalMl = Join-Path $Services "emotional-activity-recommender-ml"
if (Test-Path $emotionalMl) {
    $emotionalMlVenv = "C:\emotion_ml_venv"
    $emotionalMlVenvPy = Join-Path $emotionalMlVenv "Scripts\python.exe"
    $emotionalMlVenvPip = Join-Path $emotionalMlVenv "Scripts\pip.exe"
    if (-not (Test-Path $emotionalMlVenvPy)) {
        Write-Host "  Creating short-path venv for emotional-activity-recommender-ml at $emotionalMlVenv (needed for TensorFlow on Windows)..."
        if (-not (Test-Path $emotionalMlVenv)) { New-Item -ItemType Directory -Path $emotionalMlVenv -Force | Out-Null }
        python -m venv $emotionalMlVenv
    }
    Write-Host "  Installing/updating Python requirements in emotional-activity-recommender-ml (TensorFlow + app)..."
    $reqTxt = Join-Path $emotionalMl "requirements.txt"
    $pipArgs = "install", "-r", $reqTxt
    $process = Start-Process -FilePath $emotionalMlVenvPip -ArgumentList $pipArgs -WorkingDirectory $emotionalMl -NoNewWindow -Wait -PassThru -RedirectStandardError "$env:TEMP\emotion_ml_pip_err.txt" -RedirectStandardOutput "$env:TEMP\emotion_ml_pip_out.txt"
    if ($process.ExitCode -ne 0) { Write-Warning "  emotional-activity-recommender-ml: pip install had issues (exit $($process.ExitCode)); camera prediction may fail." }
    Write-Host "Starting emotional-activity-recommender-ml..."
    Start-Process -FilePath "cmd.exe" -ArgumentList "/k", "cd /d `"$emotionalMl`" && `"$emotionalMlVenvPy`" app.py"
    Start-Sleep -Seconds 2
}

# 6. Therapy Collab (Node, port 7005)
$therapyCollab = Join-Path $Services "therapy-collab"
if (Test-Path $therapyCollab) {
    Setup-NodeDeps $therapyCollab
    Write-Host "Starting therapy-collab..."
    Start-Process -FilePath "cmd.exe" -ArgumentList "/k", "cd /d `"$therapyCollab`" && set PORT=7005 && set AI_URL=http://127.0.0.1:7006/analyze-voice && set AI_TEXT_URL=http://127.0.0.1:7006/analyze-text && npm start"
    Start-Sleep -Seconds 2
}

# 7. Therapy Collab AI (Python, port 7006)
# Note: Full pip install can fail on Windows (TensorFlow path length). We try full install, then minimal if needed.
$therapyCollabAi = Join-Path $Services "therapy-collab-ai"
if (Test-Path $therapyCollabAi) {
    if (Test-Path (Join-Path $therapyCollabAi "requirements.txt")) {
        $venvPy = Join-Path $therapyCollabAi ".venv\Scripts\python.exe"
        if (-not (Test-Path $venvPy)) {
            Write-Host "  Creating venv in therapy-collab-ai..."
            Push-Location $therapyCollabAi
            python -m venv .venv
            Pop-Location
        }
        $venvPip = Join-Path $therapyCollabAi ".venv\Scripts\pip.exe"
        if (Test-Path $venvPip) {
            Write-Host "  Installing/updating Python requirements in therapy-collab-ai..."
            $reqTxt = Join-Path $therapyCollabAi "requirements.txt"
            $errPreference = $ErrorActionPreference
            $ErrorActionPreference = "Continue"
            & $venvPip install -r $reqTxt 2>&1 | Out-Null
            $pipOk = ($LASTEXITCODE -eq 0)
            $ErrorActionPreference = $errPreference
            if (-not $pipOk) {
                Write-Warning "  therapy-collab-ai: full install failed (TensorFlow path length on Windows). Trying minimal deps..."
                $ErrorActionPreference = "Continue"
                & $venvPip install fastapi uvicorn python-multipart torch librosa soundfile audioread soxr "transformers<5" numpy pillow pydantic python-dotenv pydub imageio-ffmpeg scikit-learn joblib 2>&1 | Out-Null
                $ErrorActionPreference = $errPreference
                if ($LASTEXITCODE -ne 0) { Write-Warning "  therapy-collab-ai: install had issues; start it manually if needed." }
            }
        }
    }
    Write-Host "Starting therapy-collab-ai..."
    $pyExe = Join-Path $therapyCollabAi ".venv\Scripts\python.exe"
    $pyCmd = if (Test-Path $pyExe) { "`"$pyExe`" main.py" } else { "python main.py" }
    Start-Process -FilePath "cmd.exe" -ArgumentList "/k", "cd /d `"$therapyCollabAi`" && set PORT=7006 && $pyCmd"
}

Write-Host ""
Write-Host "================================================"
Write-Host "  All services are starting in separate windows."
Write-Host "  gateway:                   http://localhost:7000"
Write-Host "  autism-profile-builder:    http://localhost:7001"
Write-Host "  cognitive-activity-recommender: http://localhost:7002"
Write-Host "  emotional-activity-recommender:  http://localhost:7003"
Write-Host "  emotional-activity-recommender-ml: http://localhost:7004"
Write-Host "  therapy-collab:            http://localhost:7005"
Write-Host "  therapy-collab-ai:         http://localhost:7006"
Write-Host "================================================"
Write-Host ""
