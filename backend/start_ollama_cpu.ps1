# PowerShell script to start Ollama in CPU mode
Write-Host "Starting Ollama in CPU mode..." -ForegroundColor Green
Write-Host "This will use RAM instead of GPU memory (slower but works on any system)" -ForegroundColor Yellow
Write-Host ""

$env:OLLAMA_NUM_GPU = "0"
ollama serve

