import os
import json
import flask
from flask import request, jsonify
from werkzeug.utils import secure_filename

# Optional TensorFlow import for real inference
MODEL = None
LABELS = ["Natural","anger","fear","joy","sadness","surprise"]
try:
    import tensorflow as tf
    from tensorflow.keras.applications.densenet import preprocess_input
    import numpy as np
    from PIL import Image
    import cv2
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
    
    # Load image
    try:
        im = Image.open(img_path).convert('RGB')
    except Exception as e:
        print(f"[ERROR] Failed to open image: {e}")
        return None
    
    # Try face detection and cropping (same as predict_emotion.py)
    try:
        import cv2
        img_np = np.array(im)
        img_bgr = cv2.cvtColor(img_np, cv2.COLOR_RGB2BGR)
        
        # Load Haar cascade
        cascade_path = cv2.data.haarcascades + 'haarcascade_frontalface_default.xml'
        face_cascade = cv2.CascadeClassifier(cascade_path)
        
        gray = cv2.cvtColor(img_bgr, cv2.COLOR_BGR2GRAY)
        faces = face_cascade.detectMultiScale(gray, scaleFactor=1.1, minNeighbors=5, minSize=(30, 30))
        
        if len(faces) > 0:
            # Choose the largest detected face
            x, y, w, h = max(faces, key=lambda rect: rect[2] * rect[3])
            # Add padding around face
            pad = int(0.25 * max(w, h))
            x1 = max(0, x - pad)
            y1 = max(0, y - pad)
            x2 = min(img_bgr.shape[1], x + w + pad)
            y2 = min(img_bgr.shape[0], y + h + pad)
            face_img = img_bgr[y1:y2, x1:x2]
            # Convert back to RGB PIL Image
            face_rgb = cv2.cvtColor(face_img, cv2.COLOR_BGR2RGB)
            im = Image.fromarray(face_rgb)
        else:
            # No face found: center-crop to square
            w, h = im.size
            min_edge = min(w, h)
            left = (w - min_edge) // 2
            top = (h - min_edge) // 2
            im = im.crop((left, top, left + min_edge, top + min_edge))
    except Exception as e:
        print(f"[ERROR] Face detection/cropping failed: {e}")
        # If OpenCV not available or any error, fallback to center crop
        w, h = im.size
        min_edge = min(w, h)
        left = (w - min_edge) // 2
        top = (h - min_edge) // 2
        im = im.crop((left, top, left + min_edge, top + min_edge))
    
    # Resize to model input size
    try:
        im = im.resize((224, 224))
        x = np.array(im).astype('float32')
        x = preprocess_input(x)
        x = np.expand_dims(x, 0)
        probs = MODEL.predict(x, verbose=0)[0]
        top_idx = int(np.argmax(probs))
        pred = LABELS[top_idx]
        probs_dict = {LABELS[i]: float(probs[i]) for i in range(len(LABELS))}
        return pred, probs_dict
    except Exception as e:
        print(f"[ERROR] Model inference failed: {e}")
        return None

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
        print('[ERROR] No file uploaded')
        return jsonify({'error': 'No file uploaded'}), 400
    f = request.files['file']
    filename = secure_filename(f.filename or 'upload.jpg')
    save_path = os.path.join(UPLOAD_FOLDER, filename)
    f.save(save_path)

    # Force reload model for debugging
    global MODEL
    MODEL = None
    model_loaded = load_model_if_available()
    if not model_loaded:
        print('[ERROR] Model could not be loaded!')

    # Try real inference first
    pred = None
    probs_dict = None
    if MODEL is not None:
        try:
            res = infer_image(save_path)
            if res is not None:
                pred, probs_dict = res
        except Exception as e:
            print(f"[ERROR] Exception during inference: {e}")
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
    print('[ERROR] Prediction failed, returning uncertain.')
    return jsonify({
        'emotion': 'uncertain' if allow_uncertain else 'Natural',
        'confidence': 0.0,
        'allPredictions': all_preds,
        'details': { 'note': 'Stub ML service: real model not loaded or inference failed.' }
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
