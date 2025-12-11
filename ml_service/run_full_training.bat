@echo off
REM Run full training pipeline (recommended to run on GPU-enabled machine)
SETLOCAL ENABLEDELAYEDEXPANSION
set EPOCHS=30
set BATCH_SIZE=16
set OUT=models\densenet121_emotion_model_full.keras




pauseENDLOCALpython -u train_full.py --epochs %EPOCHS% --batch-size %BATCH_SIZE% --output %OUT% > full_training.log 2>&1
necho Training finished. Logs: full_training.log
necho Model saved to %OUT% (if training succeeded)necho Running full training: %EPOCHS% epochs, batch=%BATCH_SIZE%