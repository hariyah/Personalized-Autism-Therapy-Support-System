import json
import os
import sys

# This script compares evaluation JSONs and prints the best model path.
# Priority metric: accuracy; fallback: macro_f1 if available.
# Inputs are fixed filenames produced by run_all_automated.bat.

ROOT = os.path.dirname(__file__)
conservative_model = os.path.join(ROOT, 'models', 'densenet121_emotion_model_conservative.keras')
oversample_model = os.path.join(ROOT, 'models', 'densenet121_emotion_model_oversample.keras')
conservative_eval = os.path.join(ROOT, 'eval_conservative_results.json')
oversample_eval = os.path.join(ROOT, 'eval_oversample_results.json')


def load_metrics(path):
    if not os.path.exists(path):
        return None
    try:
        with open(path, 'r') as f:
            data = json.load(f)
        # Try common keys
        acc = data.get('accuracy') or data.get('test_accuracy') or data.get('overall_accuracy')
        macro_f1 = None
        # classification_report may be nested
        report = data.get('classification_report')
        if isinstance(report, dict):
            macro = report.get('macro avg') or report.get('macro_avg')
            if isinstance(macro, dict):
                macro_f1 = macro.get('f1-score') or macro.get('f1_score')
        return {'accuracy': acc, 'macro_f1': macro_f1}
    except Exception:
        return None


def select():
    cons = load_metrics(conservative_eval)
    over = load_metrics(oversample_eval)

    # Default preference order: oversample if metrics are missing but model exists
    if over and over.get('accuracy') is not None and cons and cons.get('accuracy') is not None:
        best = oversample_model if over['accuracy'] >= cons['accuracy'] else conservative_model
    elif over and over.get('macro_f1') is not None and cons and cons.get('macro_f1') is not None:
        best = oversample_model if over['macro_f1'] >= cons['macro_f1'] else conservative_model
    elif os.path.exists(oversample_model):
        best = oversample_model
    elif os.path.exists(conservative_model):
        best = conservative_model
    else:
        best = None

    if best is None:
        print('')
        return 1
    # Print absolute path for batch capture
    print(best)
    return 0

if __name__ == '__main__':
    sys.exit(select())
