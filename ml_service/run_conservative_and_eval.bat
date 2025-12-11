@echo off
REM Run conservative fine-tune (5 epochs) and evaluation, capturing logs
SETLOCAL ENABLEDELAYEDEXPANSION
set FINETUNE_EPOCHS=5
echo Running conservative fine-tune (%%FINETUNE_EPOCHS%% epochs)...
python -u quick_finetune_conservative.py > conservative_run.log 2>&1










pauseENDLOCALpython -u eval_testset.py > eval_run.log 2>&1
necho Evaluation finished. Logs: eval_run.log, eval_testset_results.jsonecho Running evaluation on test set...)    echo Warning: model file not found after training.) else (    echo Found model: models\densenet121_emotion_model_conservative.kerasif exist models\densenet121_emotion_model_conservative.keras (necho Training finished. Log: conservative_run.log