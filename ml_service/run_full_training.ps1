# PowerShell runner for full training (recommended on GPU)
$env:PYTHONUNBUFFERED = "1"
$epochs = 30
$batch = 16
$out = 'models\densenet121_emotion_model_full.keras'
Write-Host "Running full training: $epochs epochs, batch=$batch"
python -u .\train_full.py --epochs $epochs --batch-size $batch --output $out *> .\full_training.log 2>&1
Write-Host "Done. Logs: full_training.log" 
if (Test-Path $out) { Write-Host "Model saved to $out" } else { Write-Warning "Model file not found. Check full_training.log" }
