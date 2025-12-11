"""Evaluate trained emotion model on validation split and produce metrics.

Usage:
  cd ml_service
  python evaluate_dataset.py --data-dir dataset --model BEST (auto-detect) --img-size 224 224
Outputs:
  - models/confusion_matrix.png
  - models/classification_report.json
  - Console summary (accuracy, per-class precision/recall/F1)

This script uses the same class_indices.json used in inference. It performs a single pass
through the directory structure using ImageDataGenerator with rescale only.
"""

import os
import json
import argparse
import numpy as np
import tensorflow as tf
import matplotlib.pyplot as plt
from sklearn.metrics import confusion_matrix, classification_report
from tensorflow.keras.preprocessing.image import ImageDataGenerator

DEFAULT_CLASSES_FILE = 'models/class_indices.json'

DATASET_LABELS = ["Natural","anger","fear","joy","sadness","surprise"]

def resolve_model_path(arg):
    if arg and arg != 'BEST':
        return arg
    # BEST mode: env > BEST_MODEL_PATH.txt > latest models
    env_path = os.environ.get('ML_MODEL_PATH')
    if env_path and os.path.exists(env_path):
        return env_path
    best_txt = 'BEST_MODEL_PATH.txt'
    if os.path.exists(best_txt):
        with open(best_txt,'r') as f:
            p = f.read().strip()
        if p and os.path.exists(p):
            return p
    # fallback: newest densenet file in models
    cand = []
    if os.path.isdir('models'):
        for f in os.listdir('models'):
            if f.startswith('densenet121_emotion_model') and f.lower().endswith(('.keras','.h5')):
                cand.append(os.path.join('models',f))
    if not cand:
        raise FileNotFoundError('No model files found in models/. Train a model first.')
    cand.sort(key=lambda p: os.path.getmtime(p), reverse=True)
    return cand[0]

def load_class_indices(path=DEFAULT_CLASSES_FILE):
    if not os.path.exists(path):
        raise FileNotFoundError(f'class indices file missing: {path}')
    with open(path,'r') as f:
        data = json.load(f)
    # ensure index->label mapping
    return {int(k):v for k,v in data.items()}

def build_generators(data_dir, img_size, batch_size=32, subset_split=0.2):
    datagen = ImageDataGenerator(rescale=1./255, validation_split=subset_split)
    val_gen = datagen.flow_from_directory(
        data_dir,
        target_size=tuple(img_size),
        batch_size=batch_size,
        class_mode='categorical',
        subset='validation',
        shuffle=False
    )
    return val_gen

def plot_confusion(cm, labels, out_path):
    plt.figure(figsize=(8,6))
    plt.imshow(cm, interpolation='nearest', cmap=plt.cm.Blues)
    plt.title('Confusion Matrix')
    plt.colorbar()
    tick_marks = np.arange(len(labels))
    plt.xticks(tick_marks, labels, rotation=45, ha='right')
    plt.yticks(tick_marks, labels)
    fmt = 'd'
    thresh = cm.max() / 2.
    for i,j in np.ndindex(cm.shape):
        plt.text(j, i, format(cm[i,j], fmt),
                 ha='center', va='center',
                 color='white' if cm[i,j] > thresh else 'black')
    plt.ylabel('True label')
    plt.xlabel('Predicted label')
    plt.tight_layout()
    plt.savefig(out_path)
    print(f'[OK] Saved confusion matrix to {out_path}')

def main():
    parser = argparse.ArgumentParser()
    parser.add_argument('--data-dir', default='dataset')
    parser.add_argument('--model', default='BEST')
    parser.add_argument('--img-size', nargs=2, type=int, default=[224,224])
    parser.add_argument('--batch-size', type=int, default=32)
    args = parser.parse_args()

    model_path = resolve_model_path(args.model)
    print(f'[INFO] Using model: {model_path}')
    class_indices = load_class_indices()
    inv_map = class_indices  # index->label
    labels_sorted = [inv_map[i] for i in sorted(inv_map.keys())]

    if not os.path.isdir(args.data_dir):
        raise FileNotFoundError(f'Dataset directory not found: {args.data_dir}')

    val_gen = build_generators(args.data_dir, args.img_size, args.batch_size)

    # Load model
    model = tf.keras.models.load_model(model_path)
    preds = model.predict(val_gen, verbose=1)
    y_true = val_gen.classes
    y_pred = np.argmax(preds, axis=1)

    cm = confusion_matrix(y_true, y_pred)
    report = classification_report(y_true, y_pred, target_names=labels_sorted, output_dict=True)

    os.makedirs('models', exist_ok=True)
    plot_confusion(cm, labels_sorted, 'models/confusion_matrix.png')
    with open('models/classification_report.json','w') as f:
        json.dump(report, f, indent=2)
    print('[OK] Saved classification_report.json')

    print('\n=== Summary Metrics ===')
    print(f"Accuracy: {report['accuracy']:.4f}")
    for lbl in labels_sorted:
        r = report[lbl]
        print(f"{lbl:12s} P:{r['precision']:.3f} R:{r['recall']:.3f} F1:{r['f1-score']:.3f}")

if __name__ == '__main__':
    main()
