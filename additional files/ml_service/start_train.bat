@echo off
REM Start training with CPU only (clear CUDA_VISIBLE_DEVICES)
set CUDA_VISIBLE_DEVICES=
cd /d "%~dp0"
py -3.11 train_model.py
