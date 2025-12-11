"""
Activity Recommendation Prediction Script
Uses trained neural network to recommend activities based on user factors
"""

import os
import numpy as np
import tensorflow as tf
from tensorflow import keras
import json

# Emotion encoding
EMOTIONS = ['Natural', 'joy', 'fear', 'anger', 'sadness', 'surprise']
EMOTION_TO_INT = {emotion: idx for idx, emotion in enumerate(EMOTIONS)}

# Interest categories
INTERESTS = ['train', 'cartoon', 'music', 'dance', 'art', 'sports', 'puzzles', 'outdoors', 
             'reading', 'visual', 'structured', 'quiet', 'play-based', 'movement', 
             'hands-on', 'sensory', 'artistic', 'creative', 'writing']

# Financial status encoding
FINANCIAL_STATUS = ['free', 'low', 'medium', 'high']
FINANCIAL_TO_INT = {status: idx for idx, status in enumerate(FINANCIAL_STATUS)}

# Social status encoding
SOCIAL_STATUS = ['alone', 'with-parent', 'group', 'community']
SOCIAL_TO_INT = {status: idx for idx, status in enumerate(SOCIAL_STATUS)}

class RecommendationPredictor:
    def __init__(self, model_path='models/recommendation_model.keras',
                 encoding_path='models/recommendation_encoding.json',
                 activity_mapping_path='models/activity_mapping.json'):
        """
        Initialize recommendation predictor
        """
        self.model_path = model_path
        self.encoding_path = encoding_path
        self.activity_mapping_path = activity_mapping_path
        self.model = None
        self.encoding_info = None
        self.activity_mapping = None
        
        # Load model and mappings
        self.load_model()
        self.load_encoding_info()
        self.load_activity_mapping()
    
    def load_model(self):
        """Load trained recommendation model"""
        if not os.path.exists(self.model_path):
            raise FileNotFoundError(
                f"Recommendation model not found at {self.model_path}. Please train the model first."
            )
        
        print(f"Loading recommendation model from {self.model_path}...")
        self.model = keras.models.load_model(self.model_path)
        print("Model loaded successfully!")
    
    def load_encoding_info(self):
        """Load encoding information"""
        if os.path.exists(self.encoding_path):
            with open(self.encoding_path, 'r') as f:
                self.encoding_info = json.load(f)
        else:
            # Use defaults
            self.encoding_info = {
                'emotions': EMOTIONS,
                'interests': INTERESTS,
                'financial_status': FINANCIAL_STATUS,
                'social_status': SOCIAL_STATUS
            }
    
    def load_activity_mapping(self):
        """Load activity ID mapping"""
        if os.path.exists(self.activity_mapping_path):
            with open(self.activity_mapping_path, 'r') as f:
                self.activity_mapping = json.load(f)
        else:
            # Default mapping
            self.activity_mapping = {str(i): i for i in range(15)}
    
    def encode_features(self, emotion, interests, financial_status, social_status, 
                       autism_severity, autism_type):
        """
        Encode all input features into a single feature vector
        """
        feature_vector = []
        
        # 1. Emotion (one-hot, 6 features)
        emotions_list = self.encoding_info.get('emotions', EMOTIONS)
        emotion_onehot = [0] * len(emotions_list)
        emotion_to_int = {em: idx for idx, em in enumerate(emotions_list)}
        if emotion in emotion_to_int:
            emotion_onehot[emotion_to_int[emotion]] = 1
        feature_vector.extend(emotion_onehot)
        
        # 2. Interests (binary vector)
        interests_list = self.encoding_info.get('interests', INTERESTS)
        interests_vector = [1 if interest in interests else 0 for interest in interests_list]
        feature_vector.extend(interests_vector)
        
        # 3. Financial status (one-hot)
        financial_list = self.encoding_info.get('financial_status', FINANCIAL_STATUS)
        financial_onehot = [0] * len(financial_list)
        financial_to_int = {fs: idx for idx, fs in enumerate(financial_list)}
        if financial_status in financial_to_int:
            financial_onehot[financial_to_int[financial_status]] = 1
        feature_vector.extend(financial_onehot)
        
        # 4. Social status (one-hot)
        social_list = self.encoding_info.get('social_status', SOCIAL_STATUS)
        social_onehot = [0] * len(social_list)
        social_to_int = {ss: idx for idx, ss in enumerate(social_list)}
        if social_status in social_to_int:
            social_onehot[social_to_int[social_status]] = 1
        feature_vector.extend(social_onehot)
        
        # 5. Autism severity (normalized to 0-1)
        normalized_severity = (autism_severity - 1) / 4.0 if autism_severity else 0.5
        feature_vector.append(normalized_severity)
        
        # 6. Autism type (hash encoding)
        type_hash = hash(str(autism_type)) % 1000 / 1000.0 if autism_type else 0.5
        feature_vector.append(type_hash)
        
        return np.array(feature_vector, dtype=np.float32)
    
    def predict(self, emotion, interests, financial_status, social_status,
                autism_severity, autism_type, top_k=6):
        """
        Predict recommended activities
        
        Args:
            emotion: str, one of the 6 emotions
            interests: list of str
            financial_status: str
            social_status: str
            autism_severity: int, 1-5
            autism_type: str
            top_k: int, number of top recommendations to return
        
        Returns:
            List of (activity_id, score) tuples, sorted by score
        """
        # Normalize emotion label (handle case variations)
        emotion_normalized = None
        for em in self.encoding_info.get('emotions', EMOTIONS):
            if str(emotion).lower() == str(em).lower():
                emotion_normalized = em
                break
        
        if emotion_normalized is None:
            # Default to first emotion if not found
            emotion_normalized = self.encoding_info.get('emotions', EMOTIONS)[0]
        
        # Encode features
        features = self.encode_features(
            emotion_normalized,
            interests or [],
            financial_status or 'medium',
            social_status or 'alone',
            autism_severity or 3,
            autism_type or 'ASD-2'
        )
        
        # Reshape for model input
        features = np.expand_dims(features, axis=0)
        
        # Predict
        predictions = self.model.predict(features, verbose=0)[0]
        
        # Get top-k activities
        top_indices = np.argsort(predictions)[::-1][:top_k]
        
        # Map indices to activity IDs
        recommendations = []
        for idx in top_indices:
            activity_id = self.activity_mapping.get(str(int(idx)), int(idx))
            score = float(predictions[idx])
            recommendations.append({
                'activity_id': activity_id,
                'score': score
            })
        
        return recommendations

# Global predictor instance
_predictor = None

def get_predictor():
    """Get or create global predictor instance"""
    global _predictor
    if _predictor is None:
        _predictor = RecommendationPredictor()
    return _predictor

if __name__ == '__main__':
    # Test the predictor
    predictor = RecommendationPredictor()
    
    # Example prediction
    result = predictor.predict(
        emotion='joy',
        interests=['music', 'art', 'visual'],
        financial_status='medium',
        social_status='group',
        autism_severity=3,
        autism_type='ASD-2',
        top_k=6
    )
    
    print("\nRecommendation Results:")
    for rec in result:
        print(f"   Activity ID: {rec['activity_id']}, Score: {rec['score']:.4f}")

