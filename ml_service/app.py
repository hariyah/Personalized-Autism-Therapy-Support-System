import os
import json
import flask
from flask import request, jsonify
from werkzeug.utils import secure_filename

# Optional TensorFlow import for real inference
MODEL = None
LABELS = ["Natural","joy","fear","anger","sadness","surprise"]
try:
    import tensorflow as tf
    from tensorflow.keras.applications.densenet import preprocess_input
    import numpy as np
    from PIL import Image
    TF_AVAILABLE = True
except Exception:
    TF_AVAILABLE = False
from werkzeug.utils import secure_filename
import os

app = flask.Flask(__name__)

# Basic config
UPLOAD_FOLDER = os.path.join(os.path.dirname(__file__), 'uploads')
os.makedirs(UPLOAD_FOLDER, exist_ok=True)

def load_model_if_available():
    global MODEL, LABELS
    if not TF_AVAILABLE:
        return False
    # Try BEST_MODEL_PATH.txt, else env ML_MODEL_PATH
    base_dir = os.path.dirname(__file__)
    best_path_txt = os.path.join(base_dir, 'BEST_MODEL_PATH.txt')
    model_path = None
    if os.path.exists(best_path_txt):
        with open(best_path_txt, 'r') as f:
            model_path = f.read().strip()
        if not os.path.isabs(model_path):
            model_path = os.path.join(base_dir, model_path)
    else:
        model_path = os.environ.get('ML_MODEL_PATH')
        if model_path and not os.path.isabs(model_path):
            model_path = os.path.join(base_dir, model_path)
    if model_path and os.path.exists(model_path):
        try:
            MODEL = tf.keras.models.load_model(model_path)
            # Try to load label map if present next to the model or in models dir
            try:
                label_dir = os.path.dirname(model_path)
                candidate_paths = [
                    os.path.join(label_dir, 'label_map.json'),
                    os.path.join(os.path.dirname(__file__), 'models', 'label_map.json')
                ]
                for lp in candidate_paths:
                    if os.path.exists(lp):
                        with open(lp, 'r', encoding='utf-8') as f:
                            data = json.load(f)
                        classes = data.get('classes') or data.get('labels')
                        if isinstance(classes, list) and len(classes) > 0:
                            LABELS = classes
                            break
            except Exception:
                pass
            return True
        except Exception:
            MODEL = None
            return False
    return False

def infer_image(img_path):
    """Return (pred_label, probs_dict) using loaded model, or None if unavailable."""
    if not TF_AVAILABLE or MODEL is None:
        return None
    im = Image.open(img_path).convert('RGB').resize((224,224))
    x = np.array(im).astype('float32')
    x = preprocess_input(x)
    x = np.expand_dims(x, 0)
    probs = MODEL.predict(x, verbose=0)[0]
    top_idx = int(np.argmax(probs))
    pred = LABELS[top_idx]
    probs_dict = {LABELS[i]: float(probs[i]) for i in range(len(LABELS))}
    return pred, probs_dict

@app.get('/health')
def health():
    return jsonify({
        'healthy': True,
        'modelLoaded': MODEL is not None,
        'tfAvailable': TF_AVAILABLE,
        'port': 5000
    })

@app.post('/predict')
def predict():
    if 'file' not in request.files:
        return jsonify({'error': 'No file uploaded'}), 400
    f = request.files['file']
    filename = secure_filename(f.filename or 'upload.jpg')
    save_path = os.path.join(UPLOAD_FOLDER, filename)
    f.save(save_path)

    # Try real inference first
    pred = None
    probs_dict = None
    if MODEL is None:
        load_model_if_available()
    if MODEL is not None:
        try:
            res = infer_image(save_path)
            if res is not None:
                pred, probs_dict = res
        except Exception:
            pred, probs_dict = None, None

    allow_uncertain = os.environ.get('EMOTION_ALLOW_UNCERTAIN', '1') == '1'
    if pred and probs_dict:
        conf = float(max(probs_dict.values()))
        return jsonify({
            'emotion': pred,
            'confidence': conf,
            'allPredictions': probs_dict
        })
    # Fallback stub
    all_preds = {label: 0.0 for label in LABELS}
    return jsonify({
        'emotion': 'uncertain' if allow_uncertain else 'Natural',
        'confidence': 0.0,
        'allPredictions': all_preds,
        'details': { 'note': 'Stub ML service: real model not loaded.' }
    })

# Recommendation endpoint
@app.post('/recommend')
def recommend():
    """Recommend activities based on user factors"""
    try:
        data = request.get_json()
        if not data:
            return jsonify({'error': 'No data provided'}), 400
        
        # Extract parameters
        emotion = data.get('emotion', 'Natural')
        interests = data.get('interests', [])
        financial_status = data.get('financial_status', 'medium')
        social_status = data.get('social_status', 'alone')
        autism_severity = data.get('autism_severity', 3)
        autism_type = data.get('autism_type', 'ASD-2')
        top_k = data.get('top_k', 6)
        
        # Import recommendation predictor
        try:
            from predict_recommendations import get_predictor
            predictor = get_predictor()
            recommendations = predictor.predict(
                emotion=emotion,
                interests=interests,
                financial_status=financial_status,
                social_status=social_status,
                autism_severity=autism_severity,
                autism_type=autism_type,
                top_k=top_k
            )
            
            return jsonify({
                'success': True,
                'recommendations': recommendations
            })
        except FileNotFoundError as e:
            return jsonify({
                'success': False,
                'error': 'Recommendation model not found. Please train the model first.',
                'details': str(e)
            }), 503
        except Exception as e:
            return jsonify({
                'success': False,
                'error': f'Prediction error: {str(e)}'
            }), 500
            
    except Exception as e:
        return jsonify({'error': str(e)}), 500

if __name__ == '__main__':
    # Attempt eager load to surface errors at startup
    load_model_if_available()
    app.run(host='0.0.0.0', port=5000)
