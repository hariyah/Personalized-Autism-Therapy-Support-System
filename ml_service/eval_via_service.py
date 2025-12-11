import os
import argparse
import json
import time

import numpy as np
try:
    import requests
except Exception as e:
    print("Missing dependency: requests. Install with 'pip install requests'.")
    raise


def gather_test_images(root):
    imgs = []
    labels = []
    for class_name in sorted(os.listdir(root)):
        class_dir = os.path.join(root, class_name)
        if not os.path.isdir(class_dir):
            continue
        for f in sorted(os.listdir(class_dir)):
            if f.lower().endswith((".jpg", ".jpeg", ".png")):
                imgs.append(os.path.join(class_dir, f))
                labels.append(class_name)
    return imgs, labels


def confusion_matrix(labels_true, labels_pred, labels):
    idx = {label: i for i, label in enumerate(labels)}
    cm = np.zeros((len(labels), len(labels)), dtype=int)
    for t, p in zip(labels_true, labels_pred):
        if t in idx and p in idx:
            cm[idx[t], idx[p]] += 1
    return cm


def classification_report(labels_true, labels_pred, labels, zero_division=0, output_dict=True):
    idx = {label: i for i, label in enumerate(labels)}
    tp = {l: 0 for l in labels}
    fp = {l: 0 for l in labels}
    fn = {l: 0 for l in labels}
    support = {l: 0 for l in labels}
    for t, p in zip(labels_true, labels_pred):
        if t in idx:
            support[t] += 1
        if t == p and t in idx:
            tp[t] += 1
        else:
            if p in idx:
                fp[p] += 1
            if t in idx:
                fn[t] += 1

    def safe_div(a, b):
        if b == 0:
            return 0 if zero_division == 0 else zero_division
        return a / b

    out = {}
    n = len(labels_true)
    correct = sum(1 for t, p in zip(labels_true, labels_pred) if t == p)
    accuracy = correct / n if n else 0.0
    precisions, recalls, f1s, weights = [], [], [], []
    for l in labels:
        prec = safe_div(tp[l], (tp[l] + fp[l]))
        rec = safe_div(tp[l], (tp[l] + fn[l]))
        f1 = safe_div(2 * prec * rec, (prec + rec)) if (prec + rec) > 0 else 0.0
        out[l] = {
            'precision': float(prec),
            'recall': float(rec),
            'f1-score': float(f1),
            'support': float(support[l])
        }
        precisions.append(prec)
        recalls.append(rec)
        f1s.append(f1)
        weights.append(support[l])

    macro_avg = {
        'precision': float(np.mean(precisions) if precisions else 0.0),
        'recall': float(np.mean(recalls) if recalls else 0.0),
        'f1-score': float(np.mean(f1s) if f1s else 0.0),
        'support': float(sum(weights))
    }
    weighted_avg = {
        'precision': float(np.average(precisions, weights=weights) if sum(weights) else 0.0),
        'recall': float(np.average(recalls, weights=weights) if sum(weights) else 0.0),
        'f1-score': float(np.average(f1s, weights=weights) if sum(weights) else 0.0),
        'support': float(sum(weights))
    }
    out['accuracy'] = float(accuracy)
    out['macro avg'] = macro_avg
    out['weighted avg'] = weighted_avg
    return out if output_dict else str(out)


def main():
    ap = argparse.ArgumentParser("Evaluate model via running ML service")
    ap.add_argument('--service_url', default='http://localhost:5000', help='ML service base URL')
    ap.add_argument('--test_root', required=True, help='Path to test dataset root')
    ap.add_argument('--output', default='eval_conservative_results.json', help='Output JSON file')
    args = ap.parse_args()

    health_url = args.service_url.rstrip('/') + '/health'
    predict_url = args.service_url.rstrip('/') + '/predict'

    try:
        r = requests.get(health_url, timeout=5)
        r.raise_for_status()
    except Exception as e:
        print('ML service not reachable at', health_url, 'error:', e)
        raise SystemExit(1)

    imgs, y_true = gather_test_images(args.test_root)
    print(f'Found {len(imgs)} test images across {len(set(y_true))} classes', flush=True)

    y_pred = []
    for i, img_path in enumerate(imgs):
        try:
            with open(img_path, 'rb') as f:
                files = {'image': (os.path.basename(img_path), f, 'application/octet-stream')}
                r = requests.post(predict_url, files=files, timeout=20)
            if r.status_code != 200:
                y_pred.append('ERROR')
                continue
            data = r.json()
            pred = data.get('prediction') or data.get('raw_prediction') or data.get('label')
            if pred is None:
                y_pred.append('ERROR')
            else:
                y_pred.append(str(pred))
        except Exception as ex:
            y_pred.append('ERROR')
            print(f'Error processing {img_path}: {ex}', flush=True)

        if (i + 1) % 50 == 0:
            print(f'Processed {i+1}/{len(imgs)}', flush=True)

    labels = sorted(list(set(y_true)))
    report = classification_report(y_true, y_pred, labels=labels, output_dict=True)
    cm = confusion_matrix(y_true, y_pred, labels=labels)

    out = {
        'service_url': args.service_url,
        'test_root': args.test_root,
        'test_images': len(imgs),
        'labels': labels,
        'accuracy': report.get('accuracy'),
        'classification_report': report,
        'confusion_matrix': cm.tolist(),
        'evaluation_mode': 'via_service'
    }
    with open(args.output, 'w', encoding='utf-8') as f:
        json.dump(out, f, indent=2)
    print('Saved results to', args.output, flush=True)


if __name__ == '__main__':
    main()
