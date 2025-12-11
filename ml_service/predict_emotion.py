"""
Emotion Recognition Inference Script
Uses trained DenseNet-121 model to predict emotions from images
"""

import os
import numpy as np
import tensorflow as tf
from tensorflow import keras
from tensorflow.keras.preprocessing import image
from PIL import Image
import cv2
import json
import io

class EmotionPredictor:
    def __init__(self, model_path='models/densenet121_emotion_model.h5', 
                 class_indices_path='models/class_indices.json'):
        """
        Initialize emotion predictor with trained model
        """
        # Allow dynamic override via environment variable ML_MODEL_PATH
        env_model = os.environ.get('ML_MODEL_PATH')
        if env_model and os.path.exists(env_model):
            self.model_path = env_model
        else:
            self.model_path = model_path
        self.class_indices_path = class_indices_path
        self.model = None
        self.class_indices = None
        self.img_size = (224, 224)
        
        # Load model and class indices
        self.load_model()
        self.load_class_indices()
    
    def load_model(self):
        """Load trained model"""
        # Prefer provided path; if it's an .h5, try sibling .keras first
        if self.model_path.lower().endswith('.h5'):
            keras_path = self.model_path[:-3] + 'keras'
        elif self.model_path.lower().endswith('.keras'):
            keras_path = self.model_path
        else:
            # default sibling .keras
            keras_path = self.model_path.replace('.h5', '.keras')
        
        if os.path.exists(keras_path):
            try:
                print(f"Loading model from {keras_path}...")
                self.model = keras.models.load_model(keras_path)
                print("Model loaded successfully!")
                return
            except Exception as e:
                print(f"Failed to load .keras format: {e}")
        
        if not os.path.exists(self.model_path):
            raise FileNotFoundError(
                f"Model not found at {self.model_path} or {keras_path}. Please train the model first."
            )
        
        print(f"Loading model from {self.model_path}...")
        try:
            self.model = keras.models.load_model(self.model_path)
            print("Model loaded successfully!")
        except Exception as e:
            print(f"Error loading HDF5 model: {e}")
            print("Trying with custom_objects...")
            self.model = keras.models.load_model(self.model_path, custom_objects=None)
            print("Model loaded with fallback.")

    
    def load_class_indices(self):
        """Load class indices mapping"""
        if not os.path.exists(self.class_indices_path):
            raise FileNotFoundError(
                f"Class indices not found at {self.class_indices_path}"
            )
        
        with open(self.class_indices_path, 'r') as f:
            self.class_indices = json.load(f)
        
        # Convert string keys to integers
        self.class_indices = {int(k): v for k, v in self.class_indices.items()}
        print(f"Class indices loaded: {self.class_indices}")
    
    def preprocess_image(self, img_input):
        """
        Preprocess image for prediction
        Args:
            img_input: Can be:
                - File path (string)
                - PIL Image object
                - Numpy array
                - Bytes/io.BytesIO
        Returns:
            Preprocessed image array
        """
        # Handle different input types
        if isinstance(img_input, str):
            # File path
            img = image.load_img(img_input, target_size=self.img_size)
        elif isinstance(img_input, Image.Image):
            # PIL Image
            # Keep original for face detection then resize later
            img = img_input.convert('RGB')
        elif isinstance(img_input, (bytes, io.BytesIO)):
            # Bytes or BytesIO
            if isinstance(img_input, bytes):
                img_input = io.BytesIO(img_input)
            img = Image.open(img_input)
            img = img.convert('RGB')
            img = img.resize(self.img_size)
        elif isinstance(img_input, np.ndarray):
            # Numpy array
            img = Image.fromarray(img_input)
            img = img.convert('RGB')
            # Keep original for face detection then resize later
            pass
        else:
            raise ValueError(f"Unsupported image input type: {type(img_input)}")
        # At this point, `img` is a PIL.Image in RGB (or was created above)
        # Try to detect a face and crop to it (OpenCV Haar cascade). If detection
        # fails, fall back to center-crop.
        try:
            # Convert PIL Image to numpy array (BGR for OpenCV)
            img_np = np.array(img)
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
                img_pil = Image.fromarray(face_rgb)
            else:
                # No face found: center-crop to square
                w, h = img.size
                min_edge = min(w, h)
                left = (w - min_edge) // 2
                top = (h - min_edge) // 2
                img_pil = img.crop((left, top, left + min_edge, top + min_edge))
        except Exception:
            # If OpenCV not available or any error, fallback to thumbnail-resize
            img_pil = img.copy()

        # Resize to model input size and convert to array
        img_pil = img_pil.resize(self.img_size)
        img_array = image.img_to_array(img_pil)

        # Expand dimensions for batch
        img_array = np.expand_dims(img_array, axis=0)

        # Preprocess for DenseNet
        img_array = tf.keras.applications.densenet.preprocess_input(img_array)

        return img_array
    
    def predict(self, img_input, return_confidence=True):
        """
        Predict emotion from image
        Args:
            img_input: Image input (path, PIL Image, numpy array, or bytes)
            return_confidence: Whether to return confidence scores
        Returns:
            Dictionary with predicted emotion and confidence
        """
        # Preprocess image
        processed_img = self.preprocess_image(img_input)
        
        # Predict
        predictions = self.model.predict(processed_img, verbose=0)
        
        # Get top prediction
        predicted_class_idx = np.argmax(predictions[0])
        confidence = float(predictions[0][predicted_class_idx])
        predicted_emotion = self.class_indices[predicted_class_idx]
        
        # Use the dataset's original emotion labels from class_indices
        # Keep the original label (preserves casing from class_indices.json)
        result = {
            'emotion': predicted_emotion,
            'confidence': confidence,
            'raw_prediction': predicted_emotion
        }
        
        if return_confidence:
            # Get all class probabilities
            all_predictions = {}
            # Return probabilities keyed by the original class label from class_indices
            for idx, prob in enumerate(predictions[0]):
                emotion_name = self.class_indices.get(idx, f'class_{idx}')
                all_predictions[emotion_name] = float(prob)
            
            result['all_predictions'] = all_predictions
        
        return result

# Global predictor instance
_predictor = None

def get_predictor():
    """Get or create global predictor instance"""
    global _predictor
    if _predictor is None:
        _predictor = EmotionPredictor()
    return _predictor

if __name__ == '__main__':
    # Test the predictor
    import sys
    
    if len(sys.argv) < 2:
        print("Usage: python predict_emotion.py <image_path>")
        sys.exit(1)
    
    image_path = sys.argv[1]
    
    predictor = EmotionPredictor()
    result = predictor.predict(image_path)
    
    print(f"\nPrediction Results:")
    print(f"   Emotion: {result['emotion']}")
    print(f"   Confidence: {result['confidence']:.4f}")
    print(f"   Raw Prediction: {result['raw_prediction']}")
    
    if 'all_predictions' in result:
        print(f"\n   All Predictions:")
        for emotion, prob in sorted(result['all_predictions'].items(), 
                                   key=lambda x: x[1], reverse=True):
            print(f"      {emotion}: {prob:.4f}")

