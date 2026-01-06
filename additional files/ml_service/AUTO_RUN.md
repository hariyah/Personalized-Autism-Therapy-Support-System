Running conservative fine-tune + evaluation

This directory contains helper scripts to run a short conservative fine-tune and then evaluate on the test set. Use these from the `ml_service` folder.

Windows (cmd.exe)

1. Open `cmd.exe` at project root and run:

   cd ml_service
   run_conservative_and_eval.bat

This will:
- set `FINETUNE_EPOCHS=5`
- run `quick_finetune_conservative.py` and write logs to `conservative_run.log`
- run `eval_testset.py` and write logs to `eval_run.log`
- save the trained model to `models/densenet121_emotion_model_conservative.keras` (if training succeeded)
- write evaluation results to `eval_testset_results.json`

PowerShell

1. Open PowerShell at project root and run:

   cd ml_service
   .\run_conservative_and_eval.ps1

Notes & troubleshooting
- If Python is not found, run `python --version` or use the `py` launcher (e.g. `py -3.11`).
- If you run into out-of-memory errors, reduce `BATCH_SIZE` in `quick_finetune_conservative.py` to 8 or 4.
- If results still collapse to a single class, run `debug_generators.py` and attach `debug_output/debug_report.json` when asking for help.

If you'd like, I can attempt to run these here once more, but previous runs in this environment did not produce logs or model artifacts. It's best to run them locally for reliable output capture.
