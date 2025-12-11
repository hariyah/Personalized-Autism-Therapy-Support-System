# PowerShell runner: conservative fine-tune (5 epochs) and evaluation
$env:FINETUNE_EPOCHS = "5"
Write-Host "Running conservative fine-tune ($env:FINETUNE_EPOCHS epochs)..."
python -u .\quick_finetune_conservative.py *> .\conservative_run.log 2>&1
Write-Host "Training finished. Log: conservative_run.log"
if (Test-Path .\models\densenet121_emotion_model_conservative.keras) {
    Write-Host "Found model: models\densenet121_emotion_model_conservative.keras"
} else {
    Write-Warning "Model file not found after training. Check conservative_run.log"
}
Write-Host "Running evaluation on test set..."
python -u .\eval_testset.py *> .\eval_run.log 2>&1
Write-Host "Evaluation finished. Logs: eval_run.log, eval_testset_results.json"
Write-Host "Done."
