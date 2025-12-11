import os, glob, json, argparse
from predict_emotion import EmotionPredictor
import numpy as np
try:
    from sklearn.metrics import confusion_matrix, classification_report
    _HAVE_SKLEARN = True
except Exception:
    _HAVE_SKLEARN = False

    def confusion_matrix(y_true, y_pred, labels):
        idx = {label: i for i, label in enumerate(labels)}
        cm = np.zeros((len(labels), len(labels)), dtype=int)
        for t, p in zip(y_true, y_pred):
            if t in idx and p in idx:
                cm[idx[t], idx[p]] += 1
        return cm

    def classification_report(y_true, y_pred, labels, zero_division=0, output_dict=False):
        idx = {label: i for i, label in enumerate(labels)}
        # counts
        tp = {l: 0 for l in labels}
        fp = {l: 0 for l in labels}
        fn = {l: 0 for l in labels}
        support = {l: 0 for l in labels}
        for t, p in zip(y_true, y_pred):
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
        n = len(y_true)
        correct = sum(1 for t, p in zip(y_true, y_pred) if t == p)
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


def gather_test_images(root):
    imgs = []
    labels = []
    for class_name in sorted(os.listdir(root)):
        class_dir = os.path.join(root, class_name)
        if not os.path.isdir(class_dir):
            continue
        for f in sorted(os.listdir(class_dir)):
            if f.lower().endswith(('.jpg', '.jpeg', '.png')):
                imgs.append(os.path.join(class_dir, f))
                labels.append(class_name)
    return imgs, labels


def find_default_test_root():
    """Try to locate a reasonable test set root if not provided."""
    base = os.path.dirname(__file__)
    # Original hardcoded path
    candidate = os.path.join(base, 'dataset',
                             'Autism emotion recogition dataset',
                             'Autism emotion recogition dataset',
                             'test')
    if os.path.exists(candidate):
        return candidate
    # Fallback: search for any 'test' folder under dataset/**
    dataset_root = os.path.join(base, 'dataset')
    if os.path.isdir(dataset_root):
        for root, dirs, files in os.walk(dataset_root):
            if os.path.basename(root).lower() == 'test':
                # ensure it contains class subfolders
                subdirs = [d for d in os.listdir(root) if os.path.isdir(os.path.join(root, d))]
                if subdirs:
                    return root
    return None


if __name__ == '__main__':
    parser = argparse.ArgumentParser(description='Evaluate a trained model on the test set')
    parser.add_argument('--model_path', type=str, default=None, help='Path to model file (.keras or .h5)')
    parser.add_argument('--output', type=str, default='eval_testset_results.json', help='Output JSON file path')
    parser.add_argument('--test_root', type=str, default=None, help='Path to the test dataset root')
    args = parser.parse_args()

    # Resolve test root
    test_root = args.test_root or find_default_test_root()
    if not test_root or not os.path.exists(test_root):
        print('Test root not found:', test_root)
        raise SystemExit(1)

    imgs, true = gather_test_images(test_root)
    print(f'Found {len(imgs)} test images across {len(set(true))} classes')
    # Build predictor; pass explicit model if provided
    if args.model_path:
        p = EmotionPredictor(model_path=args.model_path)
        model_used = args.model_path
    else:
        p = EmotionPredictor()
        model_used = p.model_path if hasattr(p, 'model_path') else 'default'

    preds = []
    for i, img in enumerate(imgs):
        try:
            r = p.predict(img, return_confidence=True)
            preds.append(r['raw_prediction'])
        except Exception as e:
            print('Error on', img, e)
            preds.append('ERROR')
        if (i+1) % 50 == 0:
            print(f'Processed {i+1}/{len(imgs)}')

    labels = sorted(list(set(true)))
    report = classification_report(true, preds, labels=labels, zero_division=0, output_dict=True)
    print('\nClassification report:')
    # Also print pretty string for console
    if _HAVE_SKLEARN:
        print(classification_report(true, preds, labels=labels, zero_division=0))
    else:
        print(report)
    cm = confusion_matrix(true, preds, labels=labels)
    print('\nLabels order:', labels)
    print('Confusion matrix:')
    print(cm)

    accuracy = report.get('accuracy')

    # Save results
    out = {
        'model_path': model_used,
        'test_root': test_root,
        'test_images': len(imgs),
        'labels': labels,
        'accuracy': accuracy,
        'classification_report': report,
        'confusion_matrix': cm.tolist()
    }
    with open(args.output, 'w') as f:
        json.dump(out, f, indent=2)
    print(f"\nSaved results to {args.output}")
