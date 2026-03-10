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
Write-Host "    1. autism-profile-builder      (Flask, port 5002)"
Write-Host "    2. cognitive-activity-recommender (FastAPI, port 7002)"
Write-Host "    3. emotional-activity-recommender (Node, port 3001)"
Write-Host "    4. emotional-activity-recommender-ml (FastAPI, port 5000)"
Write-Host "    5. gateway                     (Express, port 7777)"
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

# 1. Autism Profile Builder (Flask)
$profileBuilder = Join-Path $Services "autism-profile-builder"
if (Test-Path $profileBuilder) {
    Setup-PythonVenv $profileBuilder
    Write-Host "Starting autism-profile-builder..."
    $pyExe = Join-Path $profileBuilder ".venv\Scripts\python.exe"
    $pyCmd = if (Test-Path $pyExe) { "`"$pyExe`" app.py" } else { "python app.py" }
    Start-Process -FilePath "cmd.exe" -ArgumentList "/k", "cd /d `"$profileBuilder`" && set FLASK_APP=app.py && set FLASK_RUN_PORT=5002 && $pyCmd"
    Start-Sleep -Seconds 2
}

# 2. Cognitive Activity Recommender (FastAPI)
$cognitive = Join-Path $Services "cognitive-activity-recommender"
if (Test-Path $cognitive) {
    Setup-PythonVenv $cognitive
    Write-Host "Starting cognitive-activity-recommender..."
    $pyExe = Join-Path $cognitive ".venv\Scripts\python.exe"
    $uvicorn = if (Test-Path $pyExe) { "`"$pyExe`" -m uvicorn app.main:app --host 0.0.0.0 --port 7002" } else { "python -m uvicorn app.main:app --host 0.0.0.0 --port 7002" }
    Start-Process -FilePath "cmd.exe" -ArgumentList "/k", "cd /d `"$cognitive`" && $uvicorn"
    Start-Sleep -Seconds 2
}

# 3. Emotional Activity Recommender (Node)
$emotional = Join-Path $Services "emotional-activity-recommender"
if (Test-Path $emotional) {
    Setup-NodeDeps $emotional
    Write-Host "Starting emotional-activity-recommender..."
    Start-Process -FilePath "cmd.exe" -ArgumentList "/k", "cd /d `"$emotional`" && npm start"
    Start-Sleep -Seconds 2
}

# 4. Emotional Activity Recommender ML (FastAPI)
$emotionalMl = Join-Path $Services "emotional-activity-recommender-ml"
if (Test-Path $emotionalMl) {
    Setup-PythonVenv $emotionalMl
    Write-Host "Starting emotional-activity-recommender-ml..."
    $pyExe = Join-Path $emotionalMl ".venv\Scripts\python.exe"
    $pyMl = if (Test-Path $pyExe) { "`"$pyExe`" app.py" } else { "python app.py" }
    Start-Process -FilePath "cmd.exe" -ArgumentList "/k", "cd /d `"$emotionalMl`" && $pyMl"
}

# 5. Gateway (Express, port 7777)
if (Test-Path $Gateway) {
    Setup-NodeDeps $Gateway
    Write-Host "Starting gateway..."
    Start-Process -FilePath "cmd.exe" -ArgumentList "/k", "cd /d `"$Gateway`" && npm start"
}

Write-Host ""
Write-Host "================================================"
Write-Host "  All services are starting in separate windows."
Write-Host "  gateway:                   http://localhost:7777"
Write-Host "  autism-profile-builder:    http://localhost:5002"
Write-Host "  cognitive-activity-recommender: http://localhost:7002"
Write-Host "  emotional-activity-recommender:  http://localhost:3001"
Write-Host "  emotional-activity-recommender-ml: http://localhost:5000"
Write-Host "================================================"
Write-Host ""
