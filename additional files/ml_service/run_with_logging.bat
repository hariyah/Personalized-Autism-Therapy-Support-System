@echo off
echo Starting training with output logging...
echo.
echo Output will be saved to: training_output.log
echo You can also see it in real-time in this window
echo.
echo Press Ctrl+C to stop
echo.
python train_model.py 2>&1 | tee training_output.log
pause

