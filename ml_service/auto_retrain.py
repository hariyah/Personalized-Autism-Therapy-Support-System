"""Automated retraining orchestrator.

Steps:
  1. Imports and runs train_model.train_model() baseline training.
  2. Copies best saved model to timestamped filename (both .h5 and .keras if exist).
  3. Updates BEST_MODEL_PATH.txt to point to the .keras timestamped file (preferred).

Usage:
  cd ml_service
  python auto_retrain.py

Optional args:
  --use-full   Use train_full.py instead of train_model.py
  --epochs N   Override epochs for baseline train_model

Dataset must already be present under dataset/.
"""

import os
import shutil
import argparse
import datetime

STAMP_FMT = "%Y%m%d_%H%M%S"

def parse_args():
    p = argparse.ArgumentParser()
    p.add_argument('--use-full', action='store_true', help='Use train_full.py pipeline')
    p.add_argument('--epochs', type=int, default=None, help='Override epochs for baseline script')
    return p.parse_args()


def run_baseline(epochs_override=None):
    import train_model
    if epochs_override is not None:
        train_model.CONFIG['epochs'] = epochs_override
    model, history = train_model.train_model()
    return model, train_model.CONFIG


def run_full():
    import subprocess, sys
    cmd = [sys.executable, 'train_full.py', '--epochs', '30', '--batch-size', '16', '--output', 'models/densenet121_emotion_model_full.keras']
    print('[INFO] Launching full pipeline:', ' '.join(cmd))
    subprocess.check_call(cmd)
    return 'models/densenet121_emotion_model_full.keras'


def main():
    args = parse_args()

    if not os.path.isdir('dataset'):
        raise SystemExit('Dataset not found. Please place dataset under ml_service/dataset before retraining.')

    os.makedirs('models', exist_ok=True)
    timestamp = datetime.datetime.now().strftime(STAMP_FMT)

    if args.use_full:
        target_model = run_full()
        base_path = target_model
    else:
        model, cfg = run_baseline(args.epochs)
        base_path = cfg['keras_model_save_path'] if os.path.exists(cfg['keras_model_save_path']) else cfg['model_save_path']

    if not os.path.exists(base_path):
        raise SystemExit(f'Expected model file missing: {base_path}')

    # Prepare timestamped copies
    root, ext = os.path.splitext(base_path)
    ts_path = f'{root}_{timestamp}{ext}'
    shutil.copy2(base_path, ts_path)
    print(f'[OK] Timestamped copy saved: {ts_path}')

    # Mirror .h5/.keras sibling if available
    if ext == '.keras':
        h5_sibling = base_path.replace('.keras', '.h5')
        if os.path.exists(h5_sibling):
            ts_h5 = h5_sibling.replace('.h5', f'_{timestamp}.h5')
            shutil.copy2(h5_sibling, ts_h5)
            print(f'[OK] Timestamped H5 copy saved: {ts_h5}')
    elif ext == '.h5':
        keras_sibling = base_path.replace('.h5', '.keras')
        if os.path.exists(keras_sibling):
            ts_keras = keras_sibling.replace('.keras', f'_{timestamp}.keras')
            shutil.copy2(keras_sibling, ts_keras)
            print(f'[OK] Timestamped Keras copy saved: {ts_keras}')
            ts_path = ts_keras  # prefer keras format

    # Update BEST_MODEL_PATH.txt
    abs_best = os.path.abspath(ts_path)
    with open('BEST_MODEL_PATH.txt','w') as f:
        f.write(abs_best)
    print(f'[OK] BEST_MODEL_PATH.txt updated -> {abs_best}')

    print('[DONE] Retraining process complete.')

if __name__ == '__main__':
    main()
