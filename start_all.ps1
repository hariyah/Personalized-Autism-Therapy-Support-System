# Start MongoDB in a separate window
Write-Host "Starting MongoDB 8.0..." -ForegroundColor Cyan
Start-Process -FilePath "cmd.exe" -ArgumentList "/k", "cd /d `"$PSScriptRoot`" && `C:\Program Files\MongoDB\Server\8.0\bin\mongod.exe` --dbpath `"$PSScriptRoot\mongo-data`" --port 27017"

# Wait a couple of seconds for MongoDB to initialize
Start-Sleep -Seconds 3

# Seed users (ensures fresh test accounts are ready)
Write-Host "Seeding test users..." -ForegroundColor Cyan
python "$PSScriptRoot\backend\scripts\SEED_USERS.py"

# Start all backend microservices (Gateway + 6 services)
Write-Host "Starting Backend Microservices..." -ForegroundColor Cyan
Start-Process -FilePath "cmd.exe" -ArgumentList "/k", "cd /d `"$PSScriptRoot`" && node backend/scripts/run-services.js"

# Start the frontend dev server in a new window
Write-Host "Starting Frontend..." -ForegroundColor Cyan
Start-Process -FilePath "cmd.exe" -ArgumentList "/k", "cd /d `"$PSScriptRoot\frontend`" && npm run dev"

Write-Host ""
Write-Host "==============================================" -ForegroundColor Green
Write-Host "  All components are launching!" -ForegroundColor Green
Write-Host "  Wait a few seconds, then open: http://localhost:5173" -ForegroundColor Green
Write-Host "==============================================" -ForegroundColor Green
