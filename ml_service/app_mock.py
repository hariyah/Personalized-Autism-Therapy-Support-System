"""
Mock Emotion Recognition API Server (for testing without TensorFlow)
Provides the same endpoints as the real ML service, returns simulated predictions
"""

from flask import Flask, request, jsonify
from flask_cors import CORS
import os
import random

app = Flask(__name__)
CORS(app)

# Mock emotions for testing
EMOTIONS = ['happy', 'sad', 'anxious', 'calm', 'excited', 'frustrated', 'neutral']

@app.route('/health', methods=['GET'])
def health_check():
    """Health check endpoint"""
    return jsonify({
        'status': 'healthy',
        'model_loaded': True,
        'note': 'Mock service for testing'
    })

@app.route('/predict', methods=['POST'])
def predict_emotion():
    """
    Mock emotion prediction endpoint
    Accepts: multipart/form-data with 'image' field
    Returns: JSON with emotion, confidence, and all predictions
    """
    if 'image' not in request.files:
        return jsonify({'error': 'No image file provided'}), 400
    
    file = request.files['image']
    if file.filename == '':
        return jsonify({'error': 'No file selected'}), 400
    
    try:
        # Read image (just to validate it's present, don't process)
        image_bytes = file.read()
        
        if len(image_bytes) > 16 * 1024 * 1024:
            return jsonify({'error': 'File too large. Maximum size: 16MB'}), 400
        
        # Generate mock prediction (deterministic based on file size for consistency)
        random.seed(len(image_bytes) % 1000)
        predicted_emotion = random.choice(EMOTIONS)
        confidence = round(random.uniform(0.5, 0.99), 2)
        
        # Generate all predictions with random confidences that sum to ~1.0
        all_pred = {}
        remaining = 1.0
        sorted_emotions = sorted(EMOTIONS)
        
        for i, emotion in enumerate(sorted_emotions[:-1]):
            pred_val = round(random.uniform(0.01, remaining - 0.01), 2)
            all_pred[emotion] = pred_val
            remaining -= pred_val
        
        all_pred[sorted_emotions[-1]] = round(remaining, 2)
        
        # Ensure the main prediction is in all_predictions
        all_pred[predicted_emotion] = confidence
        
        return jsonify({
            'success': True,
            'emotion': predicted_emotion,
            'confidence': confidence,
            'all_predictions': all_pred,
            'raw_prediction': f'Mock prediction for testing (file size: {len(image_bytes)} bytes)'
        })
    
    except Exception as e:
        print(f"Error during mock prediction: {e}")
        return jsonify({'error': f'Prediction failed: {str(e)}'}), 500

@app.route('/predict-base64', methods=['POST'])
def predict_emotion_base64():
    """
    Mock emotion prediction from base64 encoded image
    Accepts: JSON with 'image' field containing base64 string
    Returns: JSON with emotion, confidence, and all predictions
    """
    try:
        data = request.get_json()
        
        if 'image' not in data:
            return jsonify({'error': 'No image data provided'}), 400
        
        import base64
        
        # Decode base64 image
        image_data = data['image']
        if image_data.startswith('data:image'):
            image_data = image_data.split(',')[1]
        
        try:
            image_bytes = base64.b64decode(image_data)
        except:
            return jsonify({'error': 'Invalid base64 image data'}), 400
        
        # Generate mock prediction
        random.seed(len(image_bytes) % 1000)
        predicted_emotion = random.choice(EMOTIONS)
        confidence = round(random.uniform(0.5, 0.99), 2)
        
        # Generate all predictions
        all_pred = {}
        remaining = 1.0
        sorted_emotions = sorted(EMOTIONS)
        
        for emotion in sorted_emotions[:-1]:
            pred_val = round(random.uniform(0.01, remaining - 0.01), 2)
            all_pred[emotion] = pred_val
            remaining -= pred_val
        
        all_pred[sorted_emotions[-1]] = round(remaining, 2)
        all_pred[predicted_emotion] = confidence
        
        return jsonify({
            'success': True,
            'emotion': predicted_emotion,
            'confidence': confidence,
            'all_predictions': all_pred,
            'raw_prediction': f'Mock prediction from base64 (decoded size: {len(image_bytes)} bytes)'
        })
    
    except Exception as e:
        print(f"Error during mock prediction: {e}")
        return jsonify({'error': f'Prediction failed: {str(e)}'}), 500

@app.route('/emotions', methods=['GET'])
def get_emotions():
    """Get list of supported emotions"""
    return jsonify({'emotions': EMOTIONS})

if __name__ == '__main__':
    port = int(os.environ.get('PORT', 5000))
    print(f"\n🚀 Starting Mock Emotion Recognition API Server on port {port}")
    print(f"📡 Endpoints:")
    print(f"   POST /predict - Upload image file (mock prediction)")
    print(f"   POST /predict-base64 - Send base64 encoded image")
    print(f"   GET /health - Health check")
    print(f"   GET /emotions - Get supported emotions")
    print(f"\n⚠️  This is a MOCK service for testing without TensorFlow/model")
    app.run(host='0.0.0.0', port=port, debug=False)
